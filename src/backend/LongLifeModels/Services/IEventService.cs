using LongLifeModels.DTOs;

namespace LongLifeModels.Services;

public interface IEventService
{
    Task<EventDto> CreateAsync(CreateEventRequestDto request, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<EventDto>> GetAllAsync(CancellationToken cancellationToken);
    Task<EventDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
}
