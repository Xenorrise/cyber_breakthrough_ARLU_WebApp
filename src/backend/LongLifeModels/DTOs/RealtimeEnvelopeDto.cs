namespace LongLifeModels.DTOs;

public sealed class RealtimeEnvelopeDto<TPayload>
{
    public required string Type { get; init; }
    public required DateTimeOffset Timestamp { get; init; }
    public string? CorrelationId { get; init; }
    public required TPayload Payload { get; init; }
}
