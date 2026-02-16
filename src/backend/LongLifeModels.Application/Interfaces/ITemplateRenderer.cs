namespace LongLifeModels.Application.Interfaces;
public interface ITemplateRenderer
{
    Task<string> RenderAsync(string template, object model, CancellationToken ct);
}