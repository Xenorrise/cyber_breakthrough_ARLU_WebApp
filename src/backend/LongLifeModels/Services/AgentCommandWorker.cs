namespace LongLifeModels.Services;

public sealed class AgentCommandWorker(
    IServiceScopeFactory scopeFactory,
    IAgentCommandQueue commandQueue,
    ILogger<AgentCommandWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var workItem in commandQueue.DequeueAllAsync(stoppingToken))
        {
            try
            {
                await ProcessAsync(workItem, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                logger.LogInformation("Agent command worker is stopping.");
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Unhandled error while processing queued command for agent {AgentId}.", workItem.AgentId);
            }
        }
    }

    private async Task ProcessAsync(AgentCommandWorkItem workItem, CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var tickProcessor = scope.ServiceProvider.GetRequiredService<ITickProcessor>();
        logger.LogDebug(
            "Dequeued agent command trigger for agent {AgentId}, user {UserId}, correlation {CorrelationId}.",
            workItem.AgentId,
            workItem.UserId,
            workItem.CorrelationId);

        await tickProcessor.ProcessTickAsync(DateTime.UtcNow, cancellationToken);
    }
}
