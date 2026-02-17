/*
 * Типы и моковые данные
*/


export type Mood = "happy" | "neutral" | "sad" | "angry" | "excited" | "anxious"

export interface Agent {
  id: string
  name: string
  avatar: string        // URL или эмодзи-заглушка
  mood: Mood
  traits: string[]      // черты характера
  description: string
  currentPlan: string
  memories: string[]    // ключевые воспоминания
}

export interface AgentEvent {
  id: string
  agentId: string
  agentName: string
  type: "chat" | "action" | "emotion" | "system"
  text: string
  timestamp: string     // ISO string
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

// Цвета настроения

export const MOOD_CONFIG: Record<Mood, { color: string; label: string }> = {
  happy:   { color: "#4ade80", label: "Счастлив" },
  neutral: { color: "#a0a0b0", label: "Нейтрален" },
  sad:     { color: "#60a5fa", label: "Грустит" },
  angry:   { color: "#f87171", label: "Злится" },
  excited: { color: "#e5c34b", label: "Воодушевлён" },
  anxious: { color: "#c084fc", label: "Тревожится" },
}

// Мок данные

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
]

export const MOCK_RELATIONSHIPS: Relationship[] = [
  { from: "agent-1", to: "agent-2", sentiment: 0.7, label: "дружба" },
  { from: "agent-1", to: "agent-3", sentiment: -0.4, label: "конфликт" },
  { from: "agent-1", to: "agent-4", sentiment: 0.5, label: "знакомые" },
  { from: "agent-2", to: "agent-3", sentiment: -0.2, label: "недоверие" },
  { from: "agent-2", to: "agent-4", sentiment: 0.3, label: "знакомые" },
  { from: "agent-3", to: "agent-4", sentiment: -0.1, label: "нейтрально" },
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
    { mood: "happy", count: 3 },
    { mood: "neutral", count: 4 },
    { mood: "sad", count: 1 },
    { mood: "angry", count: 2 },
    { mood: "excited", count: 2 },
    { mood: "anxious", count: 1 },
  ],
}

// Доступ к данным
export async function getAgents(): Promise<Agent[]> {
  // TODO: заменить на fetch("/api/agents") или SignalR
  return MOCK_AGENTS
}

export async function getAgent(id: string): Promise<Agent | undefined> {
  // TODO: заменить на fetch(`/api/agents/${id}`)
  return MOCK_AGENTS.find((a) => a.id === id)
}

export async function getEvents(): Promise<AgentEvent[]> {
  // TODO: заменить на fetch("/api/events") или SignalR подписку
  return MOCK_EVENTS
}

export async function getRelationships(): Promise<Relationship[]> {
  // TODO: заменить на fetch("/api/relationships")
  return MOCK_RELATIONSHIPS
}

export async function getStats(): Promise<WorldStats> {
  // TODO: заменить на fetch("/api/stats")
  return MOCK_STATS
}
