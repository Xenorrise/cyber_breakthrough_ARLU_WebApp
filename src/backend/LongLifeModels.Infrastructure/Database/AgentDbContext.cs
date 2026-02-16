using LongLifeModels.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Text.Json;

namespace LongLifeModels.Infrastructure.Context;

// Файл: EF Core контекст доменной модели.
public sealed class AgentDbContext(DbContextOptions<AgentDbContext> options) : DbContext(options)
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    public DbSet<Agent> Agents => Set<Agent>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Interaction> Interactions => Set<Interaction>();
    public DbSet<Relationship> Relationships => Set<Relationship>();
    public DbSet<MemoryLog> MemoryLogs => Set<MemoryLog>();

    // Конфигурирует таблицы и индексы сущностей.
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var personalityConverter = new ValueConverter<PersonalityTraits?, string>(
            traits => JsonSerializer.Serialize(traits, SerializerOptions),
            payload => JsonSerializer.Deserialize<PersonalityTraits>(payload, SerializerOptions) ?? new PersonalityTraits());

        modelBuilder.Entity<Agent>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(80).IsRequired();
            entity.Property(x => x.State).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Personality)
                .HasConversion(personalityConverter);
        });

        modelBuilder.Entity<Conversation>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Topic).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Content).IsRequired();
            entity.HasIndex(x => new { x.InitiatorAgentId, x.TargetAgentId });
        });

        modelBuilder.Entity<Interaction>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Description).HasMaxLength(2000).IsRequired();
            entity.Property(x => x.Date).IsRequired();
            entity.HasIndex(x => new { x.InitiatorAgentId, x.TargetAgentId });
        });

        modelBuilder.Entity<Relationship>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.AgentAId, x.AgentBId }).IsUnique();
            entity.Property(x => x.Score);
        });

        modelBuilder.Entity<MemoryLog>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Description).HasMaxLength(4000).IsRequired();
            entity.HasIndex(x => x.AgentId);
            entity.HasIndex(x => x.Timestamp);
        });
    }
}
