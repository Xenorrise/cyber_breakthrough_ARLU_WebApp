using LongLifeModels.DTOs;

namespace LongLifeModels.Services;

public interface IWorldInsightsService
{
    Task<IReadOnlyCollection<RelationshipDto>> GetRelationshipsAsync(string userId, CancellationToken cancellationToken);
    Task<WorldStatsDto> GetStatsAsync(string userId, CancellationToken cancellationToken);
}
