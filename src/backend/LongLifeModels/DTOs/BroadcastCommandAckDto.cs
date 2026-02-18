namespace LongLifeModels.DTOs;

public sealed class BroadcastCommandAckDto
{
    public required string UserId { get; init; }
    public required DateTimeOffset AcceptedAt { get; init; }
    public required int AcceptedCount { get; init; }
    public required int RejectedCount { get; init; }
    public required IReadOnlyCollection<BroadcastCommandItemDto> Items { get; init; }
}

public sealed class BroadcastCommandItemDto
{
    public required Guid AgentId { get; init; }
    public required string Status { get; init; }
    public string? CorrelationId { get; init; }
    public string? Reason { get; init; }
}
