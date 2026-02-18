namespace LongLifeModels.Options;

public sealed class MemoryCompressionOptions
{
    public const string SectionName = "MemoryCompression";

    public int MaxMemoryLogsPerAgent { get; set; } = 500;
    public int CompressionBatchSize { get; set; } = 25;
    public int ContextTokenLimit { get; set; } = 8000;
    public float SummaryImportance { get; set; } = 0.7f;
}
