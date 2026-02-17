export interface EventDto {
  id: string;
  type: string;
  payload: unknown;
  createdAt: string;
}

export interface CreateEventRequestDto {
  type: string;
  payload: unknown;
}

export type AgentStatus = "Creating" | "Idle" | "Working" | "Paused" | "Stopped" | "Error";

export interface PersonalityTraitsDto {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface AgentDto {
  agentId: string;
  userId: string;
  name: string;
  model: string;
  status: AgentStatus;
  state: string;
  energy: number;
  threadId: string;
  createdAt: string;
  lastActiveAt: string;
  personalityTraits: PersonalityTraitsDto;
}

export interface AgentStatusDto {
  agentId: string;
  userId: string;
  status: AgentStatus;
  timestamp: string;
}

export interface AgentMessageDto {
  messageId: string;
  agentId: string;
  userId: string;
  threadId: string;
  role: string;
  content: string;
  createdAt: string;
  correlationId?: string;
}

export interface ErrorDto {
  code: string;
  message: string;
  correlationId?: string;
  agentId?: string;
  timestamp: string;
}

export interface PaginationDto {
  limit: number;
  returned: number;
}

export interface PagedResultDto<T> {
  items: T[];
  pagination: PaginationDto;
}

export interface CreateAgentRequestDto {
  name: string;
  model?: string;
  initialState?: string;
  initialEnergy?: number;
  personalityTraits?: PersonalityTraitsDto;
}

export interface CommandAgentRequestDto {
  command?: string;
  message?: string;
  correlationId?: string;
}

export interface CommandAckDto {
  agentId: string;
  userId: string;
  correlationId: string;
  status: AgentStatus;
  acceptedAt: string;
}

export interface RealtimeEnvelopeDto<TPayload> {
  type: string;
  timestamp: string;
  correlationId?: string;
  payload: TPayload;
}
