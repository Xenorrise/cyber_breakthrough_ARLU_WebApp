using LongLifeModels.Data;
using LongLifeModels.Domain;
using LongLifeModels.DTOs;
using LongLifeModels.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace LongLifeModels.Services;

public sealed class UserAgentsService(
    AgentDbContext dbContext,
    IAgentCommandQueue commandQueue,
    IAgentRealtimeNotifier realtimeNotifier,
    IWorldSimulationService worldSimulationService,
    ILLMService llmService,
    IOptions<OpenAIOptions> openAiOptions,
    ILogger<UserAgentsService> logger) : IUserAgentsService
{
    private const string AiAgentGenerationSystemPrompt =
        """
        You generate one software-agent profile for a simulation.
        Return ONLY a JSON object with this exact schema:
        {
          "name": "string, max 120 chars",
          "initialState": "string, max 400 chars",
          "description": "string, max 1000 chars",
          "initialEmotion": "string, max 80 chars",
          "traitSummary": "comma-separated traits, max 500 chars",
          "initialEnergy": "number from 0 to 1",
          "personalityTraits": {
            "openness": "number from 0 to 1",
            "conscientiousness": "number from 0 to 1",
            "extraversion": "number from 0 to 1",
            "agreeableness": "number from 0 to 1",
            "neuroticism": "number from 0 to 1"
          }
        }
        No markdown, no code fences, no additional keys.
        """;

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
            Description = string.IsNullOrWhiteSpace(request.Description) ? "Generated simulation agent." : request.Description.Trim(),
            CurrentEmotion = NormalizeEmotion(request.InitialEmotion),
            TraitSummary = NormalizeTraitSummary(request.TraitSummary),
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

    public async Task<AgentDto> CreateAgentWithAiAsync(string userId, GenerateAgentWithAiRequestDto request, CancellationToken cancellationToken)
    {
        var userPrompt =
            $"User request for a new agent:{Environment.NewLine}" +
            $"{request.Prompt.Trim()}{Environment.NewLine}{Environment.NewLine}" +
            "Generate one agent profile JSON that best matches the request.";

        var rawResponse = await llmService.GenerateAsync(AiAgentGenerationSystemPrompt, userPrompt, cancellationToken);
        var blueprint = ParseAiAgentBlueprint(rawResponse);

        var createRequest = new CreateAgentRequestDto
        {
            Name = NormalizeName(blueprint.Name),
            Model = string.IsNullOrWhiteSpace(request.Model) ? null : request.Model.Trim(),
            InitialState = NormalizeText(blueprint.InitialState ?? blueprint.State, maxLength: 400),
            Description = NormalizeText(blueprint.Description, maxLength: 1000),
            InitialEmotion = NormalizeText(blueprint.InitialEmotion, maxLength: 80),
            TraitSummary = NormalizeText(blueprint.TraitSummary, maxLength: 500),
            InitialEnergy = NormalizeScore(blueprint.InitialEnergy ?? blueprint.Energy ?? 0.8f),
            PersonalityTraits = NormalizeTraits(blueprint.PersonalityTraits ?? blueprint.Traits)
        };

        logger.LogInformation(
            "Generated agent blueprint with AI for user {UserId}. Agent name: {AgentName}.",
            userId,
            createRequest.Name);

        return await CreateAgentAsync(userId, createRequest, cancellationToken);
    }

    public async Task<IReadOnlyCollection<AgentDto>> GetAgentsAsync(string userId, CancellationToken cancellationToken)
    {
        await worldSimulationService.EnsureUserWorldAsync(userId, cancellationToken);

        var agents = await dbContext.Agents
            .Where(x => x.UserId == userId && !x.IsArchived)
            .OrderByDescending(x => x.LastActiveAt)
            .ToArrayAsync(cancellationToken);

        var memoriesByAgent = await LoadRecentMemoriesByAgentAsync(agents.Select(x => x.Id), cancellationToken);
        return agents.Select(agent => ToAgentDto(agent, memoriesByAgent.GetValueOrDefault(agent.Id))).ToArray();
    }

    public async Task<AgentDto?> GetAgentAsync(string userId, Guid agentId, CancellationToken cancellationToken)
    {
        await worldSimulationService.EnsureUserWorldAsync(userId, cancellationToken);

        var agent = await dbContext.Agents
            .FirstOrDefaultAsync(x => x.Id == agentId && x.UserId == userId && !x.IsArchived, cancellationToken);

        if (agent is null)
        {
            return null;
        }

        var memories = await dbContext.MemoryLogs
            .Where(x => x.AgentId == agent.Id)
            .OrderByDescending(x => x.Timestamp)
            .Take(5)
            .Select(x => x.Description)
            .ToArrayAsync(cancellationToken);

        return ToAgentDto(agent, memories);
    }

    public async Task<PagedResultDto<AgentMessageDto>> GetMessagesAsync(string userId, Guid agentId, int limit, CancellationToken cancellationToken)
    {
        await worldSimulationService.EnsureUserWorldAsync(userId, cancellationToken);

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

    public async Task<PagedResultDto<AgentMessageDto>> GetMessagesAsync(
        string userId,
        int limitPerAgent,
        CancellationToken cancellationToken)
    {
        await worldSimulationService.EnsureUserWorldAsync(userId, cancellationToken);

        var safeLimitPerAgent = Math.Clamp(limitPerAgent, 1, 200);
        var ownedAgentIds = await dbContext.Agents
            .Where(x => x.UserId == userId && !x.IsArchived)
            .Select(x => x.Id)
            .ToArrayAsync(cancellationToken);

        if (ownedAgentIds.Length == 0)
        {
            return new PagedResultDto<AgentMessageDto>
            {
                Items = Array.Empty<AgentMessageDto>(),
                Pagination = new PaginationDto
                {
                    Limit = safeLimitPerAgent,
                    Returned = 0
                }
            };
        }

        var recentMessages = await dbContext.AgentMessages
            .Where(x => x.UserId == userId && ownedAgentIds.Contains(x.AgentId))
            .OrderByDescending(x => x.CreatedAt)
            .ToArrayAsync(cancellationToken);

        var items = recentMessages
            .GroupBy(x => x.AgentId)
            .SelectMany(group => group.Take(safeLimitPerAgent))
            .OrderBy(x => x.CreatedAt)
            .ToArray();

        return new PagedResultDto<AgentMessageDto>
        {
            Items = items.Select(ToAgentMessageDto).ToArray(),
            Pagination = new PaginationDto
            {
                Limit = safeLimitPerAgent,
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
            Role = ResolveMessageRole(request.Command),
            Content = messageText,
            CreatedAt = DateTimeOffset.UtcNow,
            CorrelationId = correlationId
        };

        dbContext.AgentMessages.Add(userMessage);
        agent.State = BuildNextState(agent.State, request);
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

    public async Task<BroadcastCommandAckDto> BroadcastCommandAsync(
        string userId,
        BroadcastAgentCommandRequestDto request,
        CancellationToken cancellationToken)
    {
        await worldSimulationService.EnsureUserWorldAsync(userId, cancellationToken);

        var targetAgentIds = request.AgentIds is { Count: > 0 }
            ? request.AgentIds.Distinct().ToArray()
            : await dbContext.Agents
                .Where(x => x.UserId == userId && !x.IsArchived)
                .OrderByDescending(x => x.LastActiveAt)
                .Select(x => x.Id)
                .ToArrayAsync(cancellationToken);

        var items = new List<BroadcastCommandItemDto>(targetAgentIds.Length);
        foreach (var targetAgentId in targetAgentIds)
        {
            try
            {
                var accepted = await CommandAgentAsync(
                    userId,
                    targetAgentId,
                    new CommandAgentRequestDto
                    {
                        Command = request.Command,
                        Message = request.Message,
                        CorrelationId = request.CorrelationId
                    },
                    cancellationToken);

                items.Add(new BroadcastCommandItemDto
                {
                    AgentId = targetAgentId,
                    Status = "accepted",
                    CorrelationId = accepted.CorrelationId
                });
            }
            catch (Exception ex) when (ex is InvalidOperationException or KeyNotFoundException)
            {
                items.Add(new BroadcastCommandItemDto
                {
                    AgentId = targetAgentId,
                    Status = "rejected",
                    Reason = ex.Message
                });
            }
        }

        var acceptedCount = items.Count(x => string.Equals(x.Status, "accepted", StringComparison.OrdinalIgnoreCase));
        var rejectedCount = items.Count - acceptedCount;

        return new BroadcastCommandAckDto
        {
            UserId = userId,
            AcceptedAt = DateTimeOffset.UtcNow,
            AcceptedCount = acceptedCount,
            RejectedCount = rejectedCount,
            Items = items
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
        var command = request.Command?.Trim();
        var message = request.Message?.Trim();

        if (string.IsNullOrWhiteSpace(message))
        {
            return command ?? string.Empty;
        }

        if (IsSystemCommand(command))
        {
            return string.IsNullOrWhiteSpace(command)
                ? message
                : $"{command}{Environment.NewLine}{message}";
        }

        return message;
    }

    private static string ResolveMessageRole(string? command)
        => IsSystemCommand(command) ? "system" : "user";

    private static bool IsSystemCommand(string? command)
        => string.Equals(command?.Trim(), "world.update", StringComparison.OrdinalIgnoreCase);

    private static string BuildNextState(string currentState, CommandAgentRequestDto request)
    {
        var message = request.Message?.Trim();
        var command = request.Command?.Trim();
        var nextState = !string.IsNullOrWhiteSpace(message)
            ? message
            : !string.IsNullOrWhiteSpace(command)
                ? command
                : currentState;

        if (string.IsNullOrWhiteSpace(nextState))
        {
            return "Updated";
        }

        return nextState.Length <= 400
            ? nextState
            : nextState[..400];
    }

    private static AgentDto ToAgentDto(Agent agent, IReadOnlyCollection<string>? memories = null)
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
            PersonalityTraits = agent.PersonalityTraits,
            Description = string.IsNullOrWhiteSpace(agent.Description) ? null : agent.Description,
            Emotion = string.IsNullOrWhiteSpace(agent.CurrentEmotion) ? null : agent.CurrentEmotion,
            Traits = ParseTraits(agent.TraitSummary),
            Memories = memories?.ToArray(),
            CurrentPlan = agent.State
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

    private static PersonalityTraits NormalizeTraits(PersonalityTraits? rawTraits)
    {
        var traits = rawTraits ?? new PersonalityTraits();
        return new PersonalityTraits
        {
            Openness = NormalizeScore(traits.Openness),
            Conscientiousness = NormalizeScore(traits.Conscientiousness),
            Extraversion = NormalizeScore(traits.Extraversion),
            Agreeableness = NormalizeScore(traits.Agreeableness),
            Neuroticism = NormalizeScore(traits.Neuroticism)
        };
    }

    private static float NormalizeScore(float value)
        => Math.Clamp(value, 0f, 1f);

    private static string NormalizeName(string? value)
    {
        var normalized = NormalizeText(value, maxLength: 120);
        if (!string.IsNullOrWhiteSpace(normalized))
        {
            return normalized;
        }

        var suffix = Guid.NewGuid().ToString("N")[..8];
        return $"AI Agent {suffix}";
    }

    private static string? NormalizeText(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var trimmed = value.Trim();
        return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
    }

    private static AiAgentBlueprint ParseAiAgentBlueprint(string responsePayload)
    {
        var json = ExtractJsonObject(responsePayload);

        try
        {
            var parsed = JsonSerializer.Deserialize<AiAgentBlueprint>(
                json,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    NumberHandling = JsonNumberHandling.AllowReadingFromString
                });

            return parsed ?? throw new InvalidOperationException("AI returned an empty agent profile payload.");
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException("AI returned malformed JSON while generating an agent profile.", ex);
        }
    }

    private static string ExtractJsonObject(string responsePayload)
    {
        var trimmed = responsePayload?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            throw new InvalidOperationException("AI returned an empty response while generating an agent.");
        }

        if (trimmed.StartsWith("```", StringComparison.Ordinal))
        {
            var firstLineBreak = trimmed.IndexOf('\n');
            if (firstLineBreak >= 0)
            {
                trimmed = trimmed[(firstLineBreak + 1)..];
            }

            var closingFence = trimmed.LastIndexOf("```", StringComparison.Ordinal);
            if (closingFence >= 0)
            {
                trimmed = trimmed[..closingFence];
            }

            trimmed = trimmed.Trim();
        }

        var start = trimmed.IndexOf('{');
        var end = trimmed.LastIndexOf('}');
        if (start < 0 || end <= start)
        {
            throw new InvalidOperationException("AI response does not contain a valid JSON object.");
        }

        return trimmed[start..(end + 1)];
    }

    private sealed class AiAgentBlueprint
    {
        public string? Name { get; init; }
        public string? InitialState { get; init; }
        public string? State { get; init; }
        public string? Description { get; init; }
        public string? InitialEmotion { get; init; }
        public string? TraitSummary { get; init; }
        public float? InitialEnergy { get; init; }
        public float? Energy { get; init; }
        public PersonalityTraits? PersonalityTraits { get; init; }
        public PersonalityTraits? Traits { get; init; }
    }

    private async Task<Dictionary<Guid, IReadOnlyCollection<string>>> LoadRecentMemoriesByAgentAsync(
        IEnumerable<Guid> agentIds,
        CancellationToken cancellationToken)
    {
        var ids = agentIds.Distinct().ToArray();
        if (ids.Length == 0)
        {
            return [];
        }

        var items = await dbContext.MemoryLogs
            .Where(x => ids.Contains(x.AgentId))
            .OrderByDescending(x => x.Timestamp)
            .ToArrayAsync(cancellationToken);

        return items
            .GroupBy(x => x.AgentId)
            .ToDictionary(
                group => group.Key,
                group => (IReadOnlyCollection<string>)group
                    .Take(5)
                    .Select(x => x.Description)
                    .ToArray());
    }

    private static IReadOnlyCollection<string>? ParseTraits(string traitSummary)
    {
        if (string.IsNullOrWhiteSpace(traitSummary))
        {
            return null;
        }

        return traitSummary
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Take(8)
            .ToArray();
    }

    private static string NormalizeEmotion(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return "neutral";
        }

        var trimmed = raw.Trim();
        return trimmed.Length <= 80 ? trimmed : trimmed[..80];
    }

    private static string NormalizeTraitSummary(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return string.Empty;
        }

        var trimmed = raw.Trim();
        return trimmed.Length <= 500 ? trimmed : trimmed[..500];
    }
}
