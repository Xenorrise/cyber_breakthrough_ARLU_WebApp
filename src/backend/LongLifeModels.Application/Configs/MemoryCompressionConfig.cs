namespace LongLifeModels.Application.Configs;

public sealed class MemoryCompressionConfig
{
    public const string SectionName = "MemoryCompression";

    public int MaxMemoryLogsPerAgent { get; set; } = 500;
    public int CompressionBatchSize { get; set; } = 25;
    public int ContextTokenLimit { get; set; } = 8000;
    public int SummaryImportance { get; set; } = 7;
}
