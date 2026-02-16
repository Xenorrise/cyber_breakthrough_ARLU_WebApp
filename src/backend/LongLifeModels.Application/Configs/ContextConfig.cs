namespace LongLifeModels.Application.Configs;
public class ContextConfig
{
    public int RecentMemoriesLimit { get; set; } = 10;
    public int MinMemoryImportance { get; set; } = 0;
}