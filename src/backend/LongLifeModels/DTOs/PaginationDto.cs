namespace LongLifeModels.DTOs;

public sealed class PaginationDto
{
    public required int Limit { get; init; }
    public required int Returned { get; init; }
}
