using System.ComponentModel.DataAnnotations;

namespace LongLifeModels.DTOs;

public sealed class CommandAgentRequestDto : IValidatableObject
{
    [MaxLength(120)]
    public string? Command { get; init; }

    [MaxLength(5000)]
    public string? Message { get; init; }

    [MaxLength(120)]
    public string? CorrelationId { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Command) && string.IsNullOrWhiteSpace(Message))
        {
            yield return new ValidationResult(
                "Either command or message must be provided.",
                [nameof(Command), nameof(Message)]);
        }
    }
}
