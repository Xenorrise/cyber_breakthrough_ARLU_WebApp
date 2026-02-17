using LongLifeModels.Data;
using LongLifeModels.Infrastructure.LLM;
using LongLifeModels.Infrastructure.VectorStore;
using LongLifeModels.Options;
using LongLifeModels.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<OpenAIOptions>(builder.Configuration.GetSection(OpenAIOptions.SectionName));
builder.Services.Configure<QdrantOptions>(builder.Configuration.GetSection(QdrantOptions.SectionName));
builder.Services.Configure<MemoryCompressionOptions>(builder.Configuration.GetSection(MemoryCompressionOptions.SectionName));

builder.Services.AddDbContext<AgentDbContext>(options => options.UseInMemoryDatabase("agent-memory-db"));

builder.Services.AddHttpClient<ILLMService, OpenAIChatService>((sp, client) =>
{
    var openAi = sp.GetRequiredService<IOptions<OpenAIOptions>>().Value;
    client.BaseAddress = new Uri(openAi.BaseUrl);
    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    client.Timeout = TimeSpan.FromSeconds(60);
});

builder.Services.AddHttpClient<IEmbeddingService, OpenAIEmbeddingService>((sp, client) =>
{
    var openAi = sp.GetRequiredService<IOptions<OpenAIOptions>>().Value;
    client.BaseAddress = new Uri(openAi.BaseUrl);
    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    client.Timeout = TimeSpan.FromSeconds(60);
});

builder.Services.AddHttpClient<QdrantVectorStore>((sp, client) =>
{
    var qdrant = sp.GetRequiredService<IOptions<QdrantOptions>>().Value;
    client.BaseAddress = new Uri(qdrant.BaseUrl);
    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    if (!string.IsNullOrWhiteSpace(qdrant.ApiKey))
    {
        client.DefaultRequestHeaders.Add("api-key", qdrant.ApiKey);
    }
});

builder.Services.AddScoped<IVectorStore>(sp => sp.GetRequiredService<QdrantVectorStore>());
builder.Services.AddScoped<MemoryService>();
builder.Services.AddScoped<MemoryCompressor>();
builder.Services.AddScoped<AgentBrain>();
builder.Services.AddSingleton<IEventService, InMemoryEventService>();

builder.Services.AddHostedService<QdrantCollectionInitializer>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.MapControllers();

app.Run();
