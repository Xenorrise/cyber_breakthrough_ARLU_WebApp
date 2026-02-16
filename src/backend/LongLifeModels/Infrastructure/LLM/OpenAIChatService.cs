using LongLifeModels.Options;
using LongLifeModels.Services;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace LongLifeModels.Infrastructure.LLM;

// Файл: клиент OpenAI Chat Completions.
public sealed class OpenAIChatService(HttpClient httpClient, IOptions<OpenAIOptions> options) : ILLMService
{
    private readonly OpenAIOptions _options = options.Value;

    // Генерирует текст через /v1/chat/completions.
    public async Task<string> GenerateAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/v1/chat/completions")
        {
            Content = JsonContent.Create(new ChatCompletionRequest(
                _options.ChatModel,
                [
                    new ChatMessage("system", systemPrompt),
                    new ChatMessage("user", userPrompt)
                ]))
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);
        using var response = await httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<ChatCompletionResponse>(cancellationToken: cancellationToken)
            ?? throw new InvalidOperationException("OpenAI chat response was empty.");

        return payload.Choices.FirstOrDefault()?.Message.Content?.Trim()
            ?? throw new InvalidOperationException("OpenAI chat response did not contain assistant message.");
    }

    private sealed record ChatCompletionRequest(string Model, IReadOnlyList<ChatMessage> Messages);
    private sealed record ChatMessage(string Role, string Content);

    private sealed record ChatCompletionResponse([property: JsonPropertyName("choices")] IReadOnlyList<Choice> Choices);
    private sealed record Choice([property: JsonPropertyName("message")] ChatMessageContent Message);
    private sealed record ChatMessageContent([property: JsonPropertyName("content")] string Content);
}
