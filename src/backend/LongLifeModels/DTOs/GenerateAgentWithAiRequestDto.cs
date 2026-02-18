using System.ComponentModel.DataAnnotations;

namespace LongLifeModels.DTOs;

public sealed class GenerateAgentWithAiRequestDto
{
    [Required]
    [MinLength(5)]
    [MaxLength(2000)]
    public string Prompt { get; init; } = string.Empty;

    [MaxLength(120)]
    public string? Model { get; init; }
}
