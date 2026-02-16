namespace LongLifeModels.Domain.Entities;

public class Agent
{
	public Guid Id { get; private set; }
	public string Name { get; private set; } = string.Empty;
	public string Status { get; set; } = string.Empty;
	public string State { get; set; } = string.Empty;
	public  PersonalityTraits? Personality { get; private set; }

	public DateTime LastActionTime { get; set; }

	public int Energy { get; set; }
}
