using LongLifeModels.DTOs;

namespace LongLifeModels.Services;

public interface IEventService
{
    Task<EventDto> CreateAsync(
        CreateEventRequestDto request,
        string? userId,
        DateTimeOffset? createdAt,
        CancellationToken cancellationToken);
    Task<IReadOnlyCollection<EventDto>> GetAllAsync(string? userId, CancellationToken cancellationToken);
    Task<EventDto?> GetByIdAsync(Guid id, string? userId, CancellationToken cancellationToken);
    Task ClearAsync(string? userId, CancellationToken cancellationToken);
}
