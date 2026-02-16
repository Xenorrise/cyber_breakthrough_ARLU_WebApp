using System.Text.Json;
using System.Text.Json.Serialization;
using LongLifeModels.Application.Configs;
using LongLifeModels.Application.Interfaces;
using LongLifeModels.Domain.Entities;
using LongLifeModels.Domain.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LongLifeModels.Application.Services;

public class TickProcessor : ITickProcessor
{
    private readonly IAgentRepository _agentRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAgentBrain _brain;
    private readonly IActionExecutor _actionExecutor;
    private readonly IEventPublisher _eventPublisher;
    //private readonly ITelemetry _telemetry;
    private readonly ILogger<TickProcessor> _logger;
    private readonly TickProcessorConfig _config;

    public TickProcessor(
        IAgentRepository agentRepository,
        IUnitOfWork unitOfWork,
        IAgentBrain brain,
        IActionExecutor actionExecutor,
        IEventPublisher eventPublisher,
        //ITelemetry telemetry,
        ILogger<TickProcessor> logger,
        IOptions<TickProcessorConfig> config)
    {
        _agentRepository = agentRepository;
        _unitOfWork = unitOfWork;
        _brain = brain;
        _actionExecutor = actionExecutor;
        _eventPublisher = eventPublisher;
        //_telemetry = telemetry;
        _logger = logger;
        _config = config.Value;
    }

    public async Task ProcessTickAsync(DateTime currentTickTime, CancellationToken cancellationToken)
    {
        //using var _ = _telemetry.BeginTick(); // метрики

        var agents = await _agentRepository.GetAgentsReadyForTickAsync(currentTickTime, _config.MaxAgentsPerTick, cancellationToken);
        //_telemetry.RecordAgentsLoaded(agents.Count);

        if (!agents.Any())
        {
            _logger.LogDebug("No agents ready this tick.");
            return;
        }

        using var semaphore = new SemaphoreSlim(_config.MaxParallelism);
        var tasks = agents.Select(async agent =>
        {
            await semaphore.WaitAsync(cancellationToken);
            try
            {
                return await ProcessAgentAsync(agent, currentTickTime, cancellationToken);
            }
            finally
            {
                semaphore.Release();
            }
        });

        var results = await Task.WhenAll(tasks);

        // 3. Собираем все события и изменённых агентов
        var allEvents = results.SelectMany(r => r.Events).ToList();
        // Агенты уже обновлены в памяти, UnitOfWork их отслеживает

        // 4. Сохраняем изменения в БД одной транзакцией
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 5. Публикуем события после успешного сохранения
        foreach (var evt in allEvents)
        {
            //await _eventPublisher.PublishAsync(evt, cancellationToken);
        }

        //_telemetry.RecordTickCompleted(agents.Count, allEvents.Count);
    }

    private async Task<AgentProcessingResult> ProcessAgentAsync(
        Agent agent,
        DateTime currentTickTime,
        CancellationToken cancellationToken)
    {
        try
        {
            string worldContext = BuildWorldContext(agent, currentTickTime);
            var brainResult = await _brain.ThinkAsync(agent.Id, worldContext, currentTickTime, cancellationToken);

            var decision = ParseActionToDecision(brainResult.Action);

            var (updatedAgent, events) = await _actionExecutor.ExecuteAsync(
                agent, decision, currentTickTime, cancellationToken);

            // if (decision.Cooldown.HasValue)
            // {
            //     updatedAgent.UpdateNextActionTime(currentTickTime, TimeSpan.FromSeconds(decision.Cooldown.Value));
            // }

            return new AgentProcessingResult(updatedAgent, events);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing agent {AgentId}", agent.Id);
            //agent.MarkAsFailed(currentTickTime);
            return new AgentProcessingResult(agent, Array.Empty<IDomainEvent>());
        }
    }
    private string BuildWorldContext(Agent agent, DateTime currentTime)
    {
        var context = $"Время: {currentTime:yyyy-MM-dd HH:mm:ss}. Состояние агента: {agent.State}.";
        if (context.Length > _config.WorldContextMaxLength)
            context = context[.._config.WorldContextMaxLength];
        return context;
    }
    private AgentDecision ParseActionToDecision(string actionJson)
    {
        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            Converters = { new JsonStringEnumConverter() }
        };

        // Ожидаемая структура: { "action": "...", "parameters": { ... }, "cooldown": 30, "thought": "..." }
        var decision = JsonSerializer.Deserialize<AgentDecision>(actionJson, options);
        if (decision == null || string.IsNullOrWhiteSpace(decision.Action))
            throw new InvalidOperationException("Failed to parse agent decision from JSON.");

        return decision;
    }

    private record AgentProcessingResult(Agent UpdatedAgent, IReadOnlyCollection<IDomainEvent> Events);
}