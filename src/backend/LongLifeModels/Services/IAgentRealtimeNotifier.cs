using LongLifeModels.DTOs;

namespace LongLifeModels.Services;

public interface IAgentRealtimeNotifier
{
    Task NotifyAgentsListUpdatedAsync(string userId, IReadOnlyCollection<AgentDto> agents, string? correlationId, CancellationToken cancellationToken);
    Task NotifyAgentStatusChangedAsync(string userId, AgentStatusDto status, string? correlationId, CancellationToken cancellationToken);
    Task NotifyAgentMessageAsync(string userId, AgentMessageDto message, string? correlationId, CancellationToken cancellationToken);
    Task NotifyAgentThoughtAsync(string userId, AgentThoughtDto thought, string? correlationId, CancellationToken cancellationToken);
    Task NotifyAgentProgressAsync(string userId, AgentProgressDto progress, string? correlationId, CancellationToken cancellationToken);
    Task NotifyAgentErrorAsync(string userId, ErrorDto error, CancellationToken cancellationToken);
}
