namespace LongLifeModels.Domain.Entities;

public class AgentPrompt
{
    public string AgentName { get; set; } = string.Empty;
    public PersonalityTraits? Personality { get; set; }
    public int Energy { get; set; }
    public string State { get; set; } = string.Empty;
    public string CurrentTime { get; set; } = string.Empty;
    public required IReadOnlyList<MemoryEntry> RecentMemories { get; set; }
    public required IReadOnlyList<RelationshipInfo> Relationships { get; set; }
    public required IReadOnlyList<InteractionInfo> RecentInteractions { get; set; }
    public string WorldContext { get; set; } = string.Empty;
    public string Reflection { get; set; } = string.Empty;        
    public string Goal { get; set; } = string.Empty;           
}
public record InteractionInfo(string OtherAgentName, string Description, DateTime Timestamp);
public record MemoryEntry(string Description, int Importance, string RelatedAgentName); // importance 1~10
public record RelationshipInfo(string OtherAgentName, float Score, string LastInteractionTime);