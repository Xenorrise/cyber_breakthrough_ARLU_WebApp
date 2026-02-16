using LongLifeModels.Domain.Entities;

namespace LongLifeModels.Domain.Interfaces;
public interface IInteractionRepository
{
    Task<IReadOnlyList<Interaction>> GetRecentForAgentAsync(Guid agentId, int limit, CancellationToken cancellationToken);
}