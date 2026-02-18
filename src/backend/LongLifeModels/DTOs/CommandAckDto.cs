namespace LongLifeModels.DTOs;

public sealed class CommandAckDto
{
    public required Guid AgentId { get; init; }
    public required string UserId { get; init; }
    public required string CorrelationId { get; init; }
    public required string Status { get; init; }
    public required DateTimeOffset AcceptedAt { get; init; }
}
