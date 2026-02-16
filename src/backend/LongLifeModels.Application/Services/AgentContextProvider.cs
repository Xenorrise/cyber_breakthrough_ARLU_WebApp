using LongLifeModels.Application.Configs;
using LongLifeModels.Domain.Entities;
using LongLifeModels.Domain.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LongLifeModels.Application.Services;
public class AgentContextProvider : IAgentContextProvider
{
    private readonly IMemoryLogRepository _memoryLogRepo;
    private readonly IRelationshipRepository _relationshipRepo;
    private readonly IInteractionRepository _interactionRepo;
    private readonly IAgentRepository _agentRepo;
    private readonly IOptions<ContextConfig> _config;
    private readonly ILogger<AgentContextProvider> _logger;

    public AgentContextProvider(
        IMemoryLogRepository memoryLogRepo,
        IRelationshipRepository relationshipRepo,
        IInteractionRepository interactionRepo,
        IAgentRepository agentRepo,
        IOptions<ContextConfig> config,
        ILogger<AgentContextProvider> logger)
    {
        _memoryLogRepo = memoryLogRepo;
        _relationshipRepo = relationshipRepo;
        _interactionRepo = interactionRepo;
        _agentRepo = agentRepo;
        _config = config;
        _logger = logger;
    }

    public async Task<AgentContext> GetContextAsync(Agent agent, DateTime currentTime, CancellationToken cancellationToken)
    {
        try
        {
            // Загружаем воспоминания
            var memories = await _memoryLogRepo.GetRecentAsync(
                agent.Id,
                _config.Value.RecentMemoriesLimit,
                _config.Value.MinMemoryImportance,
                cancellationToken);

            // Загружаем отношения
            var relationships = await _relationshipRepo.GetForAgentAsync(agent.Id, cancellationToken);

            // Загружаем последние взаимодействия (например, последние 10)
            var interactions = await _interactionRepo.GetRecentForAgentAsync(agent.Id, limit: 10, cancellationToken);

            // Собираем все ID других агентов из всех трёх источников
            var relatedAgentIds = memories
                .Where(m => m.RelatedAgentId.HasValue)
                .Select(m => m.RelatedAgentId.Value)
                .Concat(relationships.Select(r => r.AgentBId))
                .Concat(interactions.SelectMany(i => new[] { i.InitiatorAgentId, i.TargetAgentId }))
                .Where(id => id != agent.Id) // исключаем самого агента
                .Select(id => id)
                .Distinct()
                .ToList();

            // Загружаем имена агентов
            Dictionary<Guid, string> agentNames = new();
            if (relatedAgentIds.Any())
            {
                var agents = await _agentRepo.GetByIdsAsync(relatedAgentIds, cancellationToken);
                agentNames = agents.ToDictionary(a => a.Id, a => a.Name);
            }

            // Формируем MemoryEntry
            var memoryEntries = memories.Select(m => new MemoryEntry(
                Description: m.Description,
                Importance: m.Importance,
                RelatedAgentName: m.RelatedAgentId.HasValue ? agentNames.GetValueOrDefault(m.RelatedAgentId.Value) : null
            )).ToList();

            // Формируем RelationshipInfo
            var relationshipInfos = relationships.Select(r => new RelationshipInfo(
                OtherAgentName: agentNames.GetValueOrDefault(r.AgentBId) ?? "Неизвестный",
                Score: r.Score,
                LastInteractionTime: r.LastInteractionTime.ToString("g")
            )).ToList();

            // Формируем InteractionInfo
            var interactionInfos = interactions.Select(i =>
            {
                var otherId = i.InitiatorAgentId == agent.Id ? i.TargetAgentId : i.InitiatorAgentId;
                string otherName = agentNames.GetValueOrDefault(otherId);
                return new InteractionInfo(
                    OtherAgentName: otherName,
                    Description: i.Description,
                    Timestamp: i.Date
                );
            }).ToList();

            return new AgentContext(memoryEntries, relationshipInfos, interactionInfos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при получении контекста для агента {AgentId}", agent.Id);
            return new AgentContext(Array.Empty<MemoryEntry>(), Array.Empty<RelationshipInfo>(), Array.Empty<InteractionInfo>());
        }
    }
}