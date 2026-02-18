using LongLifeModels.Data;
using LongLifeModels.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace LongLifeModels.Services;

public sealed class MemoryCompressor(
    AgentDbContext dbContext,
    MemoryService memoryService,
    ILLMService llmService,
    IVectorStore vectorStore,
    IOptions<MemoryCompressionOptions> compressionOptions,
    IOptions<QdrantOptions> qdrantOptions,
    ILogger<MemoryCompressor> logger)
{
    private readonly MemoryCompressionOptions _compression = compressionOptions.Value;
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

        string summary;
        try
        {
            summary = await llmService.GenerateAsync(
                "You are a memory compression subsystem for autonomous agents.",
                AgentPrompts.BuildMemorySummarizationPrompt(memoryChunkJson),
                cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning(ex, "Skipping memory compression because LLM is unavailable.");
            return false;
        }

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
            try
            {
                await vectorStore.DeleteAsync(_collection, memory.Id.ToString(), cancellationToken);
            }
            catch (HttpRequestException ex)
            {
                logger.LogWarning(ex, "Skipping vector delete for memory {MemoryId}.", memory.Id);
            }
        }

        return true;
    }
}
