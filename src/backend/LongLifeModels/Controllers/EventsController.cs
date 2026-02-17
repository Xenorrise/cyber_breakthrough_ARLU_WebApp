using LongLifeModels.DTOs;
using LongLifeModels.Services;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace LongLifeModels.Controllers;

[ApiController]
[Route("api/events")]
public sealed class EventsController(
    IEventService eventService,
    IUserAgentsService userAgentsService,
    IUserContextService userContextService,
    ILogger<EventsController> logger) : ControllerBase
{
    /// <summary>
    /// Accepts and stores a new event in the system.
    /// </summary>
    /// <remarks>
    /// Use this endpoint when any external producer needs to publish an event for further processing.
    /// </remarks>
    [HttpPost]
    [ProducesResponseType(typeof(EventDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EventDto>> Create(
        [FromBody] CreateEventRequestDto request,
        CancellationToken cancellationToken)
    {
        var created = await eventService.CreateAsync(request, cancellationToken);

        if (IsWorldEvent(request.Type) &&
            TryResolveUserId(out var userId) &&
            !string.IsNullOrWhiteSpace(userId))
        {
            var worldMessage = ExtractWorldMessage(request) ?? $"World event: {request.Type}";
            await FanOutWorldEventAsync(userId, worldMessage, created.Id, cancellationToken);
        }

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>
    /// Returns all events ordered by creation date (newest first).
    /// </summary>
    /// <remarks>
    /// Use this endpoint for operational monitoring, debugging and lightweight event history browsing.
    /// </remarks>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyCollection<EventDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<EventDto>>> GetAll(CancellationToken cancellationToken)
    {
        var events = await eventService.GetAllAsync(cancellationToken);
        return Ok(events);
    }

    /// <summary>
    /// Returns a single event by identifier.
    /// </summary>
    /// <remarks>
    /// Use this endpoint when a consumer needs complete details of a specific event.
    /// </remarks>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(EventDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var found = await eventService.GetByIdAsync(id, cancellationToken);
        if (found is null)
        {
            return NotFound();
        }

        return Ok(found);
    }

    private async Task FanOutWorldEventAsync(
        string userId,
        string worldMessage,
        Guid eventId,
        CancellationToken cancellationToken)
    {
        var agents = await userAgentsService.GetAgentsAsync(userId, cancellationToken);
        foreach (var agent in agents.Where(x => x.Status is not AgentStatuses.Paused and not AgentStatuses.Stopped))
        {
            try
            {
                await userAgentsService.CommandAgentAsync(
                    userId,
                    agent.AgentId,
                    new CommandAgentRequestDto
                    {
                        Command = "world.update",
                        Message = worldMessage,
                        CorrelationId = $"world-{eventId:N}-{agent.AgentId:N}"
                    },
                    cancellationToken);
            }
            catch (Exception ex) when (ex is InvalidOperationException or KeyNotFoundException)
            {
                logger.LogWarning(
                    "World event fan-out skipped for agent {AgentId}: {Reason}",
                    agent.AgentId,
                    ex.Message);
            }
        }
    }

    private static bool IsWorldEvent(string type)
    {
        if (string.IsNullOrWhiteSpace(type))
        {
            return false;
        }

        var lowered = type.Trim().ToLowerInvariant();
        return lowered.Contains("world") ||
               lowered.Contains("environment") ||
               lowered is "ui.note" or "ui.world";
    }

    private static string? ExtractWorldMessage(CreateEventRequestDto request)
    {
        if (request.Payload.ValueKind == JsonValueKind.String)
        {
            return request.Payload.GetString()?.Trim();
        }

        if (request.Payload.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        if (TryGetStringProperty(request.Payload, out var direct))
        {
            return direct;
        }

        if (TryGetObjectProperty(request.Payload, "payload", out var nested) &&
            TryGetStringProperty(nested, out var nestedValue))
        {
            return nestedValue;
        }

        return null;
    }

    private bool TryResolveUserId(out string? userId)
    {
        try
        {
            userId = userContextService.GetRequiredUserId(User, Request.Headers);
            return true;
        }
        catch (UnauthorizedAccessException ex)
        {
            logger.LogDebug("Event was created without user context: {Reason}", ex.Message);
            userId = null;
            return false;
        }
    }

    private static bool TryGetObjectProperty(JsonElement source, string propertyName, out JsonElement value)
    {
        foreach (var property in source.EnumerateObject())
        {
            if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase) &&
                property.Value.ValueKind == JsonValueKind.Object)
            {
                value = property.Value;
                return true;
            }
        }

        value = default;
        return false;
    }

    private static bool TryGetStringProperty(JsonElement source, out string? value)
    {
        string[] keys = ["text", "message", "description", "content"];
        foreach (var property in source.EnumerateObject())
        {
            if (property.Value.ValueKind != JsonValueKind.String)
            {
                continue;
            }

            if (!keys.Any(key => string.Equals(key, property.Name, StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            var parsed = property.Value.GetString()?.Trim();
            if (!string.IsNullOrWhiteSpace(parsed))
            {
                value = parsed;
                return true;
            }
        }

        value = null;
        return false;
    }
}
