using LongLifeModels.Application.Configs;
using LongLifeModels.Application.Interfaces;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace LongLifeModels.Application.Services;

// Файл: клиент OpenAI Embeddings.
public sealed class OpenAIEmbeddingService(HttpClient httpClient, IOptions<OpenAIOptions> options) : IEmbeddingService
{
    private readonly OpenAIOptions _options = options.Value;

    // Строит embedding через /v1/embeddings.
    public async Task<IReadOnlyList<float>> EmbedAsync(string text, CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/v1/embeddings")
        {
            Content = JsonContent.Create(new EmbeddingRequest(_options.EmbeddingModel, text))
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);
        using var response = await httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<EmbeddingResponse>(cancellationToken: cancellationToken)
            ?? throw new InvalidOperationException("OpenAI embeddings response was empty.");

        return payload.Data.FirstOrDefault()?.Embedding
            ?? throw new InvalidOperationException("OpenAI embeddings response did not contain vectors.");
    }

    private sealed record EmbeddingRequest(string Model, string Input);
    private sealed record EmbeddingResponse([property: JsonPropertyName("data")] IReadOnlyList<EmbeddingItem> Data);
    private sealed record EmbeddingItem([property: JsonPropertyName("embedding")] IReadOnlyList<float> Embedding);
}
