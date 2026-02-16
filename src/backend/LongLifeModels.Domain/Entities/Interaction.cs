namespace LongLifeModels.Domain.Entities;

public sealed class Interaction
{
    public Guid Id { get; set; }
    public Guid InitiatorAgentId { get; set; }
    public Guid TargetAgentId { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime Date { get; set; }
}
