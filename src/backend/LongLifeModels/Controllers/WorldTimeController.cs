using LongLifeModels.DTOs;
using LongLifeModels.Services;
using Microsoft.AspNetCore.Mvc;

namespace LongLifeModels.Controllers;

[ApiController]
[Route("api/world/time")]
public sealed class WorldTimeController(
    IWorldSimulationService worldSimulationService,
    IUserContextService userContextService,
    ILogger<WorldTimeController> logger) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(WorldTimeDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorldTimeDto>> Get(CancellationToken cancellationToken)
    {
        var userId = ResolveUserId();
        var result = await worldSimulationService.GetWorldTimeAsync(userId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("speed")]
    [ProducesResponseType(typeof(WorldTimeDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorldTimeDto>> UpdateSpeed(
        [FromBody] UpdateWorldTimeSpeedRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = ResolveUserId();
        var result = await worldSimulationService.UpdateSpeedAsync(userId, request.Speed, cancellationToken);
        return Ok(result);
    }

    [HttpPost("advance")]
    [ProducesResponseType(typeof(WorldTimeDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorldTimeDto>> Advance(
        [FromBody] AdvanceWorldTimeRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = ResolveUserId();
        var result = await worldSimulationService.AdvanceTimeAsync(userId, request.Minutes, cancellationToken);
        return Ok(result);
    }

    [HttpPost("reset")]
    [ProducesResponseType(typeof(WorldTimeDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorldTimeDto>> Reset(CancellationToken cancellationToken)
    {
        var userId = ResolveUserId();
        var result = await worldSimulationService.RestartWorldAsync(userId, cancellationToken);
        return Ok(result);
    }

    private string ResolveUserId()
    {
        try
        {
            return userContextService.GetRequiredUserId(User, Request.Headers);
        }
        catch (UnauthorizedAccessException ex)
        {
            logger.LogWarning("Unauthorized world-time access: {Reason}", ex.Message);
            throw new BadHttpRequestException(ex.Message, StatusCodes.Status401Unauthorized);
        }
    }
}
