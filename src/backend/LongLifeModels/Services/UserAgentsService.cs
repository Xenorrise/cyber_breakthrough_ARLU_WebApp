using LongLifeModels.Data;
using LongLifeModels.Domain;
using LongLifeModels.DTOs;
using LongLifeModels.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace LongLifeModels.Services;

public sealed class UserAgentsService(
    AgentDbContext dbContext,
    IAgentCommandQueue commandQueue,
    IAgentRealtimeNotifier realtimeNotifier,
    IOptions<OpenAIOptions> openAiOptions,
    ILogger<UserAgentsService> logger) : IUserAgentsService
{
    public async Task<AgentDto> CreateAgentAsync(string userId, CreateAgentRequestDto request, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var agent = new Agent
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = request.Name.Trim(),
            Model = string.IsNullOrWhiteSpace(request.Model) ? openAiOptions.Value.ChatModel : request.Model.Trim(),
            Status = AgentStatuses.Creating,
            State = string.IsNullOrWhiteSpace(request.InitialState) ? "Ready" : request.InitialState.Trim(),
            Energy = request.InitialEnergy,
            ThreadId = Guid.NewGuid(),
            CreatedAt = now,
            LastActiveAt = now,
            PersonalityTraits = request.PersonalityTraits,
            IsArchived = false
        };

        dbContext.Agents.Add(agent);
        await dbContext.SaveChangesAsync(cancellationToken);

        agent.Status = AgentStatuses.Idle;
        agent.LastActiveAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        var agentDto = ToAgentDto(agent);
        logger.LogInformation("Created agent {AgentId} for user {UserId}.", agent.Id, userId);

        await realtimeNotifier.NotifyAgentStatusChangedAsync(userId, ToStatusDto(agent), correlationId: null, cancellationToken);
        await NotifyListUpdatedAsync(userId, cancellationToken);

        return agentDto;
    }

    public async Task<IReadOnlyCollection<AgentDto>> GetAgentsAsync(string userId, CancellationToken cancellationToken)
    {
        var agents = await dbContext.Agents
            .Where(x => x.UserId == userId && !x.IsArchived)
            .OrderByDescending(x => x.LastActiveAt)
            .ToArrayAsync(cancellationToken);

        return agents.Select(ToAgentDto).ToArray();
    }

    public async Task<AgentDto?> GetAgentAsync(string userId, Guid agentId, CancellationToken cancellationToken)
    {
        var agent = await dbContext.Agents
            .FirstOrDefaultAsync(x => x.Id == agentId && x.UserId == userId && !x.IsArchived, cancellationToken);

        return agent is null ? null : ToAgentDto(agent);
    }

    public async Task<PagedResultDto<AgentMessageDto>> GetMessagesAsync(string userId, Guid agentId, int limit, CancellationToken cancellationToken)
    {
        var agent = await RequireOwnedAgentAsync(userId, agentId, cancellationToken);
        var safeLimit = Math.Clamp(limit, 1, 200);
        var items = await dbContext.AgentMessages
            .Where(x => x.AgentId == agent.Id && x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(safeLimit)
            .OrderBy(x => x.CreatedAt)
            .ToArrayAsync(cancellationToken);

        return new PagedResultDto<AgentMessageDto>
        {
            Items = items.Select(ToAgentMessageDto).ToArray(),
            Pagination = new PaginationDto
            {
                Limit = safeLimit,
                Returned = items.Length
            }
        };
    }

    public Task<AgentStatusDto> PauseAgentAsync(string userId, Guid agentId, CancellationToken cancellationToken)
        => TransitionStatusAsync(userId, agentId, AgentStatuses.Paused, cancellationToken);

    public Task<AgentStatusDto> ResumeAgentAsync(string userId, Guid agentId, CancellationToken cancellationToken)
        => TransitionStatusAsync(userId, agentId, AgentStatuses.Idle, cancellationToken);

    public Task<AgentStatusDto> StopAgentAsync(string userId, Guid agentId, CancellationToken cancellationToken)
        => TransitionStatusAsync(userId, agentId, AgentStatuses.Stopped, cancellationToken);

    public async Task<CommandAckDto> CommandAgentAsync(
        string userId,
        Guid agentId,
        CommandAgentRequestDto request,
        CancellationToken cancellationToken)
    {
        var agent = await RequireOwnedAgentAsync(userId, agentId, cancellationToken);

        if (agent.Status == AgentStatuses.Paused)
        {
            throw new InvalidOperationException("Agent is paused. Resume agent before sending commands.");
        }

        if (agent.Status == AgentStatuses.Stopped)
        {
            throw new InvalidOperationException("Agent is stopped. Resume agent before sending commands.");
        }

        var correlationId = string.IsNullOrWhiteSpace(request.CorrelationId)
            ? Guid.NewGuid().ToString("N")
            : request.CorrelationId.Trim();

        var messageText = BuildCommandText(request);
        var userMessage = new AgentMessage
        {
            Id = Guid.NewGuid(),
            AgentId = agent.Id,
            UserId = userId,
            ThreadId = agent.ThreadId,
            Role = "user",
            Content = messageText,
            CreatedAt = DateTimeOffset.UtcNow,
            CorrelationId = correlationId
        };

        dbContext.AgentMessages.Add(userMessage);
        agent.Status = AgentStatuses.Working;
        agent.LastActiveAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        await realtimeNotifier.NotifyAgentMessageAsync(userId, ToAgentMessageDto(userMessage), correlationId, cancellationToken);
        await realtimeNotifier.NotifyAgentStatusChangedAsync(userId, ToStatusDto(agent), correlationId, cancellationToken);
        await realtimeNotifier.NotifyAgentProgressAsync(
            userId,
            new AgentProgressDto
            {
                AgentId = agent.Id,
                UserId = userId,
                Stage = "queued",
                Message = "Agent command queued.",
                Percent = 5
            },
            correlationId,
            cancellationToken);

        await commandQueue.EnqueueAsync(
            new AgentCommandWorkItem(agent.Id, userId, messageText, correlationId, DateTimeOffset.UtcNow),
            cancellationToken);

        await NotifyListUpdatedAsync(userId, cancellationToken);

        logger.LogInformation("Queued command for agent {AgentId} (user {UserId}, correlation {CorrelationId}).", agent.Id, userId, correlationId);
        return new CommandAckDto
        {
            AgentId = agentId,
            UserId = userId,
            CorrelationId = correlationId,
            Status = AgentStatuses.Working,
            AcceptedAt = DateTimeOffset.UtcNow
        };
    }

    public async Task ArchiveAgentAsync(string userId, Guid agentId, CancellationToken cancellationToken)
    {
        var agent = await RequireOwnedAgentAsync(userId, agentId, cancellationToken);
        agent.IsArchived = true;
        agent.Status = AgentStatuses.Stopped;
        agent.LastActiveAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Archived agent {AgentId} for user {UserId}.", agentId, userId);

        await realtimeNotifier.NotifyAgentStatusChangedAsync(userId, ToStatusDto(agent), correlationId: null, cancellationToken);
        await NotifyListUpdatedAsync(userId, cancellationToken);
    }

    private async Task<AgentStatusDto> TransitionStatusAsync(string userId, Guid agentId, string status, CancellationToken cancellationToken)
    {
        var agent = await RequireOwnedAgentAsync(userId, agentId, cancellationToken);

        agent.Status = status;
        agent.LastActiveAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Agent {AgentId} transitioned to status {Status}.", agentId, status);
        var dto = ToStatusDto(agent);

        await realtimeNotifier.NotifyAgentStatusChangedAsync(userId, dto, correlationId: null, cancellationToken);
        await NotifyListUpdatedAsync(userId, cancellationToken);

        return dto;
    }

    private async Task<Agent> RequireOwnedAgentAsync(string userId, Guid agentId, CancellationToken cancellationToken)
    {
        var agent = await dbContext.Agents
            .FirstOrDefaultAsync(x => x.Id == agentId && x.UserId == userId && !x.IsArchived, cancellationToken);

        return agent ?? throw new KeyNotFoundException($"Agent '{agentId}' was not found for user '{userId}'.");
    }

    private async Task NotifyListUpdatedAsync(string userId, CancellationToken cancellationToken)
    {
        var agents = await GetAgentsAsync(userId, cancellationToken);
        await realtimeNotifier.NotifyAgentsListUpdatedAsync(userId, agents, correlationId: null, cancellationToken);
    }

    private static string BuildCommandText(CommandAgentRequestDto request)
    {
        var pieces = new[]
        {
            request.Command?.Trim(),
            request.Message?.Trim()
        };

        return string.Join(Environment.NewLine, pieces.Where(x => !string.IsNullOrWhiteSpace(x)));
    }

    private static AgentDto ToAgentDto(Agent agent)
        => new()
        {
            AgentId = agent.Id,
            UserId = agent.UserId,
            Name = agent.Name,
            Model = agent.Model,
            Status = agent.Status,
            State = agent.State,
            Energy = agent.Energy,
            ThreadId = agent.ThreadId,
            CreatedAt = agent.CreatedAt,
            LastActiveAt = agent.LastActiveAt,
            PersonalityTraits = agent.PersonalityTraits
        };

    private static AgentStatusDto ToStatusDto(Agent agent)
        => new()
        {
            AgentId = agent.Id,
            UserId = agent.UserId,
            Status = agent.Status,
            Timestamp = DateTimeOffset.UtcNow
        };

    private static AgentMessageDto ToAgentMessageDto(AgentMessage message)
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
}
