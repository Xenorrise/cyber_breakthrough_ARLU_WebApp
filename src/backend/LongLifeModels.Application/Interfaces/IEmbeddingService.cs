namespace LongLifeModels.Application.Interfaces;
public interface IEmbeddingService
{
    Task<IReadOnlyList<float>> EmbedAsync(string text, CancellationToken cancellationToken = default);
}
