using LongLifeModels.Application.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace LongLifeModels.Application.Services;
public class EventHub : Hub { }
public class SignalREventPublisher : IEventPublisher
{
    private readonly IHubContext<EventHub> _hubContext;

    public SignalREventPublisher(IHubContext<EventHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task PublishEvent(string message)
    {
        await _hubContext.Clients.All.SendAsync("ReceiveEvent", message);
    }
}