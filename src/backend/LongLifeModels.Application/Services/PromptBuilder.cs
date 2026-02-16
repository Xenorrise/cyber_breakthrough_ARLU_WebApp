using LongLifeModels.Application.Configs;
using LongLifeModels.Application.Interfaces;
using LongLifeModels.Domain.Entities;
using LongLifeModels.Domain.Interfaces;
using Microsoft.Extensions.Options;

namespace LongLifeModels.Application.Services;
public class PromptBuilder : IPromptBuilder
{
    private readonly IAgentContextProvider _contextProvider;
    private readonly ITemplateRenderer _templateRenderer;
    private readonly IOptions<PromptConfig> _config;

    public PromptBuilder(
        IAgentContextProvider contextProvider,
        ITemplateRenderer templateRenderer,
        IOptions<PromptConfig> config)
    {
        _contextProvider = contextProvider;
        _templateRenderer = templateRenderer;
        _config = config;
    }

    public async Task<Prompt> BuildAsync(
        Agent agent,
        DateTime currentTime,
        PromptStage stage,
        string worldContext,
        string reflection = null,
        string goal = null,
        CancellationToken cancellationToken = default)
    {
        var context = await _contextProvider.GetContextAsync(agent, currentTime, cancellationToken);

        var model = new AgentPrompt
        {
            AgentName = agent.Name,
            Personality = agent.Personality,
            Energy = agent.Energy,
            State = agent.State,
            CurrentTime = GetTimeOfDay(currentTime),
            RecentMemories = context.RecentMemories,
            Relationships = context.Relationships,
            RecentInteractions = context.RecentInteractions,
            WorldContext = worldContext,
            Reflection = reflection,
            Goal = goal
        };

        var systemMessage = await _templateRenderer.RenderAsync(_config.Value.SystemTemplate, model, cancellationToken);

        string userTemplate = stage switch
        {
            PromptStage.Reflection => _config.Value.ReflectionTemplate,
            PromptStage.Goal => _config.Value.GoalTemplate,
            PromptStage.Action => _config.Value.ActionTemplate,
            _ => throw new ArgumentOutOfRangeException(nameof(stage))
        };

        var userMessage = await _templateRenderer.RenderAsync(userTemplate, model, cancellationToken);

        return new Prompt(systemMessage, userMessage);
    }

    private string GetTimeOfDay(DateTime time)
    {
        var hour = time.Hour;
        if (hour < 6) return "ночь";
        if (hour < 12) return "утро";
        if (hour < 18) return "день";
        return "вечер";
    }
}