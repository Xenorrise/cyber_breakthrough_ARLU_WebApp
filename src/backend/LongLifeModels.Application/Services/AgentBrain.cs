using Microsoft.EntityFrameworkCore;
using LongLifeModels.Domain.Entities;
using System.Text.Json;
using LongLifeModels.Infrastructure.Context;
using LongLifeModels.Application.Interfaces;

namespace LongLifeModels.Application.Services;

// Файл: когнитивный цикл агента через LLM.
public sealed class AgentBrain(
    AgentDbContext dbContext,
    ILLMService llmService,
    MemoryService memoryService,
    MemoryCompressor memoryCompressor,
    IPromptBuilder promptBuilder) : IAgentBrain
{
    public async Task<AgentBrainResult> ThinkAsync(
        Guid agentId,
        string worldContext,
        DateTime currentTime,
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

        // --- Этап 1: Рефлексия ---
        var reflectionPrompt = await promptBuilder.BuildAsync(
            agent, currentTime, PromptStage.Reflection, worldContext,
            cancellationToken: cancellationToken);
        var reflection = await llmService.GenerateAsync(
            reflectionPrompt.SystemMessage, reflectionPrompt.UserMessage, cancellationToken);

        // --- Этап 2: Цель ---
        var goalPrompt = await promptBuilder.BuildAsync(
            agent, currentTime, PromptStage.Goal, worldContext,
            reflection: reflection, cancellationToken: cancellationToken);
        var goal = await llmService.GenerateAsync(
            goalPrompt.SystemMessage, goalPrompt.UserMessage, cancellationToken);

        // --- Этап 3: Действие ---
        var actionPrompt = await promptBuilder.BuildAsync(
            agent, currentTime, PromptStage.Action, worldContext,
            reflection: reflection, goal: goal, cancellationToken: cancellationToken);
        var action = await llmService.GenerateAsync(
            actionPrompt.SystemMessage, actionPrompt.UserMessage, cancellationToken);

        return new AgentBrainResult(reflection, goal, action);
    }

    private static int EstimateTokens(string worldContext, IReadOnlyCollection<Interaction> interactions, IReadOnlyCollection<MemoryLog> memories)
        => (worldContext.Length / 4) + (interactions.Count * 120) + (memories.Count * 220);
}

public sealed record AgentBrainResult(string Reflection, string Goal, string Action);
