using LongLifeModels.DTOs;
using LongLifeModels.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace LongLifeModels.Services;

public sealed class SignalRAgentRealtimeNotifier(
    IHubContext<AgentsHub> hubContext,
    ILogger<SignalRAgentRealtimeNotifier> logger) : IAgentRealtimeNotifier
{
    public Task NotifyAgentsListUpdatedAsync(
        string userId,
        IReadOnlyCollection<AgentDto> agents,
        string? correlationId,
        CancellationToken cancellationToken)
        => SendUserEventAsync(
            userId,
            AgentHubContracts.Events.AgentsListUpdated,
            new AgentsListUpdatedDto
            {
                UserId = userId,
                Agents = agents
            },
            correlationId,
            cancellationToken);

    public Task NotifyAgentStatusChangedAsync(
        string userId,
        AgentStatusDto status,
        string? correlationId,
        CancellationToken cancellationToken)
        => SendAgentEventAsync(
            userId,
            status.AgentId,
            AgentHubContracts.Events.AgentStatusChanged,
            status,
            correlationId,
            cancellationToken);

    public Task NotifyAgentMessageAsync(
        string userId,
        AgentMessageDto message,
        string? correlationId,
        CancellationToken cancellationToken)
        => SendAgentEventAsync(
            userId,
            message.AgentId,
            AgentHubContracts.Events.AgentMessage,
            message,
            correlationId,
            cancellationToken);

    public Task NotifyAgentThoughtAsync(
        string userId,
        AgentThoughtDto thought,
        string? correlationId,
        CancellationToken cancellationToken)
        => SendAgentEventAsync(
            userId,
            thought.AgentId,
            AgentHubContracts.Events.AgentThought,
            thought,
            correlationId,
            cancellationToken);

    public Task NotifyAgentProgressAsync(
        string userId,
        AgentProgressDto progress,
        string? correlationId,
        CancellationToken cancellationToken)
        => SendAgentEventAsync(
            userId,
            progress.AgentId,
            AgentHubContracts.Events.AgentProgress,
            progress,
            correlationId,
            cancellationToken);

    public Task NotifyAgentErrorAsync(
        string userId,
        ErrorDto error,
        CancellationToken cancellationToken)
        => SendAgentEventAsync(
            userId,
            error.AgentId ?? Guid.Empty,
            AgentHubContracts.Events.AgentError,
            error,
            error.CorrelationId,
            cancellationToken);

    private Task SendUserEventAsync<TPayload>(
        string userId,
        string eventType,
        TPayload payload,
        string? correlationId,
        CancellationToken cancellationToken)
    {
        var envelope = BuildEnvelope(eventType, payload, correlationId);
        logger.LogDebug("Dispatching SignalR event {EventType} to user group {UserGroup}.", eventType, AgentHubContracts.Groups.User(userId));
        return hubContext.Clients.Group(AgentHubContracts.Groups.User(userId)).SendAsync(eventType, envelope, cancellationToken);
    }

    private Task SendAgentEventAsync<TPayload>(
        string userId,
        Guid agentId,
        string eventType,
        TPayload payload,
        string? correlationId,
        CancellationToken cancellationToken)
    {
        var envelope = BuildEnvelope(eventType, payload, correlationId);
        if (agentId == Guid.Empty)
        {
            return hubContext.Clients.Group(AgentHubContracts.Groups.User(userId)).SendAsync(eventType, envelope, cancellationToken);
        }

        logger.LogDebug(
            "Dispatching SignalR event {EventType} to groups {UserGroup} and {AgentGroup}.",
            eventType,
            AgentHubContracts.Groups.User(userId),
            AgentHubContracts.Groups.Agent(agentId));

        return hubContext.Clients.Groups(
                AgentHubContracts.Groups.User(userId),
                AgentHubContracts.Groups.Agent(agentId))
            .SendAsync(eventType, envelope, cancellationToken);
    }

    private static RealtimeEnvelopeDto<TPayload> BuildEnvelope<TPayload>(string eventType, TPayload payload, string? correlationId)
        => new()
        {
            Type = eventType,
            Timestamp = DateTimeOffset.UtcNow,
            CorrelationId = correlationId,
            Payload = payload
        };
}
