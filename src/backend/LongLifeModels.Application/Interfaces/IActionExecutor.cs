using LongLifeModels.Domain.Entities;
using LongLifeModels.Domain.Interfaces;

namespace LongLifeModels.Application.Interfaces;

public interface IActionExecutor
{
    /// <summary>
    /// Выполняет действие, изменяет состояние агента и генерирует доменные события.
    /// </summary>
    /// <param name="agent">Агент до выполнения действия</param>
    /// <param name="decision">Решение агента</param>
    /// <param name="currentTime">Время тика</param>
    /// <param name="cancellationToken">Токен отмены</param>
    /// <returns>Обновлённый агент и список событий</returns>
    Task<(Agent UpdatedAgent, IReadOnlyCollection<IDomainEvent> Events)> ExecuteAsync(
        Agent agent,
        AgentDecision decision,
        DateTime currentTime,
        CancellationToken cancellationToken);
}