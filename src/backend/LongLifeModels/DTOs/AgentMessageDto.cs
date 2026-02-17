namespace LongLifeModels.DTOs;

public sealed class AgentMessageDto
{
    public required Guid MessageId { get; init; }
    public required Guid AgentId { get; init; }
    public required string UserId { get; init; }
    public required Guid ThreadId { get; init; }
    public required string Role { get; init; }
    public required string Content { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public string? CorrelationId { get; init; }
}
