using LongLifeModels.Data;
using LongLifeModels.Domain;
using LongLifeModels.DTOs;
using Microsoft.EntityFrameworkCore;

namespace LongLifeModels.Services;

public sealed class AgentCommandWorker(
    IServiceScopeFactory scopeFactory,
    IAgentCommandQueue commandQueue,
    ILogger<AgentCommandWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var workItem in commandQueue.DequeueAllAsync(stoppingToken))
        {
            try
            {
                await ProcessAsync(workItem, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                logger.LogInformation("Agent command worker is stopping.");
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Unhandled error while processing queued command for agent {AgentId}.", workItem.AgentId);
            }
        }
    }

    private async Task ProcessAsync(AgentCommandWorkItem workItem, CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AgentDbContext>();
        var agentBrain = scope.ServiceProvider.GetRequiredService<AgentBrain>();
        var notifier = scope.ServiceProvider.GetRequiredService<IAgentRealtimeNotifier>();

        var agent = await dbContext.Agents
            .FirstOrDefaultAsync(x => x.Id == workItem.AgentId && x.UserId == workItem.UserId && !x.IsArchived, cancellationToken);

        if (agent is null)
        {
            logger.LogWarning("Skipping command {CorrelationId}. Agent {AgentId} not found for user {UserId}.", workItem.CorrelationId, workItem.AgentId, workItem.UserId);
            return;
        }

        if (agent.Status == AgentStatuses.Stopped)
        {
            logger.LogInformation("Skipping command {CorrelationId} because agent {AgentId} is stopped.", workItem.CorrelationId, workItem.AgentId);
            return;
        }

        await notifier.NotifyAgentProgressAsync(
            workItem.UserId,
            new AgentProgressDto
            {
                AgentId = workItem.AgentId,
                UserId = workItem.UserId,
                Stage = "running",
                Message = "Agent is processing command.",
                Percent = 20
            },
            workItem.CorrelationId,
            cancellationToken);

        try
        {
            var result = await agentBrain.ThinkAsync(agent.Id, workItem.WorldContext, cancellationToken);

            await dbContext.Entry(agent).ReloadAsync(cancellationToken);
            if (agent.IsArchived || agent.Status == AgentStatuses.Stopped)
            {
                logger.LogInformation(
                    "Discarding command result {CorrelationId} for agent {AgentId} because agent was stopped or archived.",
                    workItem.CorrelationId,
                    workItem.AgentId);

                return;
            }

            var thought = new AgentThoughtDto
            {
                AgentId = agent.Id,
                UserId = agent.UserId,
                Stage = "reflection",
                Content = result.Reflection
            };

            await notifier.NotifyAgentThoughtAsync(workItem.UserId, thought, workItem.CorrelationId, cancellationToken);

            var assistantMessage = new AgentMessage
            {
                Id = Guid.NewGuid(),
                AgentId = agent.Id,
                UserId = agent.UserId,
                ThreadId = agent.ThreadId,
                Role = "assistant",
                Content = result.Action,
                CreatedAt = DateTimeOffset.UtcNow,
                CorrelationId = workItem.CorrelationId
            };

            dbContext.AgentMessages.Add(assistantMessage);
            agent.Status = AgentStatuses.Idle;
            agent.LastActiveAt = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);

            await notifier.NotifyAgentMessageAsync(
                workItem.UserId,
                ToMessageDto(assistantMessage),
                workItem.CorrelationId,
                cancellationToken);

            await notifier.NotifyAgentStatusChangedAsync(
                workItem.UserId,
                new AgentStatusDto
                {
                    AgentId = agent.Id,
                    UserId = agent.UserId,
                    Status = agent.Status,
                    Timestamp = DateTimeOffset.UtcNow
                },
                workItem.CorrelationId,
                cancellationToken);

            await notifier.NotifyAgentProgressAsync(
                workItem.UserId,
                new AgentProgressDto
                {
                    AgentId = workItem.AgentId,
                    UserId = workItem.UserId,
                    Stage = "completed",
                    Message = "Agent command completed.",
                    Percent = 100
                },
                workItem.CorrelationId,
                cancellationToken);

            await notifier.NotifyAgentsListUpdatedAsync(
                workItem.UserId,
                await GetActiveAgentsAsync(dbContext, workItem.UserId, cancellationToken),
                workItem.CorrelationId,
                cancellationToken);
        }
        catch (Exception ex)
        {
            agent.Status = AgentStatuses.Error;
            agent.LastActiveAt = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);

            logger.LogError(ex, "Agent command {CorrelationId} failed for agent {AgentId}.", workItem.CorrelationId, workItem.AgentId);

            await notifier.NotifyAgentStatusChangedAsync(
                workItem.UserId,
                new AgentStatusDto
                {
                    AgentId = workItem.AgentId,
                    UserId = workItem.UserId,
                    Status = AgentStatuses.Error,
                    Timestamp = DateTimeOffset.UtcNow
                },
                workItem.CorrelationId,
                cancellationToken);

            await notifier.NotifyAgentsListUpdatedAsync(
                workItem.UserId,
                await GetActiveAgentsAsync(dbContext, workItem.UserId, cancellationToken),
                workItem.CorrelationId,
                cancellationToken);

            await notifier.NotifyAgentErrorAsync(
                workItem.UserId,
                new ErrorDto
                {
                    Code = "agent_command_failed",
                    Message = ex.Message,
                    CorrelationId = workItem.CorrelationId,
                    AgentId = workItem.AgentId,
                    Timestamp = DateTimeOffset.UtcNow
                },
                cancellationToken);
        }
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
                PersonalityTraits = x.PersonalityTraits
            })
            .ToArray();
    }
}
