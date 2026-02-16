using LongLifeModels.Domain.Entities;

public interface IMemoryLogRepository
{
    // Возвращает последние записи MemoryLog для указанного агента с учётом лимита и минимальной важности
    Task<IReadOnlyList<MemoryLog>> GetRecentAsync(Guid agentId, int limit, int minImportance, CancellationToken cancellationToken);
}