using LongLifeModels.Infrastructure.Context;
using LongLifeModels.Infrastructure.Configs;
using LongLifeModels.Domain.Entities;
using LongLifeModels.Domain.Interfaces;
using LongLifeModels.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace LongLifeModels.Application.Services;

// Файл: сервис хранения и поиска эпизодической памяти.
public sealed class MemoryService(
    AgentDbContext dbContext,
    IEmbeddingService embeddingService,
    IVectorStore vectorStore,
    IOptions<QdrantConfig> qdrantOptions)
{
    private readonly string _collection = qdrantOptions.Value.CollectionName;

    public async Task<MemoryLog> StoreMemoryAsync(
        Guid agentId,
        Guid? relatedAgentId,
        string description,
        int importance,
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

        return memory;
    }

    public async Task<IReadOnlyList<MemoryLog>> RecallAsync(
        Guid agentId,
        string semanticQuery,
        int topK = 5,
        CancellationToken cancellationToken = default)
    {
        var queryVector = await embeddingService.EmbedAsync(semanticQuery, cancellationToken);
        var vectorMatches = await vectorStore.SearchAsync(_collection, queryVector, topK * 3, cancellationToken);

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
