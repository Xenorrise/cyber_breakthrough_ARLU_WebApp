using LongLifeModels.DTOs;
using LongLifeModels.Services;
using Microsoft.AspNetCore.Mvc;

namespace LongLifeModels.Controllers;

[ApiController]
[Route("api/events")]
public sealed class EventsController(IEventService eventService) : ControllerBase
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
}
