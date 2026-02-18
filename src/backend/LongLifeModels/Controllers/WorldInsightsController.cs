using LongLifeModels.DTOs;
using LongLifeModels.Services;
using Microsoft.AspNetCore.Mvc;

namespace LongLifeModels.Controllers;

[ApiController]
[Route("api")]
public sealed class WorldInsightsController(
    IWorldInsightsService worldInsightsService,
    IUserContextService userContextService,
    ILogger<WorldInsightsController> logger) : ControllerBase
{
    [HttpGet("relationships")]
    [ProducesResponseType(typeof(IReadOnlyCollection<RelationshipDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<RelationshipDto>>> GetRelationships(CancellationToken cancellationToken)
    {
        var userId = ResolveUserId();
        var relationships = await worldInsightsService.GetRelationshipsAsync(userId, cancellationToken);
        return Ok(relationships);
    }

    [HttpGet("stats")]
    [ProducesResponseType(typeof(WorldStatsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorldStatsDto>> GetStats(CancellationToken cancellationToken)
    {
        var userId = ResolveUserId();
        var stats = await worldInsightsService.GetStatsAsync(userId, cancellationToken);
        return Ok(stats);
    }

    private string ResolveUserId()
    {
        try
        {
            return userContextService.GetRequiredUserId(User, Request.Headers);
        }
        catch (UnauthorizedAccessException ex)
        {
            logger.LogWarning("Unauthorized world-insights access: {Reason}", ex.Message);
            throw new BadHttpRequestException(ex.Message, StatusCodes.Status401Unauthorized);
        }
    }
}
