import {
  AgentDto,
  AgentStatusDto,
  CommandAckDto,
  CommandAgentRequestDto,
  CreateAgentRequestDto,
  CreateEventRequestDto,
  EventDto,
  PagedResultDto,
  AgentMessageDto
} from "./types";

const API_BASE_URL = (process.env["EVENT_API_BASE_URL"] ?? "http://localhost:8080").replace(/\/+$/, "");
const DEFAULT_USER_ID = process.env["DEFAULT_USER_ID"] ?? "demo-user";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": DEFAULT_USER_ID,
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return (await response.json()) as T;
}

export const eventApi = {
  getEvents: () => request<EventDto[]>("/api/events"),
  createEvent: (body: CreateEventRequestDto) =>
    request<EventDto>("/api/events", {
      method: "POST",
      body: JSON.stringify(body)
    })
};

export const agentApi = {
  getAgents: () => request<AgentDto[]>("/api/user-agents"),
  getAgent: (agentId: string) => request<AgentDto>(`/api/user-agents/${agentId}`),
  getMessages: (agentId: string, limit = 50) =>
    request<PagedResultDto<AgentMessageDto>>(`/api/user-agents/${agentId}/messages?limit=${limit}`),
  createAgent: (body: CreateAgentRequestDto) =>
    request<AgentDto>("/api/user-agents", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  commandAgent: (agentId: string, body: CommandAgentRequestDto) =>
    request<CommandAckDto>(`/api/user-agents/${agentId}/commands`, {
      method: "POST",
      body: JSON.stringify(body)
    }),
  pauseAgent: (agentId: string) =>
    request<AgentStatusDto>(`/api/user-agents/${agentId}/pause`, {
      method: "POST",
      body: "{}"
    }),
  resumeAgent: (agentId: string) =>
    request<AgentStatusDto>(`/api/user-agents/${agentId}/resume`, {
      method: "POST",
      body: "{}"
    }),
  stopAgent: (agentId: string) =>
    request<AgentStatusDto>(`/api/user-agents/${agentId}/stop`, {
      method: "POST",
      body: "{}"
    })
};
