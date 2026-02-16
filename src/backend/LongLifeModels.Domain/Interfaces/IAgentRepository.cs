using LongLifeModels.Domain.Entities;

namespace LongLifeModels.Domain.Interfaces;
public interface IAgentRepository
{
    Task<IReadOnlyList<Agent>> GetAgentsReadyForTickAsync(DateTime currentTickTime, int maxCount, CancellationToken ct);
	// Загружает агентов по списку идентификаторов (для получения имён)    
    Task<IReadOnlyList<Agent>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken cancellationToken);
    Task UpdateAsync(Agent agent, CancellationToken ct);
}