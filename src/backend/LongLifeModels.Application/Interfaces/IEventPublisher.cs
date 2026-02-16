namespace LongLifeModels.Application.Interfaces;
public interface IEventPublisher
{
    Task PublishEvent(string message);
}