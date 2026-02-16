using LongLifeModels.Data;
using Microsoft.EntityFrameworkCore;
using LongLifeModels.Domain;
using System.Text.Json;

namespace LongLifeModels.Services;

// Файл: когнитивный цикл агента через LLM.
public sealed class AgentBrain(
    AgentDbContext dbContext,
    ILLMService llmService,
    MemoryService memoryService,
    MemoryCompressor memoryCompressor)
{
    // Выполняет один цикл Reflection -> Goal -> Action.
    public async Task<AgentBrainResult> ThinkAsync(
        Guid agentId,
        string worldContext,
        CancellationToken cancellationToken = default)
    {
        var agent = await dbContext.Agents.FirstOrDefaultAsync(x => x.Id == agentId, cancellationToken)
            ?? throw new InvalidOperationException($"Agent '{agentId}' not found.");

        var recentInteractions = await dbContext.Interactions
            .Where(x => x.InitiatorAgentId == agentId || x.TargetAgentId == agentId)
            .OrderByDescending(x => x.Id)
            .Take(10)
            .ToArrayAsync(cancellationToken);

        var recalledMemories = await memoryService.RecallAsync(agentId, worldContext, topK: 6, cancellationToken);

        var estimatedTokens = EstimateTokens(worldContext, recentInteractions, recalledMemories);
        await memoryCompressor.CompressIfNeededAsync(agentId, estimatedTokens, cancellationToken);

        var systemPrompt = AgentPrompts.BuildAgentSystemPrompt(
            agent.Name,
            agent.Status,
            agent.State,
            agent.Energy,
            JsonSerializer.Serialize(agent.PersonalityTraits));

        var reflection = await llmService.GenerateAsync(
            systemPrompt,
            AgentPrompts.BuildReflectionPrompt(
                JsonSerializer.Serialize(new { worldContext }),
                JsonSerializer.Serialize(recentInteractions),
                JsonSerializer.Serialize(recalledMemories)),
            cancellationToken);

        var goal = await llmService.GenerateAsync(systemPrompt, AgentPrompts.BuildGoalPrompt(reflection), cancellationToken);

        var action = await llmService.GenerateAsync(systemPrompt, AgentPrompts.BuildActionPrompt(reflection, goal), cancellationToken);

        return new AgentBrainResult(reflection, goal, action);
    }

    // Оценивает размер контекста для триггера сжатия.
    private static int EstimateTokens(string worldContext, IReadOnlyCollection<Interaction> interactions, IReadOnlyCollection<MemoryLog> memories)
        => (worldContext.Length / 4) + (interactions.Count * 120) + (memories.Count * 220);
}

public sealed record AgentBrainResult(string Reflection, string Goal, string Action);
