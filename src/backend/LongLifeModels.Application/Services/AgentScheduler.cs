using LongLifeModels.Application.Configs;
using LongLifeModels.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LongLifeModels.Application.Services;
public class AgentScheduler : BackgroundService
{
	private readonly IServiceScopeFactory _scopeFactory;
	private readonly IOptionsMonitor<SimulationConfig> _configMonitor;
	private readonly ILogger<AgentScheduler> _logger;
	private readonly TimeProvider _timeProvider;
	private bool _isPaused;

	public AgentScheduler(
        IServiceScopeFactory scopeFactory,
        IOptionsMonitor<SimulationConfig> configMonitor,
        ILogger<AgentScheduler> logger,
        TimeProvider timeProvider)
    {
        _scopeFactory = scopeFactory;
        _configMonitor = configMonitor;
        _logger = logger;
        _timeProvider = timeProvider;
    }

	protected override async Task ExecuteAsync(CancellationToken stoppingToken)
	{
		_logger.LogInformation("AgentScheduler started.");

		while (!stoppingToken.IsCancellationRequested)
		{
			try
			{
				if (_isPaused)
				{
					await Task.Delay(500, stoppingToken);
					continue;
				}

				var tickStart = _timeProvider.GetTimestamp();
				using (var scope = _scopeFactory.CreateScope())
				{
					var tickProcessor = scope.ServiceProvider.GetRequiredService<ITickProcessor>();
					await tickProcessor.ProcessTickAsync(_timeProvider.GetUtcNow().DateTime, stoppingToken);
				}

				var elapsed = _timeProvider.GetElapsedTime(tickStart);
				var delay = GetNextTickDelay(elapsed);

				await Task.Delay(delay, stoppingToken);
			}
			catch (OperationCanceledException)
			{
				_logger.LogInformation("AgentScheduler closed.");
				break;
			}
			catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception in AgentScheduler. Waiting 5 seconds before retry.");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
		}

		_logger.LogInformation("AgentScheduler stopped.");
	}
	private int GetNextTickDelay(TimeSpan elapsed)
    {
        var config = _configMonitor.CurrentValue;
        int baseIntervalMs = config.TickIntervalMs;
        double speedFactor = config.SpeedFactor;

        int desiredIntervalMs = (int)(baseIntervalMs / Math.Max(0.1, speedFactor));

        int delayMs = desiredIntervalMs - (int)elapsed.TotalMilliseconds;

        return Math.Max(10, delayMs);
    }

	public void Pause() => _isPaused = true;
    public void Resume() => _isPaused = false;
}
