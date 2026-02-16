namespace LongLifeModels.Services;

public interface IVectorStore
{
    Task UpsertAsync(string collection, VectorRecord record, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<VectorSearchResult>> SearchAsync(string collection, IReadOnlyList<float> queryVector, int topK, CancellationToken cancellationToken = default);
    Task DeleteAsync(string collection, string id, CancellationToken cancellationToken = default);
}

public sealed record VectorRecord(string Id, IReadOnlyList<float> Vector, IReadOnlyDictionary<string, string> Payload);
public sealed record VectorSearchResult(string Id, float Score, IReadOnlyDictionary<string, string> Payload);
