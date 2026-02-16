using LongLifeModels.Domain.Entities;

public interface IRelationshipRepository
{
    // Возвращает все отношения, где AgentId равен указанному (субъект)
    Task<IReadOnlyList<Relationship>> GetForAgentAsync(Guid agentId, CancellationToken cancellationToken);
}