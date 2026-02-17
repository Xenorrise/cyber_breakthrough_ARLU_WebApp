namespace LongLifeModels.Options;

public sealed class OpenAIOptions
{
    public const string SectionName = "OpenAI";

    public string ApiKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://api.openai.com";
    public string ChatBaseUrl { get; set; } = string.Empty;
    public string ChatModel { get; set; } = "openai/gpt-oss-20b";
    public string EmbeddingModel { get; set; } = "text-embedding-3-small";
}
