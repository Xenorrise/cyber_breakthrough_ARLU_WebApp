namespace LongLifeModels.DTOs;

public sealed class AgentStatusDto
{
    public required Guid AgentId { get; init; }
    public required string UserId { get; init; }
    public required string Status { get; init; }
    public required DateTimeOffset Timestamp { get; init; }
}
