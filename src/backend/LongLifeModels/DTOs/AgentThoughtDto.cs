namespace LongLifeModels.DTOs;

public sealed class AgentThoughtDto
{
    public required Guid AgentId { get; init; }
    public required string UserId { get; init; }
    public required string Stage { get; init; }
    public required string Content { get; init; }
}
