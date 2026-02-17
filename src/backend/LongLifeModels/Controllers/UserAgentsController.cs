using LongLifeModels.DTOs;
using LongLifeModels.Services;
using Microsoft.AspNetCore.Mvc;

namespace LongLifeModels.Controllers;

[ApiController]
[Route("api/user-agents")]
public sealed class UserAgentsController(
    IUserAgentsService userAgentsService,
    IUserContextService userContextService,
    ILogger<UserAgentsController> logger) : ControllerBase
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

    [HttpGet("{agentId:guid}/messages")]
    [ProducesResponseType(typeof(PagedResultDto<AgentMessageDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResultDto<AgentMessageDto>>> GetMessages(
        Guid agentId,
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = ResolveUserId();
            var messages = await userAgentsService.GetMessagesAsync(userId, agentId, limit, cancellationToken);
            return Ok(messages);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost]
    [ProducesResponseType(typeof(AgentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AgentDto>> Create(
        [FromBody] CreateAgentRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = ResolveUserId();
        var created = await userAgentsService.CreateAgentAsync(userId, request, cancellationToken);
        return CreatedAtAction(nameof(GetAgent), new { agentId = created.AgentId }, created);
    }

    [HttpPost("{agentId:guid}/commands")]
    [ProducesResponseType(typeof(CommandAckDto), StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CommandAckDto>> CommandAgent(
        Guid agentId,
        [FromBody] CommandAgentRequestDto request,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = ResolveUserId();
            var accepted = await userAgentsService.CommandAgentAsync(userId, agentId, request, cancellationToken);
            return Accepted(accepted);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ErrorDto
            {
                Code = "invalid_agent_state",
                Message = ex.Message,
                AgentId = agentId
            });
        }
    }

    [HttpPost("{agentId:guid}/pause")]
    [ProducesResponseType(typeof(AgentStatusDto), StatusCodes.Status200OK)]
    public Task<ActionResult<AgentStatusDto>> Pause(Guid agentId, CancellationToken cancellationToken)
        => ChangeStatus(agentId, cancellationToken, userAgentsService.PauseAgentAsync);

    [HttpPost("{agentId:guid}/resume")]
    [ProducesResponseType(typeof(AgentStatusDto), StatusCodes.Status200OK)]
    public Task<ActionResult<AgentStatusDto>> Resume(Guid agentId, CancellationToken cancellationToken)
        => ChangeStatus(agentId, cancellationToken, userAgentsService.ResumeAgentAsync);

    [HttpPost("{agentId:guid}/stop")]
    [ProducesResponseType(typeof(AgentStatusDto), StatusCodes.Status200OK)]
    public Task<ActionResult<AgentStatusDto>> Stop(Guid agentId, CancellationToken cancellationToken)
        => ChangeStatus(agentId, cancellationToken, userAgentsService.StopAgentAsync);

    [HttpDelete("{agentId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<ActionResult> Archive(Guid agentId, CancellationToken cancellationToken)
    {
        try
        {
            var userId = ResolveUserId();
            await userAgentsService.ArchiveAgentAsync(userId, agentId, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    private async Task<ActionResult<AgentStatusDto>> ChangeStatus(
        Guid agentId,
        CancellationToken cancellationToken,
        Func<string, Guid, CancellationToken, Task<AgentStatusDto>> operation)
    {
        try
        {
            var userId = ResolveUserId();
            var status = await operation(userId, agentId, cancellationToken);
            return Ok(status);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    private string ResolveUserId()
    {
        try
        {
            return userContextService.GetRequiredUserId(User, Request.Headers);
        }
        catch (UnauthorizedAccessException ex)
        {
            logger.LogWarning("Unauthorized user-agents access: {Reason}", ex.Message);
            throw new BadHttpRequestException(ex.Message, StatusCodes.Status401Unauthorized);
        }
    }
}
