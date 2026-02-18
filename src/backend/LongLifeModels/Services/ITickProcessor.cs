namespace LongLifeModels.Services;

public interface ITickProcessor
{
    Task ProcessTickAsync(DateTime currentTickTime, CancellationToken ct);
    Task ProcessCommandAsync(AgentCommandWorkItem workItem, CancellationToken ct);
}
