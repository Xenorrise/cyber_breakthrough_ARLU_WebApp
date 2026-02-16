using LongLifeModels.Infrastructure.Context;
using LongLifeModels.Infrastructure.Configs;
using LongLifeModels.Domain.Interfaces;
using LongLifeModels.Application.Configs;
using LongLifeModels.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace LongLifeModels.Application.Services;

// Файл: LLM-сжатие памяти при переполнении.
public sealed class MemoryCompressor(
    AgentDbContext dbContext,
    MemoryService memoryService,
    ILLMService llmService,
    IVectorStore vectorStore,
    IOptions<MemoryCompressionConfig> compressionOptions,
    IOptions<QdrantConfig> qdrantOptions)
{
    private readonly MemoryCompressionConfig _compression = compressionOptions.Value;
    private readonly string _collection = qdrantOptions.Value.CollectionName;

    public async Task<bool> CompressIfNeededAsync(
        Guid agentId,
        int estimatedContextTokens,
        CancellationToken cancellationToken = default)
    {
        var totalCount = await dbContext.MemoryLogs.CountAsync(x => x.AgentId == agentId, cancellationToken);
        var limitExceeded = totalCount > _compression.MaxMemoryLogsPerAgent;
        var contextExceeded = estimatedContextTokens > _compression.ContextTokenLimit;

        if (!limitExceeded && !contextExceeded)
        {
            return false;
        }

        var candidates = await dbContext.MemoryLogs
            .Where(x => x.AgentId == agentId)
            .OrderBy(x => x.Importance)
            .ThenBy(x => x.Timestamp)
            .Take(_compression.CompressionBatchSize)
            .ToArrayAsync(cancellationToken);

        if (candidates.Length == 0)
        {
            return false;
        }

        var memoryChunkJson = JsonSerializer.Serialize(candidates.Select(m => new
        {
            m.Id,
            m.Description,
            m.Importance,
            m.Timestamp,
            m.RelatedAgentId
        }));

        var summary = await llmService.GenerateAsync(
            "Ты подсистема сжатия памяти автономных агентов.",
            AgentPrompts.BuildMemorySummarizationPrompt(memoryChunkJson),
            cancellationToken);

        var relatedAgentId = candidates
            .GroupBy(x => x.RelatedAgentId)
            .OrderByDescending(x => x.Count())
            .Select(x => x.Key)
            .FirstOrDefault();

        await memoryService.StoreMemoryAsync(
            agentId,
            relatedAgentId,
            summary,
            _compression.SummaryImportance,
            cancellationToken);

        dbContext.MemoryLogs.RemoveRange(candidates);
        await dbContext.SaveChangesAsync(cancellationToken);

        foreach (var memory in candidates)
        {
            await vectorStore.DeleteAsync(_collection, memory.Id.ToString(), cancellationToken);
        }

        return true;
    }
}
