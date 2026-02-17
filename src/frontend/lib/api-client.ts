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

import { existsSync } from "node:fs";

const runningInContainer = existsSync("/.dockerenv");
const configuredApiBaseUrl = process.env["EVENT_API_BASE_URL"]?.trim();
const fallbackApiBaseUrls = runningInContainer
  ? ["http://backend:8080", "http://host.docker.internal:8080", "http://localhost:8080"]
  : ["http://localhost:8080", "http://backend:8080"];
const API_BASE_URLS = Array.from(
  new Set(
    [configuredApiBaseUrl, ...fallbackApiBaseUrls]
      .filter((url): url is string => Boolean(url))
      .map((url) => url.replace(/\/+$/, ""))
  )
);
const DEFAULT_USER_ID = process.env["DEFAULT_USER_ID"] ?? "demo-user";

function isConnectionFailure(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  if (message.includes("fetch failed")) {
    return true;
  }

  const cause = (error as Error & { cause?: { code?: string } }).cause;
  if (!cause?.code) {
    return false;
  }

  return cause.code === "ECONNREFUSED" || cause.code === "ENOTFOUND" || cause.code === "EAI_AGAIN";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  for (let i = 0; i < API_BASE_URLS.length; i++) {
    const apiBaseUrl = API_BASE_URLS[i];
    const isLastCandidate = i === API_BASE_URLS.length - 1;

    try {
      const response = await fetch(`${apiBaseUrl}${path}`, {
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
    } catch (error) {
      if (!isLastCandidate && isConnectionFailure(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error(`Event API is unreachable. Tried: ${API_BASE_URLS.join(", ")}`);
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
