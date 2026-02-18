using LongLifeModels.Data;
using LongLifeModels.Domain;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Text.Json;

namespace LongLifeModels.Services;

public sealed class AgentBrain(
    AgentDbContext dbContext,
    ILLMService llmService,
    MemoryService memoryService,
    MemoryCompressor memoryCompressor,
    ILogger<AgentBrain> logger)
{
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

        try
        {
            var reflection = await llmService.GenerateAsync(
                systemPrompt,
                AgentPrompts.BuildReflectionPrompt(
                    JsonSerializer.Serialize(new { worldContext }),
                    JsonSerializer.Serialize(recentInteractions),
                    JsonSerializer.Serialize(recalledMemories)),
                cancellationToken);

            var goal = await llmService.GenerateAsync(
                systemPrompt,
                AgentPrompts.BuildGoalPrompt(reflection),
                cancellationToken);

            var action = await llmService.GenerateAsync(
                systemPrompt,
                AgentPrompts.BuildActionPrompt(reflection, goal),
                cancellationToken);

            return new AgentBrainResult(reflection, goal, action);
        }
        catch (HttpRequestException ex) when (ex.StatusCode is HttpStatusCode.Forbidden or HttpStatusCode.Unauthorized)
        {
            logger.LogWarning(
                ex,
                "LLM access denied for agent {AgentId}. Switching to fallback mode.",
                agentId);

            var summary = BuildFallbackSummary(worldContext);
            return new AgentBrainResult(
                Reflection: "LLM authorization failed. Fallback mode enabled.",
                Goal: "Acknowledge the command and continue simulation without LLM.",
                Action: $"ActionText: {agent.Name} принял задачу в fallback-режиме. Контекст: {summary}");
        }
    }

    private static int EstimateTokens(
        string worldContext,
        IReadOnlyCollection<Interaction> interactions,
        IReadOnlyCollection<MemoryLog> memories)
        => (worldContext.Length / 4) + (interactions.Count * 120) + (memories.Count * 220);

    private static string BuildFallbackSummary(string worldContext)
    {
        if (string.IsNullOrWhiteSpace(worldContext))
        {
            return "пустой контекст";
        }

        var compact = worldContext.Replace('\n', ' ').Replace('\r', ' ').Trim();
        return compact.Length <= 180 ? compact : $"{compact[..177]}...";
    }
}

public sealed record AgentBrainResult(string Reflection, string Goal, string Action);
