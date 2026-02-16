namespace LongLifeModels.Domain.Entities;
public class Relationship
{
    public Guid Id { get; set; }
    public Guid AgentAId { get; set; }
    public Guid AgentBId { get; set; }
    public float Score { get; set; }
    public DateTime LastInteractionTime { get; set; }
    public int InteractionCount { get; set; }
}