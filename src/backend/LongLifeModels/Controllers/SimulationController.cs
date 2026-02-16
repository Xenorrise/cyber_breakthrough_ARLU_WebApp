using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Mvc;
using LongLifeModels.Application.Configs;
using LongLifeModels.Application.Services;

[ApiController]
[Route("api/simulation")]
public class SimulationController : ControllerBase
{
    private readonly IOptionsMonitor<SimulationConfig> _configMonitor;
    private readonly AgentScheduler _scheduler;

    public SimulationController(IOptionsMonitor<SimulationConfig> configMonitor, AgentScheduler scheduler)
    {
        _configMonitor = configMonitor;
        _scheduler = scheduler;
    }

    [HttpPost("speed")]
    public IActionResult SetSpeed(double factor)
    {
        // IOptionsSnapshot
        var config = _configMonitor.CurrentValue;
        config.SpeedFactor = factor;
        // Если используется IOptionsMonitor, изменение будет подхвачено автоматически
        return Ok();
    }

    [HttpPost("pause")]
    public IActionResult Pause() { _scheduler.Pause(); return Ok(); }

    [HttpPost("resume")]
    public IActionResult Resume() { _scheduler.Resume(); return Ok(); }
}