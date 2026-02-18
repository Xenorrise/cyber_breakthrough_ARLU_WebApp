namespace LongLifeModels.DTOs;

public sealed class AgentsListUpdatedDto
{
    public required string UserId { get; init; }
    public required IReadOnlyCollection<AgentDto> Agents { get; init; }
}
