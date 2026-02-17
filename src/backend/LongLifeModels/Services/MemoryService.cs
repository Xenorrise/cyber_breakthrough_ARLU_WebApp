using LongLifeModels.Data;
using LongLifeModels.Domain;
using LongLifeModels.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace LongLifeModels.Services;

// Файл: сервис хранения и поиска эпизодической памяти.
public sealed class MemoryService(
    AgentDbContext dbContext,
    IEmbeddingService embeddingService,
    IVectorStore vectorStore,
    IOptions<QdrantOptions> qdrantOptions,
    ILogger<MemoryService> logger)
{
    private readonly string _collection = qdrantOptions.Value.CollectionName;

    // Сохраняет MemoryLog и его embedding в векторной БД.
    public async Task<MemoryLog> StoreMemoryAsync(
        Guid agentId,
        Guid? relatedAgentId,
        string description,
        float importance,
        CancellationToken cancellationToken = default)
    {
        var memory = new MemoryLog
        {
            Id = Guid.NewGuid(),
            AgentId = agentId,
            RelatedAgentId = relatedAgentId,
            Description = description,
            Importance = importance,
            Timestamp = DateTimeOffset.UtcNow
        };

        dbContext.MemoryLogs.Add(memory);
        await dbContext.SaveChangesAsync(cancellationToken);

        var embedding = await embeddingService.EmbedAsync(memory.Description, cancellationToken);
        try
        {
            await vectorStore.UpsertAsync(
                _collection,
                new VectorRecord(
                    memory.Id.ToString(),
                    embedding,
                    new Dictionary<string, string>
                    {
                        ["memoryLogId"] = memory.Id.ToString(),
                        ["agentId"] = memory.AgentId.ToString(),
                        ["relatedAgentId"] = memory.RelatedAgentId?.ToString() ?? string.Empty,
                        ["importance"] = memory.Importance.ToString("0.###", System.Globalization.CultureInfo.InvariantCulture),
                        ["timestamp"] = memory.Timestamp.ToString("O")
                    }),
                cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning(ex, "Skipping vector upsert because Qdrant is unavailable.");
        }

        return memory;
    }

    // Ищет релевантные воспоминания по семантическому запросу.
    public async Task<IReadOnlyList<MemoryLog>> RecallAsync(
        Guid agentId,
        string semanticQuery,
        int topK = 5,
        CancellationToken cancellationToken = default)
    {
        var queryVector = await embeddingService.EmbedAsync(semanticQuery, cancellationToken);
        IReadOnlyList<VectorSearchResult> vectorMatches;
        try
        {
            vectorMatches = await vectorStore.SearchAsync(_collection, queryVector, topK * 3, cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning(ex, "Skipping vector recall because Qdrant is unavailable.");
            return Array.Empty<MemoryLog>();
        }

        var scopedIds = vectorMatches
            .Where(match => match.Payload.TryGetValue("agentId", out var payloadAgentId) && payloadAgentId == agentId.ToString())
            .Select(match => Guid.TryParse(match.Id, out var parsedId) ? parsedId : Guid.Empty)
            .Where(id => id != Guid.Empty)
            .Take(topK)
            .ToArray();

        return await dbContext.MemoryLogs
            .Where(log => scopedIds.Contains(log.Id))
            .OrderByDescending(log => log.Importance)
            .ThenByDescending(log => log.Timestamp)
            .ToArrayAsync(cancellationToken);
    }
}
