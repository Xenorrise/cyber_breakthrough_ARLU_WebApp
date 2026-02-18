using LongLifeModels.Services;
using Microsoft.AspNetCore.Mvc;

namespace LongLifeModels.Controllers;

[ApiController]
[Route("api/agents")]
public sealed class AgentBrainController(AgentBrain agentBrain, MemoryService memoryService) : ControllerBase
{
    [HttpPost("{agentId:guid}/brain/step")]
    public async Task<ActionResult<AgentBrainResult>> RunBrainStep(Guid agentId, [FromBody] AgentBrainRequest request, CancellationToken cancellationToken)
    {
        var result = await agentBrain.ThinkAsync(agentId, request.WorldContext, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{agentId:guid}/memory")]
    public async Task<ActionResult> StoreMemory(Guid agentId, [FromBody] StoreMemoryRequest request, CancellationToken cancellationToken)
    {
        var memory = await memoryService.StoreMemoryAsync(
            agentId,
            request.RelatedAgentId,
            request.Description,
            request.Importance,
            cancellationToken);

        return Ok(memory);
    }

    [HttpGet("{agentId:guid}/memory/recall")]
    public async Task<ActionResult> Recall(Guid agentId, [FromQuery] string query, [FromQuery] int topK = 5, CancellationToken cancellationToken = default)
    {
        var memories = await memoryService.RecallAsync(agentId, query, topK, cancellationToken);
        return Ok(memories);
    }
}

public sealed record AgentBrainRequest(string WorldContext);
public sealed record StoreMemoryRequest(Guid? RelatedAgentId, string Description, float Importance);
