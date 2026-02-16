using LongLifeModels.Domain.Entities;

public enum PromptStage
{
    Reflection,
    Goal,
    Action
}

public interface IPromptBuilder
{
    Task<Prompt> BuildAsync(
        Agent agent,
        DateTime currentTime,
        PromptStage stage,
        string worldContext,
        string? reflection = null,
        string? goal = null,
        CancellationToken cancellationToken = default);
}

public record Prompt(string SystemMessage, string UserMessage);