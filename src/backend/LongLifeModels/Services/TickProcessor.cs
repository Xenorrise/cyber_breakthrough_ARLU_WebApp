using LongLifeModels.Data;
using LongLifeModels.Domain;
using LongLifeModels.DTOs;
using LongLifeModels.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace LongLifeModels.Services;

public sealed class TickProcessor(
    IServiceScopeFactory scopeFactory,
    IOptions<TickProcessorOptions> options,
    IWorldSimulationService worldSimulationService,
    ILogger<TickProcessor> logger) : ITickProcessor
{
    private readonly TickProcessorOptions _config = options.Value;

    public async Task ProcessTickAsync(DateTime currentTickTime, CancellationToken ct)
    {
        IReadOnlyCollection<Guid> candidateIds;
        using (var scope = scopeFactory.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AgentDbContext>();
            candidateIds = await dbContext.Agents
                .Where(x => x.Status == AgentStatuses.Working && !x.IsArchived)
                .OrderBy(x => x.LastActiveAt)
                .Select(x => x.Id)
                .Take(_config.MaxAgentsPerTick)
                .ToArrayAsync(ct);
        }

        if (candidateIds.Count == 0)
        {
            logger.LogDebug("Tick {TickTime:o}: no agents ready for processing.", currentTickTime);
            return;
        }

        using var semaphore = new SemaphoreSlim(Math.Max(1, _config.MaxParallelism));
        var tasks = candidateIds.Select(async agentId =>
        {
                await semaphore.WaitAsync(ct);
            try
            {
                await ProcessAgentAsync(agentId, currentTickTime, ct, workItem: null);
            }
            finally
            {
                semaphore.Release();
            }
        });

        await Task.WhenAll(tasks);
    }

    public Task ProcessCommandAsync(AgentCommandWorkItem workItem, CancellationToken ct)
        => ProcessAgentAsync(workItem.AgentId, DateTime.UtcNow, ct, workItem);

    private async Task ProcessAgentAsync(Guid agentId, DateTime currentTickTime, CancellationToken ct, AgentCommandWorkItem? workItem)
    {
        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AgentDbContext>();
        var agentBrain = scope.ServiceProvider.GetRequiredService<AgentBrain>();
        var notifier = scope.ServiceProvider.GetRequiredService<IAgentRealtimeNotifier>();
        var eventService = scope.ServiceProvider.GetRequiredService<IEventService>();
        var memoryService = scope.ServiceProvider.GetRequiredService<MemoryService>();

        var agent = await dbContext.Agents
            .FirstOrDefaultAsync(x => x.Id == agentId && !x.IsArchived, ct);

        if (agent is null)
        {
            return;
        }

        if (agent.Status is AgentStatuses.Stopped or AgentStatuses.Paused)
        {
            logger.LogDebug("Skipping tick for agent {AgentId} because status is {Status}.", agent.Id, agent.Status);
            return;
        }

        var lastIncomingMessage = await dbContext.AgentMessages
            .Where(x => x.AgentId == agent.Id && x.UserId == agent.UserId && x.Role != "assistant")
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(ct);

        var incomingRawMessage = workItem?.WorldContext ?? lastIncomingMessage?.Content;
        var correlationId = string.IsNullOrWhiteSpace(workItem?.CorrelationId)
            ? lastIncomingMessage?.CorrelationId
            : workItem!.CorrelationId;
        var worldTime = await worldSimulationService.GetWorldTimeAsync(agent.UserId, ct);
        var incomingCommand = ParseIncomingCommand(incomingRawMessage);
        var worldContext = BuildWorldContext(agent, incomingCommand, worldTime.GameTime);

        await notifier.NotifyAgentProgressAsync(
            agent.UserId,
            new AgentProgressDto
            {
                AgentId = agent.Id,
                UserId = agent.UserId,
                Stage = "running",
                Message = "Tick processor is handling agent command.",
                Percent = 20
            },
            correlationId,
            ct);

        try
        {
            var result = await agentBrain.ThinkAsync(agent.Id, worldContext, ct);
            var reactionText = BuildReactionText(result.Action);
            var assistantMessage = new AgentMessage
            {
                Id = Guid.NewGuid(),
                AgentId = agent.Id,
                UserId = agent.UserId,
                ThreadId = agent.ThreadId,
                Role = "assistant",
                Content = reactionText,
                CreatedAt = DateTimeOffset.UtcNow,
                CorrelationId = correlationId
            };

            dbContext.AgentMessages.Add(assistantMessage);
            agent.Status = AgentStatuses.Idle;
            agent.LastActiveAt = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(ct);

            try
            {
                await memoryService.StoreMemoryAsync(
                    agent.Id,
                    relatedAgentId: null,
                    description: $"Input: {incomingCommand.Text ?? "(empty)"} | Output: {reactionText}",
                    importance: 0.58f,
                    cancellationToken: ct);
            }
            catch (Exception memoryError)
            {
                logger.LogDebug(memoryError, "Failed to persist conversational memory for agent {AgentId}.", agent.Id);
            }

            var reactionPayload = JsonSerializer.SerializeToElement(new
            {
                agentId = agent.Id,
                agentName = agent.Name,
                text = reactionText,
                message = reactionText,
                sourceMessage = incomingCommand.Text,
                sourceCommand = incomingCommand.Command,
                rawResponse = result.Action,
                gameTime = worldTime.GameTime.ToString("O"),
                correlationId
            });

            try
            {
                await eventService.CreateAsync(
                    new CreateEventRequestDto
                    {
                        Type = "agent.message",
                        Payload = reactionPayload,
                        OccurredAt = assistantMessage.CreatedAt
                    },
                    agent.UserId,
                    assistantMessage.CreatedAt,
                    ct);
            }
            catch (Exception eventWriteError)
            {
                logger.LogWarning(
                    eventWriteError,
                    "Failed to persist reaction event for agent {AgentId}, correlation {CorrelationId}.",
                    agent.Id,
                    correlationId);
            }

            await notifier.NotifyAgentThoughtAsync(
                agent.UserId,
                new AgentThoughtDto
                {
                    AgentId = agent.Id,
                    UserId = agent.UserId,
                    Stage = "reflection",
                    Content = result.Reflection
                },
                correlationId,
                ct);

            await notifier.NotifyAgentMessageAsync(
                agent.UserId,
                ToMessageDto(assistantMessage),
                correlationId,
                ct);

            await notifier.NotifyAgentStatusChangedAsync(
                agent.UserId,
                new AgentStatusDto
                {
                    AgentId = agent.Id,
                    UserId = agent.UserId,
                    Status = agent.Status,
                    Timestamp = DateTimeOffset.UtcNow
                },
                correlationId,
                ct);

            await notifier.NotifyAgentProgressAsync(
                agent.UserId,
                new AgentProgressDto
                {
                    AgentId = agent.Id,
                    UserId = agent.UserId,
                    Stage = "completed",
                    Message = "Tick command completed.",
                    Percent = 100
                },
                correlationId,
                ct);

            await notifier.NotifyAgentsListUpdatedAsync(
                agent.UserId,
                await GetActiveAgentsAsync(dbContext, agent.UserId, ct),
                correlationId,
                ct);
        }
        catch (HttpRequestException ex) when (ex.StatusCode is HttpStatusCode.Forbidden or HttpStatusCode.Unauthorized)
        {
            logger.LogWarning(
                ex,
                "Authorization failure while processing agent {AgentId}. Using fallback response.",
                agent.Id);

            var fallbackText = $"{agent.Name} продолжает работу в ограниченном режиме: внешний LLM временно недоступен (403/401).";
            var fallbackMessage = new AgentMessage
            {
                Id = Guid.NewGuid(),
                AgentId = agent.Id,
                UserId = agent.UserId,
                ThreadId = agent.ThreadId,
                Role = "assistant",
                Content = fallbackText,
                CreatedAt = DateTimeOffset.UtcNow,
                CorrelationId = correlationId
            };

            dbContext.AgentMessages.Add(fallbackMessage);
            agent.Status = AgentStatuses.Idle;
            agent.LastActiveAt = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(ct);

            var fallbackPayload = JsonSerializer.SerializeToElement(new
            {
                agentId = agent.Id,
                agentName = agent.Name,
                text = fallbackText,
                message = fallbackText,
                sourceMessage = incomingCommand.Text,
                sourceCommand = incomingCommand.Command,
                gameTime = worldTime.GameTime.ToString("O"),
                correlationId
            });

            try
            {
                await eventService.CreateAsync(
                    new CreateEventRequestDto
                    {
                        Type = "agent.message",
                        Payload = fallbackPayload,
                        OccurredAt = fallbackMessage.CreatedAt
                    },
                    agent.UserId,
                    fallbackMessage.CreatedAt,
                    ct);
            }
            catch (Exception eventWriteError)
            {
                logger.LogWarning(
                    eventWriteError,
                    "Failed to persist fallback event for agent {AgentId}, correlation {CorrelationId}.",
                    agent.Id,
                    correlationId);
            }

            await notifier.NotifyAgentMessageAsync(
                agent.UserId,
                ToMessageDto(fallbackMessage),
                correlationId,
                ct);

            await notifier.NotifyAgentStatusChangedAsync(
                agent.UserId,
                new AgentStatusDto
                {
                    AgentId = agent.Id,
                    UserId = agent.UserId,
                    Status = agent.Status,
                    Timestamp = DateTimeOffset.UtcNow
                },
                correlationId,
                ct);

            await notifier.NotifyAgentProgressAsync(
                agent.UserId,
                new AgentProgressDto
                {
                    AgentId = agent.Id,
                    UserId = agent.UserId,
                    Stage = "fallback",
                    Message = "Agent completed command in degraded mode.",
                    Percent = 100
                },
                correlationId,
                ct);

            await notifier.NotifyAgentsListUpdatedAsync(
                agent.UserId,
                await GetActiveAgentsAsync(dbContext, agent.UserId, ct),
                correlationId,
                ct);
        }
        catch (Exception ex)
        {
            agent.Status = AgentStatuses.Error;
            agent.LastActiveAt = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(ct);

            logger.LogError(ex, "Tick processing failed for agent {AgentId}.", agent.Id);

            var errorPayload = JsonSerializer.SerializeToElement(new
            {
                agentId = agent.Id,
                agentName = agent.Name,
                text = $"{agent.Name} не смог обработать событие: {ex.Message}",
                message = $"{agent.Name} не смог обработать событие: {ex.Message}",
                sourceMessage = incomingCommand.Text,
                sourceCommand = incomingCommand.Command,
                gameTime = worldTime.GameTime.ToString("O"),
                correlationId
            });

            try
            {
                await eventService.CreateAsync(
                    new CreateEventRequestDto
                    {
                        Type = "agent.error",
                        Payload = errorPayload,
                        OccurredAt = DateTimeOffset.UtcNow
                    },
                    agent.UserId,
                    null,
                    ct);
            }
            catch (Exception eventWriteError)
            {
                logger.LogWarning(
                    eventWriteError,
                    "Failed to persist error event for agent {AgentId}, correlation {CorrelationId}.",
                    agent.Id,
                    correlationId);
            }

            await notifier.NotifyAgentStatusChangedAsync(
                agent.UserId,
                new AgentStatusDto
                {
                    AgentId = agent.Id,
                    UserId = agent.UserId,
                    Status = agent.Status,
                    Timestamp = DateTimeOffset.UtcNow
                },
                correlationId,
                ct);

            await notifier.NotifyAgentsListUpdatedAsync(
                agent.UserId,
                await GetActiveAgentsAsync(dbContext, agent.UserId, ct),
                correlationId,
                ct);

            await notifier.NotifyAgentErrorAsync(
                agent.UserId,
                new ErrorDto
                {
                    Code = "tick_processor_failed",
                    Message = ex.Message,
                    CorrelationId = correlationId,
                    AgentId = agent.Id,
                    Timestamp = DateTimeOffset.UtcNow
                },
                ct);
        }
    }

    private string BuildWorldContext(Agent agent, IncomingCommand incomingCommand, DateTimeOffset gameTime)
    {
        var sourceText = string.IsNullOrWhiteSpace(incomingCommand.Text) ? "(empty)" : incomingCommand.Text;
        var commandPart = string.IsNullOrWhiteSpace(incomingCommand.Command)
            ? string.Empty
            : $" Command: {incomingCommand.Command}.";
        var sourcePrefix = incomingCommand.IsWorldUpdate ? "Incoming world event" : "Last user message";
        var context = $"Simulation time: {gameTime:yyyy-MM-dd HH:mm:ss}. Agent state: {agent.State}. Emotion: {agent.CurrentEmotion}.{commandPart} {sourcePrefix}: {sourceText}";
        if (context.Length <= _config.WorldContextMaxLength)
        {
            return context;
        }

        return context[.._config.WorldContextMaxLength];
    }

    private static IncomingCommand ParseIncomingCommand(string? rawMessage)
    {
        if (string.IsNullOrWhiteSpace(rawMessage))
        {
            return new IncomingCommand(Command: null, Text: null, IsWorldUpdate: false);
        }

        var lines = rawMessage
            .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .ToArray();

        if (lines.Length == 0)
        {
            return new IncomingCommand(Command: null, Text: null, IsWorldUpdate: false);
        }

        if (lines.Length == 1)
        {
            var onlyLine = lines[0];
            if (!LooksLikeCommandToken(onlyLine))
            {
                return new IncomingCommand(Command: null, Text: onlyLine, IsWorldUpdate: false);
            }

            var isSingleWorldUpdate = string.Equals(onlyLine, "world.update", StringComparison.OrdinalIgnoreCase);
            return new IncomingCommand(onlyLine, onlyLine, isSingleWorldUpdate);
        }

        var command = LooksLikeCommandToken(lines[0]) ? lines[0] : null;
        var text = command is null
            ? string.Join(" ", lines)
            : string.Join(" ", lines.Skip(1));
        if (string.IsNullOrWhiteSpace(text))
        {
            text = command;
        }

        var isWorldUpdate = string.Equals(command, "world.update", StringComparison.OrdinalIgnoreCase);
        return new IncomingCommand(command, text, isWorldUpdate);
    }

    private static string BuildReactionText(string rawAction)
    {
        if (string.IsNullOrWhiteSpace(rawAction))
        {
            return "Agent processed the request.";
        }

        var lines = rawAction.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        foreach (var line in lines)
        {
            var normalized = NormalizeLine(line);
            if (!normalized.StartsWith("ActionText", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var separator = normalized.IndexOf(':');
            var extracted = separator >= 0
                ? normalized[(separator + 1)..].Trim()
                : normalized["ActionText".Length..].Trim();
            extracted = CleanupGeneratedText(extracted);
            if (!string.IsNullOrWhiteSpace(extracted))
            {
                return extracted.Length <= 220 ? extracted : $"{extracted[..217]}...";
            }
        }

        var meaningfulLines = lines
            .Select(NormalizeLine)
            .Where(line =>
                !line.StartsWith("ActionName", StringComparison.OrdinalIgnoreCase) &&
                !line.StartsWith("ActionText", StringComparison.OrdinalIgnoreCase))
            .ToArray();

        var source = meaningfulLines.Length > 0
            ? string.Join(" ", meaningfulLines)
            : rawAction;
        var compact = CleanupGeneratedText(source);
        return compact.Length <= 220 ? compact : $"{compact[..217]}...";
    }

    private static bool LooksLikeCommandToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return false;
        }

        var normalized = token.Trim().ToLowerInvariant();
        if (normalized.Length > 120 || normalized.Contains(' '))
        {
            return false;
        }

        return normalized == "world.update" ||
               normalized.StartsWith("chat.", StringComparison.Ordinal) ||
               normalized.StartsWith("action.", StringComparison.Ordinal) ||
               normalized.StartsWith("custom.", StringComparison.Ordinal) ||
               normalized.StartsWith("ui.", StringComparison.Ordinal) ||
               normalized.StartsWith("system.", StringComparison.Ordinal);
    }

    private static string NormalizeLine(string line)
        => line.Trim().Trim('*', '-', ' ');

    private static string CleanupGeneratedText(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var cleaned = value
            .Replace("**", " ")
            .Replace('�', '"')
            .Replace('�', '"')
            .Trim()
            .Trim('"', '\'');

        cleaned = Regex.Replace(cleaned, "\\s+", " ").Trim();
        return cleaned;
    }

    private static AgentMessageDto ToMessageDto(AgentMessage message)
        => new()
        {
            MessageId = message.Id,
            AgentId = message.AgentId,
            UserId = message.UserId,
            ThreadId = message.ThreadId,
            Role = message.Role,
            Content = message.Content,
            CreatedAt = message.CreatedAt,
            CorrelationId = message.CorrelationId
        };

    private static async Task<IReadOnlyCollection<AgentDto>> GetActiveAgentsAsync(
        AgentDbContext dbContext,
        string userId,
        CancellationToken cancellationToken)
    {
        var agents = await dbContext.Agents
            .Where(x => x.UserId == userId && !x.IsArchived)
            .OrderByDescending(x => x.LastActiveAt)
            .ToArrayAsync(cancellationToken);

        return agents
            .Select(x => new AgentDto
            {
                AgentId = x.Id,
                UserId = x.UserId,
                Name = x.Name,
                Model = x.Model,
                Status = x.Status,
                State = x.State,
                Energy = x.Energy,
                ThreadId = x.ThreadId,
                CreatedAt = x.CreatedAt,
                LastActiveAt = x.LastActiveAt,
                PersonalityTraits = x.PersonalityTraits,
                Description = x.Description,
                Emotion = x.CurrentEmotion,
                Traits = string.IsNullOrWhiteSpace(x.TraitSummary)
                    ? null
                    : x.TraitSummary.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries),
                CurrentPlan = x.State
            })
            .ToArray();
    }

    private sealed record IncomingCommand(string? Command, string? Text, bool IsWorldUpdate);
}

