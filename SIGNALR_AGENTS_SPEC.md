# Спецификация User Agents + SignalR

## 1. Подключение к SignalR

- URL хаба: `/hubs/agents`
- Полные локальные URL:
  - `http://localhost:5133/hubs/agents` (`dotnet run`)
  - `http://localhost:8080/hubs/agents` (backend в docker)
- Источник идентификатора пользователя:
  - основной: claim `nameidentifier` / `sub` / `userId`
  - fallback для dev: заголовок `X-User-Id`

### Пример подключения на фронте

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

## 2. Realtime-события

Все события отправляются в envelope-формате:

```json
{
  "type": "agent.status.changed",
  "timestamp": "2026-02-17T10:30:22.113Z",
  "correlationId": "a58e2f376fcd45f8b8b6e7f0f2f0f0b6",
  "payload": {}
}
```

### `agents.list.updated`

Тип payload: `AgentsListUpdatedDto`

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

Тип payload: `AgentStatusDto`

```json
{
  "agentId": "af2b0f86-2f0a-4f0a-9df8-5134a5005d7e",
  "userId": "demo-user",
  "status": "Working",
  "timestamp": "2026-02-17T10:31:01.700Z"
}
```

### `agent.message`

Тип payload: `AgentMessageDto`

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

### `agent.thought` (опциональный внутренний trace)

Тип payload: `AgentThoughtDto`

```json
{
  "agentId": "af2b0f86-2f0a-4f0a-9df8-5134a5005d7e",
  "userId": "demo-user",
  "stage": "reflection",
  "content": "Given context, risk is rising."
}
```

### `agent.progress` (опциональный прогресс)

Тип payload: `AgentProgressDto`

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

Тип payload: `ErrorDto`

```json
{
  "code": "agent_command_failed",
  "message": "Agent '...' not found.",
  "correlationId": "a58e2f376fcd45f8b8b6e7f0f2f0f0b6",
  "agentId": "af2b0f86-2f0a-4f0a-9df8-5134a5005d7e",
  "timestamp": "2026-02-17T10:31:09.100Z"
}
```

## 3. Методы Hub

### `SubscribeUser()`
- Запрос: без аргументов
- Ответ: `HubAckDto`
- Эффект: подключение в группу `user:{userId}`

### `SubscribeAgents()`
- Алиас для `SubscribeUser()`

### `SubscribeAgent(agentId: Guid)`
- Запрос:
```json
{ "agentId": "af2b0f86-2f0a-4f0a-9df8-5134a5005d7e" }
```
- Ответ: `HubAckDto`
- Эффект: подключение в группу `agent:{agentId}`
- Ошибка: `HubException("Agent '...' not found.")`

### `UnsubscribeAgent(agentId: Guid)`
- Ответ: `HubAckDto`

### `CreateAgent(dto: CreateAgentRequestDto)`
- Входной JSON:
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
- Ответ: `AgentDto`

### `CommandAgent(agentId: Guid, commandDto: CommandAgentRequestDto)`
- Входной JSON:
```json
{
  "command": "analyze",
  "message": "Summarize top risks for quarter.",
  "correlationId": "a58e2f376fcd45f8b8b6e7f0f2f0f0b6"
}
```
- Ответ: `CommandAckDto`
- Модель выполнения: асинхронно через очередь; итоговые результаты приходят через realtime-события

### `SendMessage(agentId: Guid, messageDto: CommandAgentRequestDto)`
- Алиас для `CommandAgent`

### `StopAgent(agentId: Guid)`, `PauseAgent(agentId: Guid)`, `ResumeAgent(agentId: Guid)`
- Ответ: `AgentStatusDto`

## 4. REST-эндпоинты для initial load

Все эндпоинты берут пользователя из auth claims или `X-User-Id`.

- `GET /api/user-agents`
  - Ответ: `AgentDto[]`
- `GET /api/user-agents/{agentId}`
  - Ответ: `AgentDto`
- `GET /api/user-agents/{agentId}/messages?limit=50`
  - Ответ: `PagedResultDto<AgentMessageDto>`
- `POST /api/user-agents`
  - Body: `CreateAgentRequestDto`
  - Ответ: `201 Created` + `AgentDto`
- `POST /api/user-agents/{agentId}/commands`
  - Body: `CommandAgentRequestDto`
  - Ответ: `202 Accepted` + `CommandAckDto`
- `POST /api/user-agents/{agentId}/pause`
  - Ответ: `AgentStatusDto`
- `POST /api/user-agents/{agentId}/resume`
  - Ответ: `AgentStatusDto`
- `POST /api/user-agents/{agentId}/stop`
  - Ответ: `AgentStatusDto`
- `DELETE /api/user-agents/{agentId}`
  - Ответ: `204 No Content` (архивация)

## 5. Поток данных

1. Фронт подключается к `AgentsHub` и автоматически попадает в `user:{userId}`.
2. Фронт делает initial load через REST (`GET /api/user-agents`, детали и сообщения выбранного агента).
3. Фронт создаёт агента/отправляет команду через REST или Hub method.
4. Команда подтверждается сразу и кладётся в in-memory очередь.
5. Background worker вызывает `ITickProcessor.ProcessTickAsync(...)`.
6. `TickProcessor` выбирает `Working`-агентов (с ограничениями из конфига), выполняет существующую логику `AgentBrain`, сохраняет ответ и обновляет статус.
7. Hub notifier рассылает изменения в группы `user:{userId}` и `agent:{agentId}`.
