using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace LongLifeModels.DTOs;

public sealed class CreateEventRequestDto : IValidatableObject
{
    [Required]
    [MinLength(1)]
    [MaxLength(100)]
    public string Type { get; init; } = string.Empty;

    [Required]
    public JsonElement Payload { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Payload.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
        {
            yield return new ValidationResult(
                "Payload must contain valid JSON.",
                [nameof(Payload)]);
        }
    }
}
