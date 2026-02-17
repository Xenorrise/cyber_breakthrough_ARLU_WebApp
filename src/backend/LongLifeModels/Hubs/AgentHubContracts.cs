namespace LongLifeModels.Hubs;

public static class AgentHubContracts
{
    public const string HubPath = "/hubs/agents";

    public static class Events
    {
        public const string EventsUpdated = "events.updated";
        public const string AgentsListUpdated = "agents.list.updated";
        public const string AgentStatusChanged = "agent.status.changed";
        public const string AgentMessage = "agent.message";
        public const string AgentThought = "agent.thought";
        public const string AgentError = "agent.error";
        public const string AgentProgress = "agent.progress";
    }

    public static class Groups
    {
        public static string User(string userId) => $"user:{userId}";
        public static string Agent(Guid agentId) => $"agent:{agentId}";
    }
}
