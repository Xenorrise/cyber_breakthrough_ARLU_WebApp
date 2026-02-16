using LongLifeModels.Application.Configs;
using LongLifeModels.Application.Interfaces;
using LongLifeModels.Application.Services;
using LongLifeModels.Domain.Interfaces;
using LongLifeModels.Infrastructure.Context;
using LongLifeModels.Infrastructure.Repositories;
using OpenAI;

var builder = WebApplication.CreateBuilder(args);
var services = builder.Services;
var configuration = builder.Configuration;

string apiKey = configuration["OpenAI:ApiKey"];
services.Configure<SimulationConfig>(configuration.GetSection("Simulation"));
services.Configure<TickProcessorConfig>(configuration.GetSection("TickProcessor"));
services.Configure<PromptConfig>(configuration.GetSection("Prompt"));
services.Configure<ContextConfig>(configuration.GetSection("Context"));

services.AddSingleton(new OpenAIClient(apiKey));
services.AddSingleton(TimeProvider.System);

services.AddOpenApi();

services.AddHostedService<AgentScheduler>();

services.AddScoped<ITickProcessor, TickProcessor>();
services.AddScoped<IPromptBuilder, PromptBuilder>();
services.AddScoped<IAgentContextProvider, AgentContextProvider>();
services.AddSingleton<ITemplateRenderer, FluidTemplateRenderer>();
services.AddScoped<IUnitOfWork, UnitOfWork>();
services.AddScoped<AgentDbContext>(); 
services.AddScoped<ITickProcessor, TickProcessor>();
//services.AddScoped<IActionExecutor, ActionExecutor>();
services.AddScoped<IAgentBrain, AgentBrain>();
// services.AddScoped<IMemoryLogRepository, MemoryLogRepository>();
// services.AddScoped<IRelationshipRepository, RelationshipRepository>();
// services.AddScoped<IInteractionRepository, InteractionRepository>();
// services.AddScoped<IAgentRepository, AgentRepository>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

//app.UseHttpsRedirection();

app.Run();

