namespace LongLifeModels.Options;

public sealed class TickProcessorOptions
{
    public const string SectionName = "TickProcessor";

    public int MaxAgentsPerTick { get; set; } = 100;
    public int MaxParallelism { get; set; } = 4;
    public int WorldContextMaxLength { get; set; } = 1200;
}
