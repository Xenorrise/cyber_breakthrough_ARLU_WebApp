namespace LongLifeModels.DTOs;

public sealed class RelationshipDto
{
    public required string From { get; init; }
    public required string To { get; init; }
    public required float Sentiment { get; init; }
    public string? Label { get; init; }
}
