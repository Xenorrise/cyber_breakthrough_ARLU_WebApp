using LongLifeModels.DTOs;

namespace LongLifeModels.Services;

public interface IWorldSimulationService
{
    Task EnsureUserWorldAsync(string userId, CancellationToken cancellationToken);
    Task<WorldTimeDto> GetWorldTimeAsync(string userId, CancellationToken cancellationToken);
    Task<WorldTimeDto> UpdateSpeedAsync(string userId, float speed, CancellationToken cancellationToken);
    Task<WorldTimeDto> AdvanceTimeAsync(string userId, int minutes, CancellationToken cancellationToken);
    Task TickAsync(TimeSpan elapsedRealTime, CancellationToken cancellationToken);
}
