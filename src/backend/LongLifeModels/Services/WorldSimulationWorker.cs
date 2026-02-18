using System.Diagnostics;

namespace LongLifeModels.Services;

public sealed class WorldSimulationWorker(
    IWorldSimulationService worldSimulationService,
    ILogger<WorldSimulationWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var stopwatch = Stopwatch.StartNew();
        var previous = stopwatch.Elapsed;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
                var now = stopwatch.Elapsed;
                var delta = now - previous;
                previous = now;
                await worldSimulationService.TickAsync(delta, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "World simulation worker iteration failed.");
            }
        }
    }
}
