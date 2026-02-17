using LongLifeModels.Data;
using LongLifeModels.Domain;
using LongLifeModels.DTOs;
using LongLifeModels.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

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
                await ProcessAgentAsync(agentId, currentTickTime, ct);
            }
            finally
            {
                semaphore.Release();
            }
        });

        await Task.WhenAll(tasks);
    }

    private async Task ProcessAgentAsync(Guid agentId, DateTime currentTickTime, CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AgentDbContext>();
        var agentBrain = scope.ServiceProvider.GetRequiredService<AgentBrain>();
        var notifier = scope.ServiceProvider.GetRequiredService<IAgentRealtimeNotifier>();

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

        var lastUserMessage = await dbContext.AgentMessages
            .Where(x => x.AgentId == agent.Id && x.UserId == agent.UserId && x.Role == "user")
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(ct);

        var correlationId = lastUserMessage?.CorrelationId;
        var worldTime = await worldSimulationService.GetWorldTimeAsync(agent.UserId, ct);
        var worldContext = BuildWorldContext(agent, lastUserMessage?.Content, worldTime.GameTime);

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
            var assistantMessage = new AgentMessage
            {
                Id = Guid.NewGuid(),
                AgentId = agent.Id,
                UserId = agent.UserId,
                ThreadId = agent.ThreadId,
                Role = "assistant",
                Content = result.Action,
                CreatedAt = DateTimeOffset.UtcNow,
                CorrelationId = correlationId
            };

            dbContext.AgentMessages.Add(assistantMessage);
            agent.Status = AgentStatuses.Idle;
            agent.LastActiveAt = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(ct);

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
        catch (Exception ex)
        {
            agent.Status = AgentStatuses.Error;
            agent.LastActiveAt = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(ct);

            logger.LogError(ex, "Tick processing failed for agent {AgentId}.", agent.Id);

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

    private string BuildWorldContext(Agent agent, string? lastMessage, DateTimeOffset gameTime)
    {
        var context = $"Simulation time: {gameTime:yyyy-MM-dd HH:mm:ss}. Agent state: {agent.State}. Emotion: {agent.CurrentEmotion}. Last user message: {lastMessage ?? "(empty)"}";
        if (context.Length <= _config.WorldContextMaxLength)
        {
            return context;
        }

        return context[.._config.WorldContextMaxLength];
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
}
