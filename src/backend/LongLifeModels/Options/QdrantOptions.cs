namespace LongLifeModels.Options;

public sealed class QdrantOptions
{
    public const string SectionName = "Qdrant";

    public string BaseUrl { get; set; } = "http://host.docker.internal:6333";
    public string CollectionName { get; set; } = "memory_logs";
    public string? ApiKey { get; set; }
    public int VectorSize { get; set; } = 1536;
    public string Distance { get; set; } = "Cosine";
}
