using LongLifeModels.Options;
using LongLifeModels.Services;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace LongLifeModels.Infrastructure.LLM;

public sealed class OpenAIChatService(HttpClient httpClient, IOptions<OpenAIOptions> options) : ILLMService
{
    private readonly OpenAIOptions _options = options.Value;
    private const int MaxRateLimitRetries = 1;
    private static readonly TimeSpan DefaultRateLimitRetryDelay = TimeSpan.FromSeconds(2);
    private static readonly TimeSpan MaxRateLimitRetryDelay = TimeSpan.FromSeconds(10);

    public async Task<string> GenerateAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken = default)
    {
        for (var attempt = 0; attempt <= MaxRateLimitRetries; attempt++)
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

            if (response.StatusCode == HttpStatusCode.TooManyRequests && attempt < MaxRateLimitRetries)
            {
                var retryDelay = ResolveRetryDelay(response.Headers.RetryAfter);
                await Task.Delay(retryDelay, cancellationToken);
                continue;
            }

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                var errorSuffix = string.IsNullOrWhiteSpace(errorBody)
                    ? string.Empty
                    : $" Body: {TrimForMessage(errorBody)}";

                throw new HttpRequestException(
                    $"OpenAI request failed with status {(int)response.StatusCode} ({response.StatusCode}).{errorSuffix}",
                    inner: null,
                    statusCode: response.StatusCode);
            }

            var payload = await response.Content.ReadFromJsonAsync<ChatCompletionResponse>(cancellationToken: cancellationToken)
                ?? throw new InvalidOperationException("OpenAI chat response was empty.");

            return payload.Choices.FirstOrDefault()?.Message.Content?.Trim()
                ?? throw new InvalidOperationException("OpenAI chat response did not contain assistant message.");
        }

        throw new InvalidOperationException("OpenAI generation did not complete after retry.");
    }

    private static TimeSpan ResolveRetryDelay(RetryConditionHeaderValue? retryAfter)
    {
        if (retryAfter?.Delta is TimeSpan delta && delta > TimeSpan.Zero)
        {
            return delta <= MaxRateLimitRetryDelay ? delta : MaxRateLimitRetryDelay;
        }

        if (retryAfter?.Date is DateTimeOffset date)
        {
            var until = date - DateTimeOffset.UtcNow;
            if (until > TimeSpan.Zero)
            {
                return until <= MaxRateLimitRetryDelay ? until : MaxRateLimitRetryDelay;
            }
        }

        return DefaultRateLimitRetryDelay;
    }

    private static string TrimForMessage(string value)
    {
        const int maxLen = 400;
        var compact = value.Replace('\n', ' ').Replace('\r', ' ').Trim();
        return compact.Length <= maxLen ? compact : compact[..maxLen];
    }

    private sealed record ChatCompletionRequest(string Model, IReadOnlyList<ChatMessage> Messages);
    private sealed record ChatMessage(string Role, string Content);

    private sealed record ChatCompletionResponse([property: JsonPropertyName("choices")] IReadOnlyList<Choice> Choices);
    private sealed record Choice([property: JsonPropertyName("message")] ChatMessageContent Message);
    private sealed record ChatMessageContent([property: JsonPropertyName("content")] string Content);
}
