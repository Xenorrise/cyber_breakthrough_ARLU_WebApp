using LongLifeModels.Domain;
using System.ComponentModel.DataAnnotations;

namespace LongLifeModels.DTOs;

public sealed class CreateAgentRequestDto
{
    [Required]
    [MinLength(1)]
    [MaxLength(120)]
    public string Name { get; init; } = string.Empty;

    [MaxLength(120)]
    public string? Model { get; init; }

    [MaxLength(120)]
    public string? InitialState { get; init; }

    [Range(0f, 1f)]
    public float InitialEnergy { get; init; } = 0.8f;

    public PersonalityTraits PersonalityTraits { get; init; } = new();
}
