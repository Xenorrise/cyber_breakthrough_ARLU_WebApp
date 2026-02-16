namespace LongLifeModels.Domain;

public sealed class Agent
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public float Energy { get; set; }
    public PersonalityTraits PersonalityTraits { get; set; } = new();
}
