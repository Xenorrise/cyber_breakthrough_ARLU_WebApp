namespace LongLifeModels.Domain;

public sealed class AgentMessage
{
    public Guid Id { get; set; }
    public Guid AgentId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public Guid ThreadId { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public string? CorrelationId { get; set; }
}
