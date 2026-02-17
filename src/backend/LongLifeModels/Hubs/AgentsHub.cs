using LongLifeModels.DTOs;
using LongLifeModels.Services;
using Microsoft.AspNetCore.SignalR;
using System.ComponentModel.DataAnnotations;

namespace LongLifeModels.Hubs;

public sealed class AgentsHub(
    IUserContextService userContextService,
    IUserAgentsService userAgentsService,
    ILogger<AgentsHub> logger) : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = ResolveUserId();
        await Groups.AddToGroupAsync(Context.ConnectionId, AgentHubContracts.Groups.User(userId));
        logger.LogInformation("SignalR client {ConnectionId} connected for user {UserId}.", Context.ConnectionId, userId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = TryResolveUserId();
        if (!string.IsNullOrWhiteSpace(userId))
        {
            logger.LogInformation("SignalR client {ConnectionId} disconnected for user {UserId}.", Context.ConnectionId, userId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task<HubAckDto> SubscribeUser()
    {
        var userId = ResolveUserId();
        await Groups.AddToGroupAsync(Context.ConnectionId, AgentHubContracts.Groups.User(userId));
        return new HubAckDto { Ok = true, Message = "Subscribed to user group." };
    }

    public Task<HubAckDto> SubscribeAgents()
        => SubscribeUser();

    public async Task<HubAckDto> SubscribeAgent(Guid agentId)
    {
        var userId = ResolveUserId();
        var agent = await userAgentsService.GetAgentAsync(userId, agentId, Context.ConnectionAborted);
        if (agent is null)
        {
            throw new HubException($"Agent '{agentId}' not found.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, AgentHubContracts.Groups.Agent(agentId));
        return new HubAckDto { Ok = true, Message = "Subscribed to agent group." };
    }

    public async Task<HubAckDto> UnsubscribeAgent(Guid agentId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, AgentHubContracts.Groups.Agent(agentId));
        return new HubAckDto { Ok = true, Message = "Unsubscribed from agent group." };
    }

    public async Task<AgentDto> CreateAgent(CreateAgentRequestDto dto)
    {
        try
        {
            Validate(dto);
            var userId = ResolveUserId();
            return await userAgentsService.CreateAgentAsync(userId, dto, Context.ConnectionAborted);
        }
        catch (Exception ex) when (ex is InvalidOperationException or KeyNotFoundException)
        {
            throw new HubException(ex.Message);
        }
    }

    public async Task<CommandAckDto> CommandAgent(Guid agentId, CommandAgentRequestDto dto)
    {
        try
        {
            Validate(dto);
            var userId = ResolveUserId();
            return await userAgentsService.CommandAgentAsync(userId, agentId, dto, Context.ConnectionAborted);
        }
        catch (Exception ex) when (ex is InvalidOperationException or KeyNotFoundException)
        {
            throw new HubException(ex.Message);
        }
    }

    public Task<CommandAckDto> SendMessage(Guid agentId, CommandAgentRequestDto dto)
        => CommandAgent(agentId, dto);

    public async Task<AgentStatusDto> StopAgent(Guid agentId)
    {
        try
        {
            var userId = ResolveUserId();
            return await userAgentsService.StopAgentAsync(userId, agentId, Context.ConnectionAborted);
        }
        catch (Exception ex) when (ex is InvalidOperationException or KeyNotFoundException)
        {
            throw new HubException(ex.Message);
        }
    }

    public async Task<AgentStatusDto> PauseAgent(Guid agentId)
    {
        try
        {
            var userId = ResolveUserId();
            return await userAgentsService.PauseAgentAsync(userId, agentId, Context.ConnectionAborted);
        }
        catch (Exception ex) when (ex is InvalidOperationException or KeyNotFoundException)
        {
            throw new HubException(ex.Message);
        }
    }

    public async Task<AgentStatusDto> ResumeAgent(Guid agentId)
    {
        try
        {
            var userId = ResolveUserId();
            return await userAgentsService.ResumeAgentAsync(userId, agentId, Context.ConnectionAborted);
        }
        catch (Exception ex) when (ex is InvalidOperationException or KeyNotFoundException)
        {
            throw new HubException(ex.Message);
        }
    }

    private string ResolveUserId()
    {
        try
        {
            var headers = Context.GetHttpContext()?.Request.Headers;
            if (headers is null)
            {
                throw new HubException("Connection headers are not available.");
            }

            return userContextService.GetRequiredUserId(Context.User, headers);
        }
        catch (UnauthorizedAccessException ex)
        {
            throw new HubException(ex.Message);
        }
    }

    private string? TryResolveUserId()
    {
        var headers = Context.GetHttpContext()?.Request.Headers;
        if (headers is null)
        {
            return null;
        }

        try
        {
            return userContextService.GetRequiredUserId(Context.User, headers);
        }
        catch
        {
            return null;
        }
    }

    private static void Validate<T>(T dto)
    {
        var context = new ValidationContext(dto!);
        var errors = new List<ValidationResult>();
        if (Validator.TryValidateObject(dto!, context, errors, validateAllProperties: true))
        {
            return;
        }

        var message = string.Join(" ", errors.Select(x => x.ErrorMessage));
        throw new HubException(string.IsNullOrWhiteSpace(message) ? "Validation failed." : message);
    }
}
