using LongLifeModels.Infrastructure.VectorStore;

namespace LongLifeModels.Services;

public sealed class QdrantCollectionInitializer(IServiceProvider services, ILogger<QdrantCollectionInitializer> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = services.CreateScope();
        var vectorStore = scope.ServiceProvider.GetRequiredService<QdrantVectorStore>();

        try
        {
            await vectorStore.EnsureCollectionExistsAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to initialize Qdrant collection.");
            throw;
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
