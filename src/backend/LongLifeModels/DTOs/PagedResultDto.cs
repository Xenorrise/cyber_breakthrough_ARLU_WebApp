namespace LongLifeModels.DTOs;

public sealed class PagedResultDto<T>
{
    public required IReadOnlyCollection<T> Items { get; init; }
    public required PaginationDto Pagination { get; init; }
}
