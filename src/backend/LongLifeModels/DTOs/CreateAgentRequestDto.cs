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

    [MaxLength(400)]
    public string? InitialState { get; init; }

    [MaxLength(1000)]
    public string? Description { get; init; }

    [MaxLength(80)]
    public string? InitialEmotion { get; init; }

    [MaxLength(500)]
    public string? TraitSummary { get; init; }

    [Range(0f, 1f)]
    public float InitialEnergy { get; init; } = 0.8f;

    public PersonalityTraits PersonalityTraits { get; init; } = new();
}
