using LongLifeModels.Domain;
using LongLifeModels.DTOs;

namespace LongLifeModels.Services;

public sealed class InMemoryEventService : IEventService
{
    private readonly List<EventModel> _events = [];
    private readonly object _sync = new();

    public Task<EventDto> CreateAsync(
        CreateEventRequestDto request,
        string? userId,
        DateTimeOffset? createdAt,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var model = new EventModel
        {
            Id = Guid.NewGuid(),
            UserId = string.IsNullOrWhiteSpace(userId) ? null : userId.Trim(),
            Type = request.Type.Trim(),
            Payload = request.Payload.Clone(),
            CreatedAt = createdAt ?? request.OccurredAt ?? DateTimeOffset.UtcNow
        };

        lock (_sync)
        {
            _events.Add(model);
        }

        return Task.FromResult(ToDto(model));
    }

    public Task<IReadOnlyCollection<EventDto>> GetAllAsync(string? userId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        List<EventDto> events;
        lock (_sync)
        {
            events = _events
                .Where(e => string.IsNullOrWhiteSpace(userId) || string.Equals(e.UserId, userId, StringComparison.Ordinal))
                .OrderByDescending(e => e.CreatedAt)
                .Select(ToDto)
                .ToList();
        }

        return Task.FromResult<IReadOnlyCollection<EventDto>>(events);
    }

    public Task<EventDto?> GetByIdAsync(Guid id, string? userId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        EventModel? model;
        lock (_sync)
        {
            model = _events.FirstOrDefault(e =>
                e.Id == id &&
                (string.IsNullOrWhiteSpace(userId) || string.Equals(e.UserId, userId, StringComparison.Ordinal)));
        }

        return Task.FromResult(model is null ? null : ToDto(model));
    }

    private static EventDto ToDto(EventModel model)
    {
        return new EventDto
        {
            Id = model.Id,
            UserId = model.UserId,
            Type = model.Type,
            Payload = model.Payload.Clone(),
            CreatedAt = model.CreatedAt
        };
    }
}
