namespace LongLifeModels.Services;

public sealed record AgentCommandWorkItem(
    Guid AgentId,
    string UserId,
    string WorldContext,
    string CorrelationId,
    DateTimeOffset EnqueuedAt);
