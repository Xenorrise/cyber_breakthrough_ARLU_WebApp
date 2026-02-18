using System.Text.Json;

namespace LongLifeModels.DTOs;

public sealed class EventDto
{
    public required Guid Id { get; init; }
    public string? UserId { get; init; }
    public required string Type { get; init; }
    public required JsonElement Payload { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
}
