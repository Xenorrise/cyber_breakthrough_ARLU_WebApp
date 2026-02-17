/**
 * Слой данных -- типы и моки.
 * Сейчас захардкожено, при подключении БД замени getAgents(), getEvents() и т.д.
 * Компоненты трогать не нужно -- зависят только от типов.
 */

// ===== ТИПЫ =====

export type Mood = "happy" | "neutral" | "sad" | "angry" | "excited" | "anxious"

export interface Agent {
  id: string
  name: string
  avatar: string        // аватар буква/эмо
  mood: Mood
  traits: string[]      // черты
  description: string
  currentPlan: string
  memories: string[]    // воспоминания
}

export interface AgentEvent {
  id: string
  agentId: string
  agentName: string
  type: "chat" | "action" | "emotion" | "system"
  text: string
  timestamp: string     // ISO
}

export interface Relationship {
  from: string          // agent id
  to: string            // agent id
  sentiment: number     // -1 (враг) до 1 (друг)
  label?: string        // "друзья", "враги", "знакомые"
}

export interface WorldStats {
  totalEvents: number
  totalConversations: number
  avgMood: number       // 0-1
  mostActiveAgent: string
  topRelationship: { from: string; to: string; sentiment: number }
  eventsByType: { type: string; count: number }[]
  moodDistribution: { mood: Mood; count: number }[]
}

// ===== НАСТРОЕНИЯ =====

export const MOOD_CONFIG: Record<Mood, { color: string; label: string }> = {
  happy:   { color: "#4ade80", label: "Счастлив" },
  neutral: { color: "#a0a0b0", label: "Нейтрален" },
  sad:     { color: "#60a5fa", label: "Грустит" },
  angry:   { color: "#f87171", label: "Злится" },
  excited: { color: "#e5c34b", label: "Воодушевлён" },
  anxious: { color: "#c084fc", label: "Тревожится" },
}

// ===== МОКСИ =====

export const MOCK_AGENTS: Agent[] = [
  {
    id: "agent-1",
    name: "Алексей",
    avatar: "А",
    mood: "happy",
    traits: ["общительный", "оптимист", "любопытный"],
    description: "Молодой исследователь, который всегда ищет новые знакомства. Верит в лучшее в людях.",
    currentPlan: "Поговорить с Мариной о вчерашнем событии",
    memories: [
      "Встретил Марину на площади",
      "Поспорил с Виктором о политике",
      "Нашёл старую книгу в библиотеке",
    ],
  },
  {
    id: "agent-2",
    name: "Марина",
    avatar: "М",
    mood: "neutral",
    traits: ["задумчивая", "художница", "интроверт"],
    description: "Талантливая художница, предпочитает одиночество. Наблюдает за миром через призму искусства.",
    currentPlan: "Закончить картину заката",
    memories: [
      "Разговор с Алексеем был приятным",
      "Виктор показался грубым",
      "Увидела красивый закат",
    ],
  },
  {
    id: "agent-3",
    name: "Виктор",
    avatar: "В",
    mood: "angry",
    traits: ["прямолинейный", "амбициозный", "упрямый"],
    description: "Бывший военный, привык командовать. Не терпит слабости, но глубоко внутри одинок.",
    currentPlan: "Доказать свою правоту Алексею",
    memories: [
      "Спор с Алексеем закончился ничем",
      "Марина отвернулась при встрече",
      "Вспомнил службу в армии",
    ],
  },
  {
    id: "agent-4",
    name: "Елена",
    avatar: "Е",
    mood: "excited",
    traits: ["энергичная", "лидер", "эмпат"],
    description: "Врач по профессии и миротворец по натуре. Старается помирить всех вокруг.",
    currentPlan: "Организовать общий ужин для всех",
    memories: [
      "Помогла незнакомцу на улице",
      "Заметила напряжение между Виктором и Алексеем",
      "Получила письмо от старого друга",
    ],
  },
  {
    id: "agent-5",
    name: "Дмитрий",
    avatar: "Д",
    mood: "sad",
    traits: ["замкнутый", "умный", "меланхоличный"],
    description: "Бывший учёный, потерял лабораторию в пожаре. Живёт на окраине и избегает людей.",
    currentPlan: "Попытаться восстановить записи из сгоревшей лаборатории",
    memories: [
      "Пожар уничтожил десять лет работы",
      "Марина однажды принесла еду",
      "Не доверяет Виктору",
    ],
  },
  {
    id: "agent-6",
    name: "Ольга",
    avatar: "О",
    mood: "anxious",
    traits: ["осторожная", "наблюдательная", "скрытная"],
    description: "Торговка на рынке. Знает все сплетни города, но сама держит много секретов.",
    currentPlan: "Разузнать, что случилось на площади вчера ночью",
    memories: [
      "Видела Виктора в переулке поздно ночью",
      "Елена покупает у неё травы каждую неделю",
      "Кто-то следит за ней -- уверена",
    ],
  },
  {
    id: "agent-7",
    name: "Игорь",
    avatar: "И",
    mood: "neutral",
    traits: ["спокойный", "справедливый", "старомодный"],
    description: "Пожилой сторож библиотеки. Видел многое, говорит мало, но когда говорит -- все слушают.",
    currentPlan: "Присматривать за библиотекой и читать хроники",
    memories: [
      "Алексей часто приходит читать",
      "Помнит, каким был город до войны",
      "Не одобряет поведение Виктора",
    ],
  },
  {
    id: "agent-8",
    name: "Настя",
    avatar: "Н",
    mood: "happy",
    traits: ["жизнерадостная", "наивная", "творческая"],
    description: "Студентка-музыкант, недавно приехала в город. Ещё не знает местных интриг.",
    currentPlan: "Найти место для репетиции и познакомиться с людьми",
    memories: [
      "Город показался красивым, но странным",
      "Марина улыбнулась ей на улице",
      "Услышала громкий спор на площади",
    ],
  },
]

export const MOCK_EVENTS: AgentEvent[] = [
  {
    id: "evt-1",
    agentId: "agent-1",
    agentName: "Алексей",
    type: "chat",
    text: "Привет, Марина! Как твоя новая картина?",
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: "evt-2",
    agentId: "agent-2",
    agentName: "Марина",
    type: "emotion",
    text: "Почувствовала прилив вдохновения от заката",
    timestamp: new Date(Date.now() - 240000).toISOString(),
  },
  {
    id: "evt-3",
    agentId: "agent-3",
    agentName: "Виктор",
    type: "action",
    text: "Отправился на площадь, чтобы найти Алексея",
    timestamp: new Date(Date.now() - 180000).toISOString(),
  },
  {
    id: "evt-4",
    agentId: "agent-4",
    agentName: "Елена",
    type: "chat",
    text: "Виктор, давай поговорим спокойно. Я уверена, вы с Алексеем найдёте общий язык.",
    timestamp: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: "evt-5",
    agentId: "agent-3",
    agentName: "Виктор",
    type: "emotion",
    text: "Раздражён: Елена снова лезет не в своё дело",
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: "evt-6",
    agentId: "agent-1",
    agentName: "Алексей",
    type: "action",
    text: "Зашёл в библиотеку и нашёл интересную книгу об истории города",
    timestamp: new Date(Date.now() - 30000).toISOString(),
  },
  {
    id: "evt-7",
    agentId: "agent-2",
    agentName: "Марина",
    type: "action",
    text: "Поставила мольберт у реки и начала рисовать",
    timestamp: new Date(Date.now() - 15000).toISOString(),
  },
  {
    id: "evt-8",
    agentId: "agent-4",
    agentName: "Елена",
    type: "system",
    text: "Решила организовать общий ужин сегодня вечером",
    timestamp: new Date(Date.now() - 5000).toISOString(),
  },
  {
    id: "evt-9",
    agentId: "agent-5",
    agentName: "Дмитрий",
    type: "action",
    text: "Нашёл обгоревший дневник среди руин лаборатории",
    timestamp: new Date(Date.now() - 280000).toISOString(),
  },
  {
    id: "evt-10",
    agentId: "agent-6",
    agentName: "Ольга",
    type: "emotion",
    text: "Тревога нарастает -- кто-то определённо следит",
    timestamp: new Date(Date.now() - 200000).toISOString(),
  },
  {
    id: "evt-11",
    agentId: "agent-7",
    agentName: "Игорь",
    type: "action",
    text: "Открыл старый архив в подвале библиотеки",
    timestamp: new Date(Date.now() - 150000).toISOString(),
  },
  {
    id: "evt-12",
    agentId: "agent-8",
    agentName: "Настя",
    type: "chat",
    text: "Простите, вы не подскажете, где тут можно порепетировать?",
    timestamp: new Date(Date.now() - 90000).toISOString(),
  },
]

export const MOCK_RELATIONSHIPS: Relationship[] = [
  // Алексей
  { from: "agent-1", to: "agent-2", sentiment: 0.7, label: "дружба" },
  { from: "agent-1", to: "agent-3", sentiment: -0.4, label: "конфликт" },
  { from: "agent-1", to: "agent-7", sentiment: 0.4, label: "уважение" },
  // Марина
  { from: "agent-2", to: "agent-5", sentiment: 0.3, label: "сочувствие" },
  { from: "agent-2", to: "agent-8", sentiment: 0.5, label: "симпатия" },
  // Виктор
  { from: "agent-3", to: "agent-4", sentiment: -0.2, label: "раздражение" },
  { from: "agent-3", to: "agent-7", sentiment: -0.3, label: "неприязнь" },
  // Елена
  { from: "agent-4", to: "agent-6", sentiment: 0.4, label: "торговля" },
  { from: "agent-4", to: "agent-1", sentiment: 0.5, label: "знакомые" },
  // Ольга
  { from: "agent-6", to: "agent-3", sentiment: -0.1, label: "подозрение" },
  // Игорь -- одиночка, мало связей
  // Настя -- новенькая, только одна связь
  { from: "agent-8", to: "agent-1", sentiment: 0.2, label: "знакомые" },
  // Дмитрий -- затворник, почти нет связей
  { from: "agent-5", to: "agent-7", sentiment: 0.2, label: "соседи" },
]

export const MOCK_STATS: WorldStats = {
  totalEvents: 847,
  totalConversations: 234,
  avgMood: 0.62,
  mostActiveAgent: "Алексей",
  topRelationship: { from: "agent-1", to: "agent-2", sentiment: 0.7 },
  eventsByType: [
    { type: "chat", count: 312 },
    { type: "action", count: 289 },
    { type: "emotion", count: 178 },
    { type: "system", count: 68 },
  ],
  moodDistribution: [
    { mood: "happy", count: 2 },
    { mood: "neutral", count: 2 },
    { mood: "sad", count: 1 },
    { mood: "angry", count: 1 },
    { mood: "excited", count: 1 },
    { mood: "anxious", count: 1 },
  ],
}

// ===== ДОСТУП К ДАННЫМ (замени на реальные запросы) =====

interface BackendPersonalityTraits {
  openness?: number
  conscientiousness?: number
  extraversion?: number
  agreeableness?: number
  neuroticism?: number
}

interface BackendAgentDto {
  agentId: string
  name: string
  model: string
  status: string
  state: string
  energy: number
  personalityTraits?: BackendPersonalityTraits
}

interface BackendEventDto {
  id: string
  type: string
  payload: unknown
  createdAt: string
}

const BACKEND_API_BASE = "/api/backend"
const DEFAULT_USER_ID = "demo-user"

function getUserId(): string {
  const fromEnv = process.env.NEXT_PUBLIC_USER_ID?.trim()
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_USER_ID
}

async function backendRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set("Accept", "application/json")
  headers.set("X-User-Id", getUserId())
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${BACKEND_API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as T
}

function toMood(status: string, energyRaw: number): Mood {
  const statusLower = status.toLowerCase()
  const energy = Number.isFinite(energyRaw) ? Math.max(0, Math.min(1, energyRaw)) : 0.5

  if (statusLower.includes("error") || statusLower.includes("failed")) return "angry"
  if (statusLower.includes("stop") || statusLower.includes("archived")) return "sad"
  if (statusLower.includes("pause")) return "anxious"
  if (energy >= 0.8) return "excited"
  if (energy >= 0.6) return "happy"
  if (energy >= 0.4) return "neutral"
  if (energy >= 0.2) return "anxious"
  return "sad"
}

function toTraits(traits?: BackendPersonalityTraits): string[] {
  if (!traits) return ["adaptive"]

  const labels: Array<{ key: keyof BackendPersonalityTraits; label: string }> = [
    { key: "openness", label: "curious" },
    { key: "conscientiousness", label: "disciplined" },
    { key: "extraversion", label: "social" },
    { key: "agreeableness", label: "cooperative" },
    { key: "neuroticism", label: "sensitive" },
  ]

  const sorted = labels
    .map((item) => ({ label: item.label, value: Number(traits[item.key] ?? 0) }))
    .sort((a, b) => b.value - a.value)
    .filter((item) => item.value > 0)
    .slice(0, 3)
    .map((item) => item.label)

  return sorted.length > 0 ? sorted : ["adaptive"]
}

function mapBackendAgent(agent: BackendAgentDto): Agent {
  const mood = toMood(agent.status, agent.energy)
  return {
    id: agent.agentId,
    name: agent.name,
    avatar: agent.name?.trim()?.charAt(0)?.toUpperCase() || "?",
    mood,
    traits: toTraits(agent.personalityTraits),
    description: `${agent.model} • status: ${agent.status}`,
    currentPlan: agent.state || "No current plan",
    memories: agent.state ? [`Current state: ${agent.state}`] : [],
  }
}

function asRecord(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null
  return input as Record<string, unknown>
}

function readString(record: Record<string, unknown> | null, keys: string[]): string | undefined {
  if (!record) return undefined
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" && value.trim().length > 0) return value.trim()
  }
  return undefined
}

function normalizeEventType(rawType: string): AgentEvent["type"] {
  const t = rawType.toLowerCase()
  if (t.includes("chat") || t.includes("message")) return "chat"
  if (t.includes("emotion") || t.includes("mood")) return "emotion"
  if (t.includes("system") || t.includes("status") || t.includes("error") || t.includes("progress")) return "system"
  return "action"
}

function payloadToText(payload: unknown, eventType: string): string {
  const record = asRecord(payload)
  const directText = readString(record, ["text", "message", "description", "content"])
  if (directText) return directText
  if (record) {
    const nested = asRecord(record.payload)
    const nestedText = readString(nested, ["text", "message", "description", "content"])
    if (nestedText) return nestedText
  }

  try {
    const json = JSON.stringify(payload)
    if (!json || json === "{}") return eventType
    return json.slice(0, 200)
  } catch {
    return eventType
  }
}

function mapBackendEvent(event: BackendEventDto, agentsById: Map<string, Agent>): AgentEvent {
  const record = asRecord(event.payload)
  const nested = asRecord(record?.payload)
  const source = nested ?? record

  const agentId =
    readString(source, ["agentId", "agent_id", "id"]) ??
    readString(asRecord(source?.agent), ["id", "agentId"]) ??
    "system"

  const agentName =
    readString(source, ["agentName", "agent_name", "name"]) ??
    agentsById.get(agentId)?.name ??
    "System"

  return {
    id: event.id,
    agentId,
    agentName,
    type: normalizeEventType(event.type),
    text: payloadToText(event.payload, event.type),
    timestamp: event.createdAt,
  }
}

function buildRelationshipsFromEvents(events: AgentEvent[], agents: Agent[]): Relationship[] {
  const existingIds = new Set(agents.map((a) => a.id))
  const relCounts = new Map<string, number>()

  for (let i = 1; i < events.length; i += 1) {
    const previous = events[i - 1]
    const current = events[i]
    if (
      previous.agentId === current.agentId ||
      previous.agentId === "system" ||
      current.agentId === "system" ||
      !existingIds.has(previous.agentId) ||
      !existingIds.has(current.agentId)
    ) {
      continue
    }

    const key = `${previous.agentId}|${current.agentId}`
    relCounts.set(key, (relCounts.get(key) ?? 0) + 1)
  }

  return Array.from(relCounts.entries())
    .map(([key, count]) => {
      const [from, to] = key.split("|")
      return {
        from,
        to,
        sentiment: Math.min(0.8, count / 5),
        label: "interaction",
      } satisfies Relationship
    })
    .slice(0, 80)
}

function buildStats(agents: Agent[], events: AgentEvent[], relationships: Relationship[]): WorldStats {
  const moodWeight: Record<Mood, number> = {
    happy: 0.8,
    neutral: 0.5,
    sad: 0.2,
    angry: 0.15,
    excited: 0.9,
    anxious: 0.35,
  }

  const eventTypeOrder: AgentEvent["type"][] = ["chat", "action", "emotion", "system"]
  const eventsByType = eventTypeOrder.map((type) => ({
    type,
    count: events.filter((e) => e.type === type).length,
  }))

  const moodDistribution = (Object.keys(MOOD_CONFIG) as Mood[]).map((mood) => ({
    mood,
    count: agents.filter((a) => a.mood === mood).length,
  }))

  const avgMood =
    agents.length === 0
      ? 0
      : agents.reduce((sum, agent) => sum + moodWeight[agent.mood], 0) / agents.length

  const activity = new Map<string, number>()
  for (const event of events) {
    if (event.agentId !== "system") {
      activity.set(event.agentId, (activity.get(event.agentId) ?? 0) + 1)
    }
  }

  const mostActiveAgentId =
    Array.from(activity.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? agents[0]?.id ?? "-"
  const mostActiveAgent = agents.find((a) => a.id === mostActiveAgentId)?.name ?? mostActiveAgentId

  const topRelationshipRaw = relationships
    .slice()
    .sort((a, b) => Math.abs(b.sentiment) - Math.abs(a.sentiment))[0]

  const topRelationship = topRelationshipRaw
    ? {
        from: agents.find((a) => a.id === topRelationshipRaw.from)?.name ?? topRelationshipRaw.from,
        to: agents.find((a) => a.id === topRelationshipRaw.to)?.name ?? topRelationshipRaw.to,
        sentiment: topRelationshipRaw.sentiment,
      }
    : { from: "-", to: "-", sentiment: 0 }

  return {
    totalEvents: events.length,
    totalConversations: eventsByType.find((x) => x.type === "chat")?.count ?? 0,
    avgMood,
    mostActiveAgent,
    topRelationship,
    eventsByType,
    moodDistribution,
  }
}

export async function addEvent(text: string): Promise<boolean> {
  const payload = {
    type: "ui.note",
    payload: {
      text,
      message: text,
      source: "frontend",
      agentName: "Operator",
    },
  }

  try {
    await backendRequest<unknown>("/api/events", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return true
  } catch (error) {
    console.warn("[data] addEvent fallback, backend unavailable", error)
    return false
  }
}

export async function getAgents(): Promise<Agent[]> {
  try {
    const agents = await backendRequest<BackendAgentDto[]>("/api/user-agents")
    return agents.map(mapBackendAgent)
  } catch (error) {
    console.warn("[data] getAgents fallback to mock", error)
    return MOCK_AGENTS
  }
}

export async function getAgent(id: string): Promise<Agent | undefined> {
  try {
    const agent = await backendRequest<BackendAgentDto>(`/api/user-agents/${encodeURIComponent(id)}`)
    return mapBackendAgent(agent)
  } catch {
    return MOCK_AGENTS.find((a) => a.id === id)
  }
}

export async function getEvents(): Promise<AgentEvent[]> {
  try {
    const [agents, events] = await Promise.all([
      getAgents(),
      backendRequest<BackendEventDto[]>("/api/events"),
    ])
    const agentsById = new Map(agents.map((agent) => [agent.id, agent]))
    return events.map((event) => mapBackendEvent(event, agentsById))
  } catch (error) {
    console.warn("[data] getEvents fallback to mock", error)
    return MOCK_EVENTS
  }
}

export async function getRelationships(): Promise<Relationship[]> {
  try {
    const [agents, events] = await Promise.all([getAgents(), getEvents()])
    return buildRelationshipsFromEvents(events, agents)
  } catch (error) {
    console.warn("[data] getRelationships fallback to mock", error)
    return MOCK_RELATIONSHIPS
  }
}

export async function getStats(): Promise<WorldStats> {
  try {
    const [agents, events, relationships] = await Promise.all([
      getAgents(),
      getEvents(),
      getRelationships(),
    ])
    return buildStats(agents, events, relationships)
  } catch (error) {
    console.warn("[data] getStats fallback to mock", error)
    return MOCK_STATS
  }
}
