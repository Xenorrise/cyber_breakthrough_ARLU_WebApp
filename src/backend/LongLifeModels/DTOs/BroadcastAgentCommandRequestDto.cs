using System.ComponentModel.DataAnnotations;

namespace LongLifeModels.DTOs;

public sealed class BroadcastAgentCommandRequestDto : IValidatableObject
{
    [MaxLength(120)]
    public string? Command { get; init; }

    [MaxLength(5000)]
    public string? Message { get; init; }

    [MaxLength(120)]
    public string? CorrelationId { get; init; }

    public IReadOnlyCollection<Guid>? AgentIds { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Command) && string.IsNullOrWhiteSpace(Message))
        {
            yield return new ValidationResult(
                "Either command or message must be provided.",
                [nameof(Command), nameof(Message)]);
        }

        if (AgentIds is null)
        {
            yield break;
        }

        if (AgentIds.Count > 200)
        {
            yield return new ValidationResult(
                "AgentIds limit exceeded. Maximum 200 agent ids per request.",
                [nameof(AgentIds)]);
        }

        if (AgentIds.Any(id => id == Guid.Empty))
        {
            yield return new ValidationResult(
                "AgentIds must not contain empty GUID values.",
                [nameof(AgentIds)]);
        }
    }
}
