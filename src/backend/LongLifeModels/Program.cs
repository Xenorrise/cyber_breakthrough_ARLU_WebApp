using LongLifeModels.Data;
using LongLifeModels.Hubs;
using LongLifeModels.Infrastructure.LLM;
using LongLifeModels.Infrastructure.VectorStore;
using LongLifeModels.Options;
using LongLifeModels.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Http.Headers;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<OpenAIOptions>(builder.Configuration.GetSection(OpenAIOptions.SectionName));
builder.Services.Configure<QdrantOptions>(builder.Configuration.GetSection(QdrantOptions.SectionName));
builder.Services.Configure<MemoryCompressionOptions>(builder.Configuration.GetSection(MemoryCompressionOptions.SectionName));
builder.Services.Configure<TickProcessorOptions>(builder.Configuration.GetSection(TickProcessorOptions.SectionName));

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
    var logger = sp.GetRequiredService<ILoggerFactory>().CreateLogger("QdrantConfig");
    var qdrantBaseUrl = ResolveQdrantBaseUrl(qdrant.BaseUrl);
    if (!string.Equals(qdrantBaseUrl, qdrant.BaseUrl, StringComparison.Ordinal))
    {
        logger.LogWarning("Qdrant BaseUrl '{OriginalBaseUrl}' is not reachable from container. Using '{ResolvedBaseUrl}' instead.", qdrant.BaseUrl, qdrantBaseUrl);
    }

    client.BaseAddress = new Uri(qdrantBaseUrl);
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
builder.Services.AddScoped<IUserAgentsService, UserAgentsService>();
builder.Services.AddScoped<IWorldInsightsService, WorldInsightsService>();
builder.Services.AddScoped<ITickProcessor, TickProcessor>();
builder.Services.AddSingleton<IEventService, InMemoryEventService>();
builder.Services.AddSingleton<IAgentCommandQueue, InMemoryAgentCommandQueue>();
builder.Services.AddSingleton<IUserContextService, UserContextService>();
builder.Services.AddSingleton<IAgentRealtimeNotifier, SignalRAgentRealtimeNotifier>();

builder.Services.AddHostedService<QdrantCollectionInitializer>();
builder.Services.AddHostedService<AgentCommandWorker>();

builder.Services.AddControllers();
builder.Services.AddSignalR();
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:3000"];
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "FrontendCors",
        policy =>
        {
            policy
                .WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("FrontendCors");
app.MapControllers();
app.MapHub<AgentsHub>(AgentHubContracts.HubPath);

app.Run();

static string ResolveQdrantBaseUrl(string configuredBaseUrl)
{
    if (string.IsNullOrWhiteSpace(configuredBaseUrl))
    {
        return configuredBaseUrl;
    }

    var runningInContainer = string.Equals(
        Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER"),
        "true",
        StringComparison.OrdinalIgnoreCase);

    if (!runningInContainer)
    {
        return configuredBaseUrl;
    }

    if (!Uri.TryCreate(configuredBaseUrl, UriKind.Absolute, out var uri))
    {
        return configuredBaseUrl;
    }

    static string BuildWithHost(Uri source, string host, int? forcePort = null)
    {
        var builder = new UriBuilder(source)
        {
            Host = host,
            Port = forcePort ?? (source.IsDefaultPort ? -1 : source.Port)
        };

        return builder.Uri.ToString().TrimEnd('/');
    }

    var isLocalhost = string.Equals(uri.Host, "localhost", StringComparison.OrdinalIgnoreCase)
        || string.Equals(uri.Host, "127.0.0.1", StringComparison.OrdinalIgnoreCase);

    if (!isLocalhost)
    {
        var isHostGateway = string.Equals(uri.Host, "host.docker.internal", StringComparison.OrdinalIgnoreCase);
        if (isHostGateway && CanResolveHost("qdrant"))
        {
            return BuildWithHost(uri, "qdrant", 6333);
        }

        var isQdrantAlias = string.Equals(uri.Host, "qdrant", StringComparison.OrdinalIgnoreCase);
        if (isQdrantAlias)
        {
            return configuredBaseUrl;
        }

        if (CanResolveHost(uri.Host))
        {
            return configuredBaseUrl;
        }

        return BuildWithHost(uri, "host.docker.internal", uri.IsDefaultPort ? 6333 : uri.Port);
    }

    return BuildWithHost(uri, "qdrant", 6333);
}

static bool CanResolveHost(string host)
{
    try
    {
        _ = Dns.GetHostAddresses(host);
        return true;
    }
    catch
    {
        return false;
    }
}
