using LongLifeModels.Application.Interfaces;
using LongLifeModels.Domain.Entities;
using LongLifeModels.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace LongLifeModels.Application.Services;

public class ActionExecutor : IActionExecutor
{
    private readonly ILogger<ActionExecutor> _logger;

    public ActionExecutor(ILogger<ActionExecutor> logger)
    {
        _logger = logger;
    }

    public async Task<(Agent UpdatedAgent, IReadOnlyCollection<IDomainEvent> Events)> ExecuteAsync(
        Agent agent,
        AgentDecision decision,
        DateTime currentTime,
        CancellationToken cancellationToken)
    {

        var events = new List<IDomainEvent>();
		// Add energy spending
        switch (decision.Action.ToLowerInvariant())
        {
            case "говорить":
                await HandleSpeak(agent, decision.Parameters, currentTime, events);
                break;

            // case "переместиться":
            //     await HandleMove(agent, decision.Parameters, currentTime, events);
            //     break;

            case "отдыхать":
                await HandleRest(agent, decision.Parameters, currentTime, events);
                break;

            case "взаимодействовать":
                await HandleInteract(agent, decision.Parameters, currentTime, events);
                break;

            default:
                _logger.LogWarning("Unknown action type '{Action}' for agent {AgentId}", decision.Action, agent.Id);
                break;
        }
        

        return (agent, events);
    }

    private Task HandleSpeak(Agent agent, Dictionary<string, object> parameters, DateTime currentTime, List<IDomainEvent> events)
    {
        if (parameters.TryGetValue("targetAgentId", out var targetIdObj) &&
            parameters.TryGetValue("message", out var messageObj))
        {
            var targetId = Guid.Parse(targetIdObj.ToString());
            var message = messageObj.ToString();

            //events.Add(new MessageSentEvent(agent.Id, targetId, message, currentTime));
            _logger.LogDebug("Agent {AgentId} speaks to {TargetId}: {Message}", agent.Id, targetId, message);
        }
        return Task.CompletedTask;
    }

    // private Task HandleMove(Agent agent, Dictionary<string, object> parameters, DateTime currentTime, List<IDomainEvent> events)
    // {
    //     if (parameters.TryGetValue("location", out var locObj))
    //     {
    //         var location = locObj.ToString();
    //         // Обновляем локацию агента (предполагаем, что есть свойство Location)
    //         agent.State = $"находится в {location}";
    //         events.Add(new AgentMovedEvent(agent.Id, location, currentTime));
    //     }
    //     return Task.CompletedTask;
    // }

    private Task HandleRest(Agent agent, Dictionary<string, object> parameters, DateTime currentTime, List<IDomainEvent> events)
    {
		// Add events handling
        agent.Energy = Math.Min(100, agent.Energy + 20);
        //events.Add(new AgentRestedEvent(agent.Id, currentTime));
        return Task.CompletedTask;
    }

    private Task HandleInteract(Agent agent, Dictionary<string, object> parameters, DateTime currentTime, List<IDomainEvent> events)
    {
        // Add events handling
        if (parameters.TryGetValue("targetAgentId", out var targetIdObj))
        {
            var targetId = Guid.Parse(targetIdObj.ToString());
            //events.Add(new AgentInteractionEvent(agent.Id, targetId, currentTime));
        }
        return Task.CompletedTask;
    }
}