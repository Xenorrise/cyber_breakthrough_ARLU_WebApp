using LongLifeModels.Application.Services;

namespace LongLifeModels.Application.Interfaces;
public interface IAgentBrain
{
    Task<AgentBrainResult> ThinkAsync(Guid agentId, string worldContext, DateTime currentTime, CancellationToken cancellationToken = default);
}
public record AgentDecision
{
    public string Action { get; init; }
    public Dictionary<string, object> Parameters { get; init; } = new();
    public int? Cooldown { get; init; }
    public string Thought { get; init; } 
}