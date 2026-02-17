namespace LongLifeModels.DTOs;

public sealed class WorldStatsDto
{
    public required int TotalEvents { get; init; }
    public required int TotalConversations { get; init; }
    public required float AvgMood { get; init; }
    public required string MostActiveAgent { get; init; }
    public required TopRelationshipDto TopRelationship { get; init; }
    public required IReadOnlyCollection<EventTypeCountDto> EventsByType { get; init; }
    public required IReadOnlyCollection<MoodDistributionDto> MoodDistribution { get; init; }
}

public sealed class TopRelationshipDto
{
    public required string From { get; init; }
    public required string To { get; init; }
    public required float Sentiment { get; init; }
}

public sealed class EventTypeCountDto
{
    public required string Type { get; init; }
    public required int Count { get; init; }
}

public sealed class MoodDistributionDto
{
    public required string Mood { get; init; }
    public required int Count { get; init; }
}
