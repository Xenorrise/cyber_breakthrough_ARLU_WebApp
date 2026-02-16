namespace LongLifeModels.Application.Configs;
public class SimulationConfig
{
    public int TickIntervalMs { get; set; } = 1000;
    public double SpeedFactor { get; set; } = 1.0;
	public int MaxAgentsPerTick { get; set; } = 100;
	public int MessageTypingDelayMs { get; set; } = 50;
}