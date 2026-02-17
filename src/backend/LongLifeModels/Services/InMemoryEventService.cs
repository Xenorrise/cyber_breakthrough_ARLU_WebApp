using LongLifeModels.Domain;
using LongLifeModels.DTOs;

namespace LongLifeModels.Services;

public sealed class InMemoryEventService : IEventService
{
    private readonly List<EventModel> _events = [];
    private readonly object _sync = new();

    public Task<EventDto> CreateAsync(CreateEventRequestDto request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var model = new EventModel
        {
            Id = Guid.NewGuid(),
            Type = request.Type.Trim(),
            Payload = request.Payload.Clone(),
            CreatedAt = DateTimeOffset.UtcNow
        };

        lock (_sync)
        {
            _events.Add(model);
        }

        return Task.FromResult(ToDto(model));
    }

    public Task<IReadOnlyCollection<EventDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        List<EventDto> events;
        lock (_sync)
        {
            events = _events
                .OrderByDescending(e => e.CreatedAt)
                .Select(ToDto)
                .ToList();
        }

        return Task.FromResult<IReadOnlyCollection<EventDto>>(events);
    }

    public Task<EventDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        EventModel? model;
        lock (_sync)
        {
            model = _events.FirstOrDefault(e => e.Id == id);
        }

        return Task.FromResult(model is null ? null : ToDto(model));
    }

    private static EventDto ToDto(EventModel model)
    {
        return new EventDto
        {
            Id = model.Id,
            Type = model.Type,
            Payload = model.Payload.Clone(),
            CreatedAt = model.CreatedAt
        };
    }
}
