using LongLifeModels.Domain.Interfaces;
using LongLifeModels.Infrastructure.Context;

namespace LongLifeModels.Infrastructure.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AgentDbContext _dbContext;

        public UnitOfWork(AgentDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return await _dbContext.SaveChangesAsync(cancellationToken);
        }
        public async Task<bool> SaveEntitiesAsync(CancellationToken cancellationToken = default)
        {
            await SaveChangesAsync(cancellationToken);
            return true;
        }

        public void Dispose()
        {
            _dbContext.Dispose();
        }
    }
}