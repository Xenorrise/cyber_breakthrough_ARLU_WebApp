using LongLifeModels.Domain;
using LongLifeModels.DTOs;
using LongLifeModels.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace LongLifeModels.Services;

public sealed class InMemoryEventService(
    IHubContext<AgentsHub> hubContext,
    ILogger<InMemoryEventService> logger) : IEventService
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

        var normalizedUserId = string.IsNullOrWhiteSpace(userId) ? null : userId.Trim();
        var model = new EventModel
        {
            Id = Guid.NewGuid(),
            UserId = normalizedUserId,
            Type = request.Type.Trim(),
            Payload = request.Payload.Clone(),
            CreatedAt = createdAt ?? request.OccurredAt ?? DateTimeOffset.UtcNow
        };

        lock (_sync)
        {
            _events.Add(model);
        }

        var dto = ToDto(model);
        if (!string.IsNullOrWhiteSpace(normalizedUserId))
        {
            _ = NotifyEventsUpdatedAsync(normalizedUserId, dto, cancellationToken);
        }

        return Task.FromResult(dto);
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

    public async Task ClearAsync(string? userId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var normalizedUserId = string.IsNullOrWhiteSpace(userId) ? null : userId.Trim();
        lock (_sync)
        {
            if (string.IsNullOrWhiteSpace(normalizedUserId))
            {
                _events.Clear();
            }
            else
            {
                _events.RemoveAll(e => string.Equals(e.UserId, normalizedUserId, StringComparison.Ordinal));
            }
        }

        if (!string.IsNullOrWhiteSpace(normalizedUserId))
        {
            await NotifyEventsClearedAsync(normalizedUserId, cancellationToken);
        }
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

    private async Task NotifyEventsUpdatedAsync(string userId, EventDto createdEvent, CancellationToken cancellationToken)
    {
        var envelope = new RealtimeEnvelopeDto<EventDto>
        {
            Type = AgentHubContracts.Events.EventsUpdated,
            Timestamp = DateTimeOffset.UtcNow,
            CorrelationId = null,
            Payload = createdEvent
        };

        try
        {
            await hubContext.Clients
                .Group(AgentHubContracts.Groups.User(userId))
                .SendAsync(AgentHubContracts.Events.EventsUpdated, envelope, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "Failed to push realtime event update for user {UserId}.", userId);
        }
    }

    private async Task NotifyEventsClearedAsync(string userId, CancellationToken cancellationToken)
    {
        var envelope = new RealtimeEnvelopeDto<object>
        {
            Type = AgentHubContracts.Events.EventsUpdated,
            Timestamp = DateTimeOffset.UtcNow,
            CorrelationId = null,
            Payload = new { userId, cleared = true }
        };

        try
        {
            await hubContext.Clients
                .Group(AgentHubContracts.Groups.User(userId))
                .SendAsync(AgentHubContracts.Events.EventsUpdated, envelope, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "Failed to push realtime event clear update for user {UserId}.", userId);
        }
    }
}
