namespace LongLifeModels.DTOs;

public sealed class AgentProgressDto
{
    public required Guid AgentId { get; init; }
    public required string UserId { get; init; }
    public required string Stage { get; init; }
    public string? Message { get; init; }
    public int? Percent { get; init; }
}
