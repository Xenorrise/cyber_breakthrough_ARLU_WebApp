using LongLifeModels.DTOs;
using LongLifeModels.Services;
using Microsoft.AspNetCore.Mvc;

namespace LongLifeModels.Controllers;

[ApiController]
[Route("api/agents")]
public sealed class AgentsReadController(
    IUserAgentsService userAgentsService,
    IUserContextService userContextService,
    ILogger<AgentsReadController> logger) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyCollection<AgentDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<AgentDto>>> GetAgents(CancellationToken cancellationToken)
    {
        var userId = ResolveUserId();
        var agents = await userAgentsService.GetAgentsAsync(userId, cancellationToken);
        return Ok(agents);
    }

    [HttpGet("{agentId:guid}")]
    [ProducesResponseType(typeof(AgentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AgentDto>> GetAgent(Guid agentId, CancellationToken cancellationToken)
    {
        var userId = ResolveUserId();
        var agent = await userAgentsService.GetAgentAsync(userId, agentId, cancellationToken);
        if (agent is null)
        {
            return NotFound();
        }

        return Ok(agent);
    }

    private string ResolveUserId()
    {
        try
        {
            return userContextService.GetRequiredUserId(User, Request.Headers);
        }
        catch (UnauthorizedAccessException ex)
        {
            logger.LogWarning("Unauthorized agents read access: {Reason}", ex.Message);
            throw new BadHttpRequestException(ex.Message, StatusCodes.Status401Unauthorized);
        }
    }
}
