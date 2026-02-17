using LongLifeModels.Infrastructure.VectorStore;

namespace LongLifeModels.Services;

public sealed class QdrantCollectionInitializer(IServiceProvider services, ILogger<QdrantCollectionInitializer> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = services.CreateScope();
            var vectorStore = scope.ServiceProvider.GetRequiredService<QdrantVectorStore>();
            await vectorStore.EnsureCollectionExistsAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Qdrant is unavailable at startup. Continuing without vector store initialization.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
