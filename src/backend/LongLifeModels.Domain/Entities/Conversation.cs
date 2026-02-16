namespace LongLifeModels.Domain.Entities;

public sealed class Conversation
{
    public Guid Id { get; set; }
    public Guid InitiatorAgentId { get; set; }
    public Guid TargetAgentId { get; set; }
    public string Topic { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}
