namespace LongLifeModels.Application.Interfaces;
public interface ITickProcessor
{
    Task ProcessTickAsync(DateTime currentTickTime, CancellationToken ct);
}