using LongLifeModels.DTOs;
using System.Globalization;
using System.Text.Json;

namespace LongLifeModels.Services;

public sealed class WorldInsightsService(
    IUserAgentsService userAgentsService,
    IEventService eventService) : IWorldInsightsService
{
    private static readonly string[] EventTypeOrder = ["chat", "action", "emotion", "system"];
    private static readonly string[] MoodOrder = ["happy", "neutral", "sad", "angry", "excited", "anxious"];

    private static readonly IReadOnlyDictionary<string, float> MoodScoreByMood = new Dictionary<string, float>(StringComparer.OrdinalIgnoreCase)
    {
        ["happy"] = 0.8f,
        ["neutral"] = 0.5f,
        ["sad"] = 0.2f,
        ["angry"] = 0.15f,
        ["excited"] = 0.9f,
        ["anxious"] = 0.35f
    };

    private static readonly string[] SourceIdKeys =
    [
        "fromAgentId",
        "fromId",
        "initiatorAgentId",
        "sourceAgentId",
        "senderAgentId",
        "agentAId"
    ];

    private static readonly string[] TargetIdKeys =
    [
        "toAgentId",
        "toId",
        "targetAgentId",
        "receiverAgentId",
        "relatedAgentId",
        "agentBId"
    ];

    private static readonly string[] GenericAgentIdKeys =
    [
        "agentId",
        "id"
    ];

    private static readonly string[] SourceNameKeys =
    [
        "fromAgentName",
        "fromName",
        "sourceAgentName",
        "agentName",
        "name"
    ];

    private static readonly string[] TargetNameKeys =
    [
        "toAgentName",
        "toName",
        "targetAgentName",
        "relatedAgentName"
    ];

    private static readonly string[] SentimentKeys =
    [
        "sentiment",
        "score",
        "relationshipScore"
    ];

    private static readonly string[] LabelKeys =
    [
        "label",
        "relationshipLabel",
        "relation",
        "relationType"
    ];

    public async Task<IReadOnlyCollection<RelationshipDto>> GetRelationshipsAsync(string userId, CancellationToken cancellationToken)
    {
        var (agents, events) = await LoadAgentsAndEventsAsync(userId, cancellationToken);
        var parsedEvents = ParseEvents(events, agents);
        var edges = BuildRelationshipEdges(parsedEvents);

        return edges
            .Select(edge => new RelationshipDto
            {
                From = edge.FromAgentId.ToString("D"),
                To = edge.ToAgentId.ToString("D"),
                Sentiment = edge.Sentiment,
                Label = edge.Label
            })
            .ToArray();
    }

    public async Task<WorldStatsDto> GetStatsAsync(string userId, CancellationToken cancellationToken)
    {
        var (agents, events) = await LoadAgentsAndEventsAsync(userId, cancellationToken);
        var agentsById = agents.ToDictionary(agent => agent.AgentId, agent => agent);
        var parsedEvents = ParseEvents(events, agents);
        var relationships = BuildRelationshipEdges(parsedEvents);

        var eventTypeCounts = EventTypeOrder.ToDictionary(type => type, _ => 0, StringComparer.OrdinalIgnoreCase);
        var activityByAgent = new Dictionary<Guid, int>();

        foreach (var parsedEvent in parsedEvents)
        {
            eventTypeCounts[parsedEvent.Category] = eventTypeCounts[parsedEvent.Category] + 1;

            if (parsedEvent.SourceAgentId is Guid sourceAgentId)
            {
                activityByAgent[sourceAgentId] = activityByAgent.GetValueOrDefault(sourceAgentId) + 1;
            }
        }

        var moodByAgent = agents.ToDictionary(agent => agent.AgentId, agent => ResolveMood(agent.Status, agent.Energy));
        var moodCounts = moodByAgent.Values
            .GroupBy(mood => mood, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.Count(), StringComparer.OrdinalIgnoreCase);

        var avgMood = moodByAgent.Count == 0
            ? 0f
            : moodByAgent.Values
                .Select(mood => MoodScoreByMood[mood])
                .Average();

        Guid? mostActiveAgentId = activityByAgent.Count > 0
            ? activityByAgent
                .OrderByDescending(item => item.Value)
                .Select(item => item.Key)
                .FirstOrDefault()
            : null;

        var mostActiveAgent = mostActiveAgentId is Guid id && agentsById.TryGetValue(id, out var mostActive)
            ? mostActive.Name
            : agents.OrderByDescending(agent => agent.LastActiveAt).Select(agent => agent.Name).FirstOrDefault() ?? "-";

        var topRelationship = relationships
            .OrderByDescending(relationship => MathF.Abs(relationship.Sentiment))
            .ThenByDescending(relationship => relationship.InteractionCount)
            .FirstOrDefault();

        var topFrom = topRelationship is null
            ? "-"
            : agentsById.TryGetValue(topRelationship.FromAgentId, out var fromAgent)
                ? fromAgent.Name
                : topRelationship.FromAgentId.ToString("D");

        var topTo = topRelationship is null
            ? "-"
            : agentsById.TryGetValue(topRelationship.ToAgentId, out var toAgent)
                ? toAgent.Name
                : topRelationship.ToAgentId.ToString("D");

        return new WorldStatsDto
        {
            TotalEvents = parsedEvents.Count,
            TotalConversations = eventTypeCounts["chat"],
            AvgMood = (float)avgMood,
            MostActiveAgent = mostActiveAgent,
            TopRelationship = new TopRelationshipDto
            {
                From = topFrom,
                To = topTo,
                Sentiment = topRelationship?.Sentiment ?? 0f
            },
            EventsByType = EventTypeOrder
                .Select(type => new EventTypeCountDto
                {
                    Type = type,
                    Count = eventTypeCounts[type]
                })
                .ToArray(),
            MoodDistribution = MoodOrder
                .Select(mood => new MoodDistributionDto
                {
                    Mood = mood,
                    Count = moodCounts.GetValueOrDefault(mood, 0)
                })
                .ToArray()
        };
    }

    private async Task<(IReadOnlyCollection<AgentDto> Agents, IReadOnlyCollection<EventDto> Events)> LoadAgentsAndEventsAsync(
        string userId,
        CancellationToken cancellationToken)
    {
        var agentsTask = userAgentsService.GetAgentsAsync(userId, cancellationToken);
        var eventsTask = eventService.GetAllAsync(userId, cancellationToken);
        await Task.WhenAll(agentsTask, eventsTask);
        return (await agentsTask, await eventsTask);
    }

    private static IReadOnlyList<ParsedEvent> ParseEvents(
        IReadOnlyCollection<EventDto> events,
        IReadOnlyCollection<AgentDto> agents)
    {
        var knownAgentIds = agents.Select(agent => agent.AgentId).ToHashSet();
        var agentIdsByName = new Dictionary<string, Guid>(StringComparer.OrdinalIgnoreCase);
        foreach (var agent in agents)
        {
            if (!agentIdsByName.ContainsKey(agent.Name))
            {
                agentIdsByName[agent.Name] = agent.AgentId;
            }
        }

        return events
            .OrderBy(eventDto => eventDto.CreatedAt)
            .Select(eventDto => ParseSingleEvent(eventDto, knownAgentIds, agentIdsByName))
            .ToArray();
    }

    private static ParsedEvent ParseSingleEvent(
        EventDto eventDto,
        ISet<Guid> knownAgentIds,
        IReadOnlyDictionary<string, Guid> agentIdsByName)
    {
        var objects = CollectObjects(eventDto.Payload);
        var sourceAgentId =
            TryResolveKnownAgentId(objects, SourceIdKeys, SourceNameKeys, knownAgentIds, agentIdsByName) ??
            TryResolveKnownAgentId(objects, GenericAgentIdKeys, SourceNameKeys, knownAgentIds, agentIdsByName);
        var targetAgentId = TryResolveKnownAgentId(objects, TargetIdKeys, TargetNameKeys, knownAgentIds, agentIdsByName);

        var sentiment = TryReadFloat(objects, SentimentKeys);
        var label = TryReadString(objects, LabelKeys);
        var category = NormalizeEventCategory(eventDto.Type);

        return new ParsedEvent(eventDto, sourceAgentId, targetAgentId, sentiment, label, category);
    }

    private static IReadOnlyList<RelationshipEdge> BuildRelationshipEdges(IReadOnlyCollection<ParsedEvent> parsedEvents)
    {
        var aggregates = new Dictionary<RelationshipKey, RelationshipAggregate>();
        Guid? previousSource = null;

        foreach (var parsedEvent in parsedEvents)
        {
            var source = parsedEvent.SourceAgentId;
            var target = parsedEvent.TargetAgentId;

            if (source is Guid sourceId && target is Guid targetId && sourceId != targetId)
            {
                AddRelationship(
                    aggregates,
                    sourceId,
                    targetId,
                    parsedEvent.Sentiment ?? GetDefaultSentiment(parsedEvent),
                    parsedEvent.Label ?? parsedEvent.Category);
            }
            else if (source is Guid singleSource && previousSource is Guid previous && previous != singleSource)
            {
                AddRelationship(
                    aggregates,
                    previous,
                    singleSource,
                    parsedEvent.Sentiment ?? GetDefaultSentiment(parsedEvent),
                    parsedEvent.Label ?? "interaction");
            }

            if (source is Guid nextPrevious)
            {
                previousSource = nextPrevious;
            }
        }

        return aggregates
            .Select(item => new RelationshipEdge(
                item.Key.FromAgentId,
                item.Key.ToAgentId,
                item.Value.Count == 0 ? 0f : Math.Clamp(item.Value.SentimentSum / item.Value.Count, -1f, 1f),
                item.Value.Label ?? "interaction",
                item.Value.Count))
            .OrderByDescending(edge => MathF.Abs(edge.Sentiment))
            .ThenByDescending(edge => edge.InteractionCount)
            .Take(200)
            .ToArray();
    }

    private static void AddRelationship(
        IDictionary<RelationshipKey, RelationshipAggregate> aggregates,
        Guid fromAgentId,
        Guid toAgentId,
        float sentiment,
        string? label)
    {
        var key = new RelationshipKey(fromAgentId, toAgentId);
        if (!aggregates.TryGetValue(key, out var aggregate))
        {
            aggregate = new RelationshipAggregate();
            aggregates[key] = aggregate;
        }

        aggregate.Count += 1;
        aggregate.SentimentSum += Math.Clamp(sentiment, -1f, 1f);

        if (string.IsNullOrWhiteSpace(aggregate.Label) && !string.IsNullOrWhiteSpace(label))
        {
            aggregate.Label = label.Trim();
        }
    }

    private static float GetDefaultSentiment(ParsedEvent parsedEvent)
    {
        var loweredType = parsedEvent.Event.Type.ToLowerInvariant();
        if (loweredType.Contains("error") || loweredType.Contains("fail") || loweredType.Contains("conflict"))
        {
            return -0.4f;
        }

        return parsedEvent.Category switch
        {
            "chat" => 0.35f,
            "action" => 0.2f,
            "emotion" => 0.1f,
            _ => 0f
        };
    }

    private static string ResolveMood(string status, float energyRaw)
    {
        var statusLower = (status ?? string.Empty).ToLowerInvariant();
        var energy = Math.Clamp(energyRaw, 0f, 1f);

        if (statusLower.Contains("error") || statusLower.Contains("failed"))
        {
            return "angry";
        }

        if (statusLower.Contains("stop") || statusLower.Contains("archived"))
        {
            return "sad";
        }

        if (statusLower.Contains("pause"))
        {
            return "anxious";
        }

        if (energy >= 0.8f) return "excited";
        if (energy >= 0.6f) return "happy";
        if (energy >= 0.4f) return "neutral";
        if (energy >= 0.2f) return "anxious";
        return "sad";
    }

    private static string NormalizeEventCategory(string type)
    {
        var lowered = (type ?? string.Empty).ToLowerInvariant();
        if (lowered.Contains("chat") || lowered.Contains("message") || lowered.Contains("conversation"))
        {
            return "chat";
        }

        if (lowered.Contains("emotion") || lowered.Contains("mood"))
        {
            return "emotion";
        }

        if (lowered.Contains("system") || lowered.Contains("status") || lowered.Contains("progress") || lowered.Contains("error"))
        {
            return "system";
        }

        return "action";
    }

    private static IReadOnlyList<JsonElement> CollectObjects(JsonElement payload)
    {
        if (payload.ValueKind != JsonValueKind.Object)
        {
            return [];
        }

        var objects = new List<JsonElement> { payload };
        AddIfObject(payload, "payload", objects);
        AddIfObject(payload, "data", objects);
        AddIfObject(payload, "agent", objects);
        AddIfObject(payload, "source", objects);
        AddIfObject(payload, "target", objects);
        AddIfObject(payload, "from", objects);
        AddIfObject(payload, "to", objects);

        return objects;
    }

    private static void AddIfObject(JsonElement parent, string propertyName, ICollection<JsonElement> destination)
    {
        if (TryGetPropertyIgnoreCase(parent, propertyName, out var value) && value.ValueKind == JsonValueKind.Object)
        {
            destination.Add(value);
        }
    }

    private static Guid? TryResolveKnownAgentId(
        IReadOnlyCollection<JsonElement> objects,
        IReadOnlyCollection<string> idKeys,
        IReadOnlyCollection<string> nameKeys,
        ISet<Guid> knownAgentIds,
        IReadOnlyDictionary<string, Guid> agentIdsByName)
    {
        foreach (var obj in objects)
        {
            foreach (var key in idKeys)
            {
                if (!TryGetPropertyIgnoreCase(obj, key, out var value))
                {
                    continue;
                }

                var parsed = value.ValueKind switch
                {
                    JsonValueKind.String when Guid.TryParse(value.GetString(), out var guidValue) => guidValue,
                    _ => (Guid?)null
                };

                if (parsed is Guid id && knownAgentIds.Contains(id))
                {
                    return id;
                }
            }
        }

        foreach (var obj in objects)
        {
            foreach (var key in nameKeys)
            {
                if (!TryGetPropertyIgnoreCase(obj, key, out var value) || value.ValueKind != JsonValueKind.String)
                {
                    continue;
                }

                var name = value.GetString();
                if (!string.IsNullOrWhiteSpace(name) && agentIdsByName.TryGetValue(name.Trim(), out var id))
                {
                    return id;
                }
            }
        }

        return null;
    }

    private static float? TryReadFloat(IReadOnlyCollection<JsonElement> objects, IReadOnlyCollection<string> keys)
    {
        foreach (var obj in objects)
        {
            foreach (var key in keys)
            {
                if (!TryGetPropertyIgnoreCase(obj, key, out var value))
                {
                    continue;
                }

                if (value.ValueKind == JsonValueKind.Number && value.TryGetSingle(out var floatValue))
                {
                    return floatValue;
                }

                if (value.ValueKind == JsonValueKind.String &&
                    float.TryParse(value.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed))
                {
                    return parsed;
                }
            }
        }

        return null;
    }

    private static string? TryReadString(IReadOnlyCollection<JsonElement> objects, IReadOnlyCollection<string> keys)
    {
        foreach (var obj in objects)
        {
            foreach (var key in keys)
            {
                if (!TryGetPropertyIgnoreCase(obj, key, out var value) || value.ValueKind != JsonValueKind.String)
                {
                    continue;
                }

                var raw = value.GetString();
                if (!string.IsNullOrWhiteSpace(raw))
                {
                    return raw.Trim();
                }
            }
        }

        return null;
    }

    private static bool TryGetPropertyIgnoreCase(JsonElement element, string propertyName, out JsonElement value)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in element.EnumerateObject())
            {
                if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                {
                    value = property.Value;
                    return true;
                }
            }
        }

        value = default;
        return false;
    }

    private sealed record ParsedEvent(
        EventDto Event,
        Guid? SourceAgentId,
        Guid? TargetAgentId,
        float? Sentiment,
        string? Label,
        string Category);

    private sealed record RelationshipEdge(
        Guid FromAgentId,
        Guid ToAgentId,
        float Sentiment,
        string Label,
        int InteractionCount);

    private sealed class RelationshipAggregate
    {
        public int Count { get; set; }
        public float SentimentSum { get; set; }
        public string? Label { get; set; }
    }

    private readonly record struct RelationshipKey(Guid FromAgentId, Guid ToAgentId);
}
