namespace LongLifeModels.Domain;

public sealed class Relationship
{
    public Guid Id { get; set; }
    public Guid AgentAId { get; set; }
    public Guid AgentBId { get; set; }
    public float Score { get; set; }
    public int InteractionCount { get; set; }
    public DateTimeOffset LastInteractionTime { get; set; }
}
