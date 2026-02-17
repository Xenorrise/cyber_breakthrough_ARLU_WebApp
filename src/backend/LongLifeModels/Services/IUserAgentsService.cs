using LongLifeModels.DTOs;

namespace LongLifeModels.Services;

public interface IUserAgentsService
{
    Task<AgentDto> CreateAgentAsync(string userId, CreateAgentRequestDto request, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<AgentDto>> GetAgentsAsync(string userId, CancellationToken cancellationToken);
    Task<AgentDto?> GetAgentAsync(string userId, Guid agentId, CancellationToken cancellationToken);
    Task<PagedResultDto<AgentMessageDto>> GetMessagesAsync(string userId, Guid agentId, int limit, CancellationToken cancellationToken);
    Task<AgentStatusDto> PauseAgentAsync(string userId, Guid agentId, CancellationToken cancellationToken);
    Task<AgentStatusDto> ResumeAgentAsync(string userId, Guid agentId, CancellationToken cancellationToken);
    Task<AgentStatusDto> StopAgentAsync(string userId, Guid agentId, CancellationToken cancellationToken);
    Task<CommandAckDto> CommandAgentAsync(string userId, Guid agentId, CommandAgentRequestDto request, CancellationToken cancellationToken);
    Task ArchiveAgentAsync(string userId, Guid agentId, CancellationToken cancellationToken);
}
