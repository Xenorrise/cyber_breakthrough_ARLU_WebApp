namespace LongLifeModels.DTOs;

public sealed class HubAckDto
{
    public required bool Ok { get; init; }
    public required string Message { get; init; }
    public string? CorrelationId { get; init; }
}
