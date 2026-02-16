using LongLifeModels.Domain.Entities;

namespace LongLifeModels.Domain.Interfaces;
public interface IAgentContextProvider
{
    Task<AgentContext> GetContextAsync(Agent agent, DateTime currentTime, CancellationToken ct);
}
public record AgentContext(IReadOnlyList<MemoryEntry> RecentMemories, IReadOnlyList<RelationshipInfo> Relationships, IReadOnlyList<InteractionInfo> RecentInteractions);