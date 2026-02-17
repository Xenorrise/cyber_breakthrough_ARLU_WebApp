using System.ComponentModel.DataAnnotations;

namespace LongLifeModels.DTOs;

public sealed class WorldTimeDto
{
    public required DateTimeOffset GameTime { get; init; }
    public required float Speed { get; init; }
}

public sealed class UpdateWorldTimeSpeedRequestDto
{
    [Range(0f, 20f)]
    public float Speed { get; init; }
}

public sealed class AdvanceWorldTimeRequestDto
{
    [Range(1, 60 * 24 * 30)]
    public int Minutes { get; init; } = 60;
}
