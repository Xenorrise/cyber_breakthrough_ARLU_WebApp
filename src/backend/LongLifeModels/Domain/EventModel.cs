using System.Text.Json;

namespace LongLifeModels.Domain;

public sealed class EventModel
{
    public required Guid Id { get; init; }
    public required string Type { get; init; }
    public required JsonElement Payload { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
}
