import { CreateEventRequestDto, EventDto } from "./types";

const API_BASE_URL = process.env.EVENT_API_BASE_URL ?? "http://localhost:5000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
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
