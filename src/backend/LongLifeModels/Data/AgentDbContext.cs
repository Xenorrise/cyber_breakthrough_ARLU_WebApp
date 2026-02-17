using LongLifeModels.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Text.Json;

namespace LongLifeModels.Data;

// Файл: EF Core контекст доменной модели.
public sealed class AgentDbContext(DbContextOptions<AgentDbContext> options) : DbContext(options)
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    public DbSet<Agent> Agents => Set<Agent>();
    public DbSet<AgentMessage> AgentMessages => Set<AgentMessage>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Interaction> Interactions => Set<Interaction>();
    public DbSet<Relationship> Relationships => Set<Relationship>();
    public DbSet<MemoryLog> MemoryLogs => Set<MemoryLog>();

    // Конфигурирует таблицы и индексы сущностей.
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var personalityConverter = new ValueConverter<PersonalityTraits, string>(
            traits => JsonSerializer.Serialize(traits, SerializerOptions),
            payload => JsonSerializer.Deserialize<PersonalityTraits>(payload, SerializerOptions) ?? new PersonalityTraits());

        modelBuilder.Entity<Agent>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.UserId).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Model).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(80).IsRequired();
            entity.Property(x => x.State).HasMaxLength(400).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(1000).IsRequired();
            entity.Property(x => x.CurrentEmotion).HasMaxLength(80).IsRequired();
            entity.Property(x => x.TraitSummary).HasMaxLength(500).IsRequired();
            entity.Property(x => x.CreatedAt).IsRequired();
            entity.Property(x => x.LastActiveAt).IsRequired();
            entity.Property(x => x.ThreadId).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.IsArchived });
            entity.HasIndex(x => new { x.UserId, x.LastActiveAt });
            entity.Property(x => x.PersonalityTraits)
                .HasConversion(personalityConverter);
        });

        modelBuilder.Entity<AgentMessage>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.UserId).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Role).HasMaxLength(40).IsRequired();
            entity.Property(x => x.Content).HasMaxLength(8000).IsRequired();
            entity.Property(x => x.CorrelationId).HasMaxLength(120);
            entity.Property(x => x.CreatedAt).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.AgentId, x.CreatedAt });
            entity.HasIndex(x => x.ThreadId);
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
