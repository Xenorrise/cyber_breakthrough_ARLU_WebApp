using System.Collections.Concurrent;
using System.Globalization;
using Fluid;
using LongLifeModels.Application.Interfaces;

namespace LongLifeModels.Application.Services;
public class FluidTemplateRenderer : ITemplateRenderer
{
    private readonly ConcurrentDictionary<string, IFluidTemplate> _cache = new();

    public async Task<string> RenderAsync(string template, object model, CancellationToken ct)
    {
        if (!_cache.TryGetValue(template, out var parsedTemplate))
        {
			var parser = new FluidParser();
            if (!parser.TryParse(template, out parsedTemplate, out var error))
                throw new InvalidOperationException($"Invalid template: {error}");
            _cache[template] = parsedTemplate;
        }

        var context = new TemplateContext(model, new TemplateOptions { CultureInfo = CultureInfo.InvariantCulture });
        return await parsedTemplate.RenderAsync(context);
    }
}