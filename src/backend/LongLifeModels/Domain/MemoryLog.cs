namespace LongLifeModels.Domain;

public sealed class MemoryLog
{
    public Guid Id { get; set; }
    public Guid AgentId { get; set; }
    public Guid? RelatedAgentId { get; set; }
    public string Description { get; set; } = string.Empty;
    public float Importance { get; set; }
    public DateTimeOffset Timestamp { get; set; }
}
