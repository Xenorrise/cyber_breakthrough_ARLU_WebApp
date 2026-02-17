namespace LongLifeModels.Domain;

public sealed class Agent
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public float Energy { get; set; }
    public Guid ThreadId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset LastActiveAt { get; set; }
    public bool IsArchived { get; set; }
    public PersonalityTraits PersonalityTraits { get; set; } = new();
}
