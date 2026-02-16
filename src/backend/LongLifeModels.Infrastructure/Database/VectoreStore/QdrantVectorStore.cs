using LongLifeModels.Infrastructure.Configs;
using LongLifeModels.Domain.Interfaces;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace LongLifeModels.Infrastructure.VectorStore;

// Файл: адаптер векторной БД Qdrant.
public sealed class QdrantVectorStore(HttpClient httpClient, IOptions<QdrantConfig> options) : IVectorStore
{
    private readonly QdrantConfig _options = options.Value;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    // Гарантирует наличие коллекции в Qdrant.
    public async Task EnsureCollectionExistsAsync(CancellationToken cancellationToken = default)
    {
        var collectionPath = $"/collections/{_options.CollectionName}";
        var getResponse = await httpClient.GetAsync(collectionPath, cancellationToken);
        if (getResponse.IsSuccessStatusCode)
        {
            return;
        }

        var createBody = new
        {
            vectors = new
            {
                size = _options.VectorSize,
                distance = _options.Distance
            }
        };

        using var createResponse = await httpClient.PutAsJsonAsync(collectionPath, createBody, JsonOptions, cancellationToken);
        createResponse.EnsureSuccessStatusCode();
    }

    // Добавляет или обновляет вектор.
    public async Task UpsertAsync(string collection, VectorRecord record, CancellationToken cancellationToken = default)
    {
        var body = new
        {
            points = new[]
            {
                new
                {
                    id = record.Id,
                    vector = record.Vector,
                    payload = record.Payload
                }
            }
        };

        using var response = await httpClient.PutAsJsonAsync($"/collections/{collection}/points", body, JsonOptions, cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    // Выполняет векторный поиск ближайших записей.
    public async Task<IReadOnlyList<VectorSearchResult>> SearchAsync(string collection, IReadOnlyList<float> queryVector, int topK, CancellationToken cancellationToken = default)
    {
        var body = new
        {
            vector = queryVector,
            limit = topK,
            with_payload = true,
            with_vector = false
        };

        using var response = await httpClient.PostAsJsonAsync($"/collections/{collection}/points/search", body, JsonOptions, cancellationToken);
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<QdrantSearchResponse>(JsonOptions, cancellationToken)
            ?? throw new InvalidOperationException("Qdrant response was empty.");

        return payload.Result
            .Select(item => new VectorSearchResult(
                item.Id?.ToString() ?? string.Empty,
                item.Score,
                item.Payload ?? new Dictionary<string, string>()))
            .Where(x => !string.IsNullOrWhiteSpace(x.Id))
            .ToArray();
    }

    // Удаляет вектор по id.
    public async Task DeleteAsync(string collection, string id, CancellationToken cancellationToken = default)
    {
        var body = new
        {
            points = new[] { id }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, $"/collections/{collection}/points/delete")
        {
            Content = JsonContent.Create(body, options: JsonOptions)
        };

        using var response = await httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    private sealed record QdrantSearchResponse([property: JsonPropertyName("result")] IReadOnlyList<QdrantPoint> Result);

    private sealed record QdrantPoint(
        [property: JsonPropertyName("id")] object Id,
        [property: JsonPropertyName("score")] float Score,
        [property: JsonPropertyName("payload")] Dictionary<string, string>? Payload);
}
