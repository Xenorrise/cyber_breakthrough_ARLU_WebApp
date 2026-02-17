# User Agents + SignalR Spec

## 1. SignalR connection

- Hub URL: `/hubs/agents`
- Full local URL examples:
  - `http://localhost:5133/hubs/agents` (`dotnet run`)
  - `http://localhost:8080/hubs/agents` (docker backend)
- User identity source:
  - primary: authenticated claim `nameidentifier` / `sub` / `userId`
  - fallback (development): header `X-User-Id`

### Frontend connection example

```ts
import * as signalR from "@microsoft/signalr";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";
const userId = "demo-user";

const connection = new signalR.HubConnectionBuilder()
  .withUrl(`${baseUrl}/hubs/agents`, {
    headers: { "X-User-Id": userId },
    withCredentials: true
  })
  .withAutomaticReconnect()
  .build();

await connection.start();
await connection.invoke("SubscribeUser");
```

## 2. Realtime events

All events are sent as envelope:

```json
{
  "type": "agent.status.changed",
  "timestamp": "2026-02-17T10:30:22.113Z",
  "correlationId": "a58e2f376fcd45f8b8b6e7f0f2f0f0b6",
  "payload": {}
}
```

### `agents.list.updated`

Payload type: `AgentsListUpdatedDto`

```json
{
  "userId": "demo-user",
  "agents": [
    {
      "agentId": "af2b0f86-2f0a-4f0a-9df8-5134a5005d7e",
      "userId": "demo-user",
      "name": "Researcher",
      "model": "gpt-4o-mini",
      "status": "Idle",
      "state": "Ready",
      "energy": 0.8,
      "threadId": "2f67653d-c6cf-4333-88a6-f9f6809a9390",
      "createdAt": "2026-02-17T10:28:00.001Z",
      "lastActiveAt": "2026-02-17T10:29:50.001Z",
      "personalityTraits": {
        "openness": 0.6,
        "conscientiousness": 0.5,
        "extraversion": 0.4,
        "agreeableness": 0.7,
        "neuroticism": 0.2
      }
    }
  ]
}
```

### `agent.status.changed`

Payload type: `AgentStatusDto`

```json
{
  "agentId": "af2b0f86-2f0a-4f0a-9df8-5134a5005d7e",
  "userId": "demo-user",
  "status": "Working",
  "timestamp": "2026-02-17T10:31:01.700Z"
}
```

### `agent.message`

Payload type: `AgentMessageDto`

```json
{
  "messageId": "d4e7228a-5440-45f0-a99d-9f69a068cd68",
  "agentId": "af2b0f86-2f0a-4f0a-9df8-5134a5005d7e",
  "userId": "demo-user",
  "threadId": "2f67653d-c6cf-4333-88a6-f9f6809a9390",
  "role": "assistant",
  "content": "I propose action X.",
  "createdAt": "2026-02-17T10:31:06.200Z",
  "correlationId": "a58e2f376fcd45f8b8b6e7f0f2f0f0b6"
}
```

### `agent.thought` (optional internal trace)

Payload type: `AgentThoughtDto`

```json
{
  "agentId": "af2b0f86-2f0a-4f0a-9df8-5134a5005d7e",
  "userId": "demo-user",
  "stage": "reflection",
  "content": "Given context, risk is rising."
}
```

### `agent.progress` (optional progress)

Payload type: `AgentProgressDto`

```json
{
  "agentId": "af2b0f86-2f0a-4f0a-9df8-5134a5005d7e",
  "userId": "demo-user",
  "stage": "running",
  "message": "Agent is processing command.",
  "percent": 20
}
```

### `agent.error`

Payload type: `ErrorDto`

```json
{
  "code": "agent_command_failed",
  "message": "Agent '...' not found.",
  "correlationId": "a58e2f376fcd45f8b8b6e7f0f2f0f0b6",
  "agentId": "af2b0f86-2f0a-4f0a-9df8-5134a5005d7e",
  "timestamp": "2026-02-17T10:31:09.100Z"
}
```

## 3. Hub methods

### `SubscribeUser()`
- Request: no args
- Response: `HubAckDto`
- Effect: joins `user:{userId}`

### `SubscribeAgents()`
- Alias of `SubscribeUser()`

### `SubscribeAgent(agentId: Guid)`
- Request:
```json
{ "agentId": "af2b0f86-2f0a-4f0a-9df8-5134a5005d7e" }
```
- Response: `HubAckDto`
- Effect: joins `agent:{agentId}`
- Error: `HubException("Agent '...' not found.")`

### `UnsubscribeAgent(agentId: Guid)`
- Response: `HubAckDto`

### `CreateAgent(dto: CreateAgentRequestDto)`
- Input JSON:
```json
{
  "name": "Researcher",
  "model": "gpt-4o-mini",
  "initialState": "Ready",
  "initialEnergy": 0.8,
  "personalityTraits": {
    "openness": 0.6,
    "conscientiousness": 0.5,
    "extraversion": 0.4,
    "agreeableness": 0.7,
    "neuroticism": 0.2
  }
}
```
- Response: `AgentDto`

### `CommandAgent(agentId: Guid, commandDto: CommandAgentRequestDto)`
- Input JSON:
```json
{
  "command": "analyze",
  "message": "Summarize top risks for quarter.",
  "correlationId": "a58e2f376fcd45f8b8b6e7f0f2f0f0b6"
}
```
- Response: `CommandAckDto`
- Work model: async queue; actual result delivered by realtime events

### `SendMessage(agentId: Guid, messageDto: CommandAgentRequestDto)`
- Alias of `CommandAgent`

### `StopAgent(agentId: Guid)`, `PauseAgent(agentId: Guid)`, `ResumeAgent(agentId: Guid)`
- Response: `AgentStatusDto`

## 4. REST initial load endpoints

All endpoints use user identity from auth claims or `X-User-Id`.

- `GET /api/user-agents`
  - Response: `AgentDto[]`
- `GET /api/user-agents/{agentId}`
  - Response: `AgentDto`
- `GET /api/user-agents/{agentId}/messages?limit=50`
  - Response: `PagedResultDto<AgentMessageDto>`
- `POST /api/user-agents`
  - Body: `CreateAgentRequestDto`
  - Response: `201 Created` + `AgentDto`
- `POST /api/user-agents/{agentId}/commands`
  - Body: `CommandAgentRequestDto`
  - Response: `202 Accepted` + `CommandAckDto`
- `POST /api/user-agents/{agentId}/pause`
  - Response: `AgentStatusDto`
- `POST /api/user-agents/{agentId}/resume`
  - Response: `AgentStatusDto`
- `POST /api/user-agents/{agentId}/stop`
  - Response: `AgentStatusDto`
- `DELETE /api/user-agents/{agentId}`
  - Response: `204 No Content` (archive)

## 5. Data flow

1. Front connects to `AgentsHub` and auto-joins `user:{userId}` on connect.
2. Front calls REST initial load (`GET /api/user-agents`, details/messages for selected agent).
3. Front creates/commands agent via REST or Hub method.
4. Command is accepted immediately, pushed to in-memory queue.
5. Background worker runs existing `AgentBrain` logic, stores assistant output, updates agent status.
6. Hub notifier emits updates to `user:{userId}` and `agent:{agentId}` groups.
