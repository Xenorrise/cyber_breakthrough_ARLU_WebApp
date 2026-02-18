namespace LongLifeModels.Services;

public interface IAgentCommandQueue
{
    ValueTask EnqueueAsync(AgentCommandWorkItem workItem, CancellationToken cancellationToken);
    IAsyncEnumerable<AgentCommandWorkItem> DequeueAllAsync(CancellationToken cancellationToken);
}
