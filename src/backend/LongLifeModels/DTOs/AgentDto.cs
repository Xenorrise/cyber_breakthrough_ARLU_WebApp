using LongLifeModels.Domain;

namespace LongLifeModels.DTOs;

public sealed class AgentDto
{
    public required Guid AgentId { get; init; }
    public required string UserId { get; init; }
    public required string Name { get; init; }
    public required string Model { get; init; }
    public required string Status { get; init; }
    public required string State { get; init; }
    public required float Energy { get; init; }
    public required Guid ThreadId { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset LastActiveAt { get; init; }
    public required PersonalityTraits PersonalityTraits { get; init; }
    public string? Description { get; init; }
    public string? Emotion { get; init; }
    public IReadOnlyCollection<string>? Traits { get; init; }
    public IReadOnlyCollection<string>? Memories { get; init; }
    public string? CurrentPlan { get; init; }
}
