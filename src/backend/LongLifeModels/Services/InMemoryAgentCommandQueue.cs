using System.Threading.Channels;

namespace LongLifeModels.Services;

public sealed class InMemoryAgentCommandQueue : IAgentCommandQueue
{
    private readonly Channel<AgentCommandWorkItem> _channel = Channel.CreateUnbounded<AgentCommandWorkItem>(
        new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false
        });

    public ValueTask EnqueueAsync(AgentCommandWorkItem workItem, CancellationToken cancellationToken)
        => _channel.Writer.WriteAsync(workItem, cancellationToken);

    public IAsyncEnumerable<AgentCommandWorkItem> DequeueAllAsync(CancellationToken cancellationToken)
        => _channel.Reader.ReadAllAsync(cancellationToken);
}
