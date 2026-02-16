namespace LongLifeModels.Application.Configs;

public class TickProcessorConfig
{
    public int MaxAgentsPerTick { get; set; } = 500;
    public int MaxParallelism { get; set; } = 10;
    public int WorldContextMaxLength { get; set; } = 500;
}