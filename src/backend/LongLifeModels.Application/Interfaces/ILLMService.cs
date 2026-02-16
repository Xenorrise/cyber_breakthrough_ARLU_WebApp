namespace LongLifeModels.Application.Interfaces;
public interface ILLMService
{
    Task<string> GenerateAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken = default);
}
