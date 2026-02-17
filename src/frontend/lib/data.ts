/**
 * РЎР»РѕР№ РґР°РЅРЅС‹С… -- С‚РёРїС‹ Рё РјРѕРєРё.
 * РЎРµР№С‡Р°СЃ Р·Р°С…Р°СЂРґРєРѕР¶РµРЅРѕ, РїСЂРё РїРѕРґРєР»СЋС‡РµРЅРёРё Р‘Р” Р·Р°РјРµРЅРё getAgents(), getEvents() Рё С‚.Рґ.
 * РљРѕРјРїРѕРЅРµРЅС‚С‹ С‚СЂРѕРіР°С‚СЊ РЅРµ РЅСѓР¶РЅРѕ -- Р·Р°РІРёСЃСЏС‚ С‚РѕР»СЊРєРѕ РѕС‚ С‚РёРїРѕРІ.
 */

// ===== РўРРџР« =====

export type Mood = "happy" | "neutral" | "sad" | "angry" | "excited" | "anxious"

export interface Agent {
  id: string
  name: string
  avatar: string        // Р°РІР°С‚Р°СЂ Р±СѓРєРІР°/СЌРјРѕ
  mood: Mood
  traits: string[]      // С‡РµСЂС‚С‹
  description: string
  currentPlan: string
  memories: string[]    // РІРѕСЃРїРѕРјРёРЅР°РЅРёСЏ
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
  sentiment: number     // -1 (РІСЂР°Рі) РґРѕ 1 (РґСЂСѓРі)
  label?: string        // "РґСЂСѓР·СЊСЏ", "РІСЂР°РіРё", "Р·РЅР°РєРѕРјС‹Рµ"
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

// ===== РќРђРЎРўР РћР•РќРРЇ =====

export const MOOD_CONFIG: Record<Mood, { color: string; label: string }> = {
  happy:   { color: "#4ade80", label: "РЎС‡Р°СЃС‚Р»РёРІ" },
  neutral: { color: "#a0a0b0", label: "РќРµР№С‚СЂР°Р»РµРЅ" },
  sad:     { color: "#60a5fa", label: "Р“СЂСѓСЃС‚РёС‚" },
  angry:   { color: "#f87171", label: "Р—Р»РёС‚СЃСЏ" },
  excited: { color: "#e5c34b", label: "Р’РѕРѕРґСѓС€РµРІР»С‘РЅ" },
  anxious: { color: "#c084fc", label: "РўСЂРµРІРѕР¶РёС‚СЃСЏ" },
}

// ===== РњРћРљРЎР =====

export const MOCK_AGENTS: Agent[] = [
  {
    id: "agent-1",
    name: "РђР»РµРєСЃРµР№",
    avatar: "Рђ",
    mood: "happy",
    traits: ["РѕР±С‰РёС‚РµР»СЊРЅС‹Р№", "РѕРїС‚РёРјРёСЃС‚", "Р»СЋР±РѕРїС‹С‚РЅС‹Р№"],
    description: "РњРѕР»РѕРґРѕР№ РёСЃСЃР»РµРґРѕРІР°С‚РµР»СЊ, РєРѕС‚РѕСЂС‹Р№ РІСЃРµРіРґР° РёС‰РµС‚ РЅРѕРІС‹Рµ Р·РЅР°РєРѕРјСЃС‚РІР°. Р’РµСЂРёС‚ РІ Р»СѓС‡С€РµРµ РІ Р»СЋРґСЏС….",
    currentPlan: "РџРѕРіРѕРІРѕСЂРёС‚СЊ СЃ РњР°СЂРёРЅРѕР№ Рѕ РІС‡РµСЂР°С€РЅРµРј СЃРѕР±С‹С‚РёРё",
    memories: [
      "Р’СЃС‚СЂРµС‚РёР» РњР°СЂРёРЅСѓ РЅР° РїР»РѕС‰Р°РґРё",
      "РџРѕСЃРїРѕСЂРёР» СЃ Р’РёРєС‚РѕСЂРѕРј Рѕ РїРѕР»РёС‚РёРєРµ",
      "РќР°С€С‘Р» СЃС‚Р°СЂСѓСЋ РєРЅРёРіСѓ РІ Р±РёР±Р»РёРѕС‚РµРєРµ",
    ],
  },
  {
    id: "agent-2",
    name: "РњР°СЂРёРЅР°",
    avatar: "Рњ",
    mood: "neutral",
    traits: ["Р·Р°РґСѓРјС‡РёРІР°СЏ", "С…СѓРґРѕР¶РЅРёС†Р°", "РёРЅС‚СЂРѕРІРµСЂС‚"],
    description: "РўР°Р»Р°РЅС‚Р»РёРІР°СЏ С…СѓРґРѕР¶РЅРёС†Р°, РїСЂРµРґРїРѕС‡РёС‚Р°РµС‚ РѕРґРёРЅРѕС‡РµСЃС‚РІРѕ. РќР°Р±Р»СЋРґР°РµС‚ Р·Р° РјРёСЂРѕРј С‡РµСЂРµР· РїСЂРёР·РјСѓ РёСЃРєСѓСЃСЃС‚РІР°.",
    currentPlan: "Р—Р°РєРѕРЅС‡РёС‚СЊ РєР°СЂС‚РёРЅСѓ Р·Р°РєР°С‚Р°",
    memories: [
      "Р Р°Р·РіРѕРІРѕСЂ СЃ РђР»РµРєСЃРµРµРј Р±С‹Р» РїСЂРёСЏС‚РЅС‹Рј",
      "Р’РёРєС‚РѕСЂ РїРѕРєР°Р·Р°Р»СЃСЏ РіСЂСѓР±С‹Рј",
      "РЈРІРёРґРµР»Р° РєСЂР°СЃРёРІС‹Р№ Р·Р°РєР°С‚",
    ],
  },
  {
    id: "agent-3",
    name: "Р’РёРєС‚РѕСЂ",
    avatar: "Р’",
    mood: "angry",
    traits: ["РїСЂСЏРјРѕР»РёРЅРµР№РЅС‹Р№", "Р°РјР±РёС†РёРѕР·РЅС‹Р№", "СѓРїСЂСЏРјС‹Р№"],
    description: "Р‘С‹РІС€РёР№ РІРѕРµРЅРЅС‹Р№, РїСЂРёРІС‹Рє РєРѕРјР°РЅРґРѕРІР°С‚СЊ. РќРµ С‚РµСЂРїРёС‚ СЃР»Р°Р±РѕСЃС‚Рё, РЅРѕ РіР»СѓР±РѕРєРѕ РІРЅСѓС‚СЂРё РѕРґРёРЅРѕРє.",
    currentPlan: "Р”РѕРєР°Р·Р°С‚СЊ СЃРІРѕСЋ РїСЂР°РІРѕС‚Сѓ РђР»РµРєСЃРµСЋ",
    memories: [
      "РЎРїРѕСЂ СЃ РђР»РµРєСЃРµРµРј Р·Р°РєРѕРЅС‡РёР»СЃСЏ РЅРёС‡РµРј",
      "РњР°СЂРёРЅР° РѕС‚РІРµСЂРЅСѓР»Р°СЃСЊ РїСЂРё РІСЃС‚СЂРµС‡Рµ",
      "Р’СЃРїРѕРјРЅРёР» СЃР»СѓР¶Р±Сѓ РІ Р°СЂРјРёРё",
    ],
  },
  {
    id: "agent-4",
    name: "Р•Р»РµРЅР°",
    avatar: "Р•",
    mood: "excited",
    traits: ["СЌРЅРµСЂРіРёС‡РЅР°СЏ", "Р»РёРґРµСЂ", "СЌРјРїР°С‚"],
    description: "Р’СЂР°С‡ РїРѕ РїСЂРѕС„РµСЃСЃРёРё Рё РјРёСЂРѕС‚РІРѕСЂРµС† РїРѕ РЅР°С‚СѓСЂРµ. РЎС‚Р°СЂР°РµС‚СЃСЏ РїРѕРјРёСЂРёС‚СЊ РІСЃРµС… РІРѕРєСЂСѓРі.",
    currentPlan: "РћСЂРіР°РЅРёР·РѕРІР°С‚СЊ РѕР±С‰РёР№ СѓР¶РёРЅ РґР»СЏ РІСЃРµС…",
    memories: [
      "РџРѕРјРѕРіР»Р° РЅРµР·РЅР°РєРѕРјС†Сѓ РЅР° СѓР»РёС†Рµ",
      "Р—Р°РјРµС‚РёР»Р° РЅР°РїСЂСЏР¶РµРЅРёРµ РјРµР¶РґСѓ Р’РёРєС‚РѕСЂРѕРј Рё РђР»РµРєСЃРµРµРј",
      "РџРѕР»СѓС‡РёР»Р° РїРёСЃСЊРјРѕ РѕС‚ СЃС‚Р°СЂРѕРіРѕ РґСЂСѓРіР°",
    ],
  },
  {
    id: "agent-5",
    name: "Р”РјРёС‚СЂРёР№",
    avatar: "Р”",
    mood: "sad",
    traits: ["Р·Р°РјРєРЅСѓС‚С‹Р№", "СѓРјРЅС‹Р№", "РјРµР»Р°РЅС…РѕР»РёС‡РЅС‹Р№"],
    description: "Р‘С‹РІС€РёР№ СѓС‡С‘РЅС‹Р№, РїРѕС‚РµСЂСЏР» Р»Р°Р±РѕСЂР°С‚РѕСЂРёСЋ РІ РїРѕР¶Р°СЂРµ. Р–РёРІС‘С‚ РЅР° РѕРєСЂР°РёРЅРµ Рё РёР·Р±РµРіР°РµС‚ Р»СЋРґРµР№.",
    currentPlan: "РџРѕРїС‹С‚Р°С‚СЊСЃСЏ РІРѕСЃСЃС‚Р°РЅРѕРІРёС‚СЊ Р·Р°РїРёСЃРё РёР· СЃРіРѕСЂРµРІС€РµР№ Р»Р°Р±РѕСЂР°С‚РѕСЂРёРё",
    memories: [
      "РџРѕР¶Р°СЂ СѓРЅРёС‡С‚РѕР¶РёР» РґРµСЃСЏС‚СЊ Р»РµС‚ СЂР°Р±РѕС‚С‹",
      "РњР°СЂРёРЅР° РѕРґРЅР°Р¶РґС‹ РїСЂРёРЅРµСЃР»Р° РµРґСѓ",
      "РќРµ РґРѕРІРµСЂСЏРµС‚ Р’РёРєС‚РѕСЂСѓ",
    ],
  },
  {
    id: "agent-6",
    name: "РћР»СЊРіР°",
    avatar: "Рћ",
    mood: "anxious",
    traits: ["РѕСЃС‚РѕСЂРѕР¶РЅР°СЏ", "РЅР°Р±Р»СЋРґР°С‚РµР»СЊРЅР°СЏ", "СЃРєСЂС‹С‚РЅР°СЏ"],
    description: "РўРѕСЂРіРѕРІРєР° РЅР° СЂС‹РЅРєРµ. Р—РЅР°РµС‚ РІСЃРµ СЃРїР»РµС‚РЅРё РіРѕСЂРѕРґР°, РЅРѕ СЃР°РјР° РґРµСЂР¶РёС‚ РјРЅРѕРіРѕ СЃРµРєСЂРµС‚РѕРІ.",
    currentPlan: "Р Р°Р·СѓР·РЅР°С‚СЊ, С‡С‚Рѕ СЃР»СѓС‡РёР»РѕСЃСЊ РЅР° РїР»РѕС‰Р°РґРё РІС‡РµСЂР° РЅРѕС‡СЊСЋ",
    memories: [
      "Р’РёРґРµР»Р° Р’РёРєС‚РѕСЂР° РІ РїРµСЂРµСѓР»РєРµ РїРѕР·РґРЅРѕ РЅРѕС‡СЊСЋ",
      "Р•Р»РµРЅР° РїРѕРєСѓРїР°РµС‚ Сѓ РЅРµС‘ С‚СЂР°РІС‹ РєР°Р¶РґСѓСЋ РЅРµРґРµР»СЋ",
      "РљС‚Рѕ-С‚Рѕ СЃР»РµРґРёС‚ Р·Р° РЅРµР№ -- СѓРІРµСЂРµРЅР°",
    ],
  },
  {
    id: "agent-7",
    name: "РРіРѕСЂСЊ",
    avatar: "Р",
    mood: "neutral",
    traits: ["СЃРїРѕРєРѕР№РЅС‹Р№", "СЃРїСЂР°РІРµРґР»РёРІС‹Р№", "СЃС‚Р°СЂРѕРјРѕРґРЅС‹Р№"],
    description: "РџРѕР¶РёР»РѕР№ СЃС‚РѕСЂРѕР¶ Р±РёР±Р»РёРѕС‚РµРєРё. Р’РёРґРµР» РјРЅРѕРіРѕРµ, РіРѕРІРѕСЂРёС‚ РјР°Р»Рѕ, РЅРѕ РєРѕРіРґР° РіРѕРІРѕСЂРёС‚ -- РІСЃРµ СЃР»СѓС€Р°СЋС‚.",
    currentPlan: "РџСЂРёСЃРјР°С‚СЂРёРІР°С‚СЊ Р·Р° Р±РёР±Р»РёРѕС‚РµРєРѕР№ Рё С‡РёС‚Р°С‚СЊ С…СЂРѕРЅРёРєРё",
    memories: [
      "РђР»РµРєСЃРµР№ С‡Р°СЃС‚Рѕ РїСЂРёС…РѕРґРёС‚ С‡РёС‚Р°С‚СЊ",
      "РџРѕРјРЅРёС‚, РєР°РєРёРј Р±С‹Р» РіРѕСЂРѕРґ РґРѕ РІРѕР№РЅС‹",
      "РќРµ РѕРґРѕР±СЂСЏРµС‚ РїРѕРІРµРґРµРЅРёРµ Р’РёРєС‚РѕСЂР°",
    ],
  },
  {
    id: "agent-8",
    name: "РќР°СЃС‚СЏ",
    avatar: "Рќ",
    mood: "happy",
    traits: ["Р¶РёР·РЅРµСЂР°РґРѕСЃС‚РЅР°СЏ", "РЅР°РёРІРЅР°СЏ", "С‚РІРѕСЂС‡РµСЃРєР°СЏ"],
    description: "РЎС‚СѓРґРµРЅС‚РєР°-РјСѓР·С‹РєР°РЅС‚, РЅРµРґР°РІРЅРѕ РїСЂРёРµС…Р°Р»Р° РІ РіРѕСЂРѕРґ. Р•С‰С‘ РЅРµ Р·РЅР°РµС‚ РјРµСЃС‚РЅС‹С… РёРЅС‚СЂРёРі.",
    currentPlan: "РќР°Р№С‚Рё РјРµСЃС‚Рѕ РґР»СЏ СЂРµРїРµС‚РёС†РёРё Рё РїРѕР·РЅР°РєРѕРјРёС‚СЊСЃСЏ СЃ Р»СЋРґСЊРјРё",
    memories: [
      "Р“РѕСЂРѕРґ РїРѕРєР°Р·Р°Р»СЃСЏ РєСЂР°СЃРёРІС‹Рј, РЅРѕ СЃС‚СЂР°РЅРЅС‹Рј",
      "РњР°СЂРёРЅР° СѓР»С‹Р±РЅСѓР»Р°СЃСЊ РµР№ РЅР° СѓР»РёС†Рµ",
      "РЈСЃР»С‹С€Р°Р»Р° РіСЂРѕРјРєРёР№ СЃРїРѕСЂ РЅР° РїР»РѕС‰Р°РґРё",
    ],
  },
]

export const MOCK_EVENTS: AgentEvent[] = [
  {
    id: "evt-1",
    agentId: "agent-1",
    agentName: "РђР»РµРєСЃРµР№",
    type: "chat",
    text: "РџСЂРёРІРµС‚, РњР°СЂРёРЅР°! РљР°Рє С‚РІРѕСЏ РЅРѕРІР°СЏ РєР°СЂС‚РёРЅР°?",
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: "evt-2",
    agentId: "agent-2",
    agentName: "РњР°СЂРёРЅР°",
    type: "emotion",
    text: "РџРѕС‡СѓРІСЃС‚РІРѕРІР°Р»Р° РїСЂРёР»РёРІ РІРґРѕС…РЅРѕРІРµРЅРёСЏ РѕС‚ Р·Р°РєР°С‚Р°",
    timestamp: new Date(Date.now() - 240000).toISOString(),
  },
  {
    id: "evt-3",
    agentId: "agent-3",
    agentName: "Р’РёРєС‚РѕСЂ",
    type: "action",
    text: "РћС‚РїСЂР°РІРёР»СЃСЏ РЅР° РїР»РѕС‰Р°РґСЊ, С‡С‚РѕР±С‹ РЅР°Р№С‚Рё РђР»РµРєСЃРµСЏ",
    timestamp: new Date(Date.now() - 180000).toISOString(),
  },
  {
    id: "evt-4",
    agentId: "agent-4",
    agentName: "Р•Р»РµРЅР°",
    type: "chat",
    text: "Р’РёРєС‚РѕСЂ, РґР°РІР°Р№ РїРѕРіРѕРІРѕСЂРёРј СЃРїРѕРєРѕР№РЅРѕ. РЇ СѓРІРµСЂРµРЅР°, РІС‹ СЃ РђР»РµРєСЃРµРµРј РЅР°Р№РґС‘С‚Рµ РѕР±С‰РёР№ СЏР·С‹Рє.",
    timestamp: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: "evt-5",
    agentId: "agent-3",
    agentName: "Р’РёРєС‚РѕСЂ",
    type: "emotion",
    text: "Р Р°Р·РґСЂР°Р¶С‘РЅ: Р•Р»РµРЅР° СЃРЅРѕРІР° Р»РµР·РµС‚ РЅРµ РІ СЃРІРѕС‘ РґРµР»Рѕ",
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: "evt-6",
    agentId: "agent-1",
    agentName: "РђР»РµРєСЃРµР№",
    type: "action",
    text: "Р—Р°С€С‘Р» РІ Р±РёР±Р»РёРѕС‚РµРєСѓ Рё РЅР°С€С‘Р» РёРЅС‚РµСЂРµСЃРЅСѓСЋ РєРЅРёРіСѓ РѕР± РёСЃС‚РѕСЂРёРё РіРѕСЂРѕРґР°",
    timestamp: new Date(Date.now() - 30000).toISOString(),
  },
  {
    id: "evt-7",
    agentId: "agent-2",
    agentName: "РњР°СЂРёРЅР°",
    type: "action",
    text: "РџРѕСЃС‚Р°РІРёР»Р° РјРѕР»СЊР±РµСЂС‚ Сѓ СЂРµРєРё Рё РЅР°С‡Р°Р»Р° СЂРёСЃРѕРІР°С‚СЊ",
    timestamp: new Date(Date.now() - 15000).toISOString(),
  },
  {
    id: "evt-8",
    agentId: "agent-4",
    agentName: "Р•Р»РµРЅР°",
    type: "system",
    text: "Р РµС€РёР»Р° РѕСЂРіР°РЅРёР·РѕРІР°С‚СЊ РѕР±С‰РёР№ СѓР¶РёРЅ СЃРµРіРѕРґРЅСЏ РІРµС‡РµСЂРѕРј",
    timestamp: new Date(Date.now() - 5000).toISOString(),
  },
  {
    id: "evt-9",
    agentId: "agent-5",
    agentName: "Р”РјРёС‚СЂРёР№",
    type: "action",
    text: "РќР°С€С‘Р» РѕР±РіРѕСЂРµРІС€РёР№ РґРЅРµРІРЅРёРє СЃСЂРµРґРё СЂСѓРёРЅ Р»Р°Р±РѕСЂР°С‚РѕСЂРёРё",
    timestamp: new Date(Date.now() - 280000).toISOString(),
  },
  {
    id: "evt-10",
    agentId: "agent-6",
    agentName: "РћР»СЊРіР°",
    type: "emotion",
    text: "РўСЂРµРІРѕРіР° РЅР°СЂР°СЃС‚Р°РµС‚ -- РєС‚Рѕ-С‚Рѕ РѕРїСЂРµРґРµР»С‘РЅРЅРѕ СЃР»РµРґРёС‚",
    timestamp: new Date(Date.now() - 200000).toISOString(),
  },
  {
    id: "evt-11",
    agentId: "agent-7",
    agentName: "РРіРѕСЂСЊ",
    type: "action",
    text: "РћС‚РєСЂС‹Р» СЃС‚Р°СЂС‹Р№ Р°СЂС…РёРІ РІ РїРѕРґРІР°Р»Рµ Р±РёР±Р»РёРѕС‚РµРєРё",
    timestamp: new Date(Date.now() - 150000).toISOString(),
  },
  {
    id: "evt-12",
    agentId: "agent-8",
    agentName: "РќР°СЃС‚СЏ",
    type: "chat",
    text: "РџСЂРѕСЃС‚РёС‚Рµ, РІС‹ РЅРµ РїРѕРґСЃРєР°Р¶РµС‚Рµ, РіРґРµ С‚СѓС‚ РјРѕР¶РЅРѕ РїРѕСЂРµРїРµС‚РёСЂРѕРІР°С‚СЊ?",
    timestamp: new Date(Date.now() - 90000).toISOString(),
  },
]

export const MOCK_RELATIONSHIPS: Relationship[] = [
  // РђР»РµРєСЃРµР№
  { from: "agent-1", to: "agent-2", sentiment: 0.7, label: "РґСЂСѓР¶Р±Р°" },
  { from: "agent-1", to: "agent-3", sentiment: -0.4, label: "РєРѕРЅС„Р»РёРєС‚" },
  { from: "agent-1", to: "agent-7", sentiment: 0.4, label: "СѓРІР°Р¶РµРЅРёРµ" },
  // РњР°СЂРёРЅР°
  { from: "agent-2", to: "agent-5", sentiment: 0.3, label: "СЃРѕС‡СѓРІСЃС‚РІРёРµ" },
  { from: "agent-2", to: "agent-8", sentiment: 0.5, label: "СЃРёРјРїР°С‚РёСЏ" },
  // Р’РёРєС‚РѕСЂ
  { from: "agent-3", to: "agent-4", sentiment: -0.2, label: "СЂР°Р·РґСЂР°Р¶РµРЅРёРµ" },
  { from: "agent-3", to: "agent-7", sentiment: -0.3, label: "РЅРµРїСЂРёСЏР·РЅСЊ" },
  // Р•Р»РµРЅР°
  { from: "agent-4", to: "agent-6", sentiment: 0.4, label: "С‚РѕСЂРіРѕРІР»СЏ" },
  { from: "agent-4", to: "agent-1", sentiment: 0.5, label: "Р·РЅР°РєРѕРјС‹Рµ" },
  // РћР»СЊРіР°
  { from: "agent-6", to: "agent-3", sentiment: -0.1, label: "РїРѕРґРѕР·СЂРµРЅРёРµ" },
  // РРіРѕСЂСЊ -- РѕРґРёРЅРѕС‡РєР°, РјР°Р»Рѕ СЃРІСЏР·РµР№
  // РќР°СЃС‚СЏ -- РЅРѕРІРµРЅСЊРєР°СЏ, С‚РѕР»СЊРєРѕ РѕРґРЅР° СЃРІСЏР·СЊ
  { from: "agent-8", to: "agent-1", sentiment: 0.2, label: "Р·РЅР°РєРѕРјС‹Рµ" },
  // Р”РјРёС‚СЂРёР№ -- Р·Р°С‚РІРѕСЂРЅРёРє, РїРѕС‡С‚Рё РЅРµС‚ СЃРІСЏР·РµР№
  { from: "agent-5", to: "agent-7", sentiment: 0.2, label: "СЃРѕСЃРµРґРё" },
]

export const MOCK_STATS: WorldStats = {
  totalEvents: 847,
  totalConversations: 234,
  avgMood: 0.62,
  mostActiveAgent: "РђР»РµРєСЃРµР№",
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

// ===== Р”РћРЎРўРЈРџ Рљ Р”РђРќРќР«Рњ (Р·Р°РјРµРЅРё РЅР° СЂРµР°Р»СЊРЅС‹Рµ Р·Р°РїСЂРѕСЃС‹) =====

interface BackendPersonalityTraits {
  openness?: number
  conscientiousness?: number
  extraversion?: number
  agreeableness?: number
  neuroticism?: number
}

interface BackendAgentDto {
  agentId: string
  userId: string
  name: string
  model: string
  status: string
  state: string
  energy: number
  personalityTraits?: BackendPersonalityTraits
  description?: string
  emotion?: string
  traits?: string[]
  memories?: string[]
  currentPlan?: string
}

interface BackendEventDto {
  id: string
  userId?: string
  type: string
  payload: unknown
  createdAt: string
}

interface BackendRelationshipDto {
  from: string
  to: string
  sentiment: number
  label?: string
}

interface BackendWorldStatsDto {
  totalEvents: number
  totalConversations: number
  avgMood: number
  mostActiveAgent: string
  topRelationship: { from: string; to: string; sentiment: number }
  eventsByType: { type: string; count: number }[]
  moodDistribution: { mood: string; count: number }[]
}

interface BackendWorldTimeDto {
  gameTime: string
  speed: number
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

function toMood(status: string, energyRaw: number, emotionRaw?: string): Mood {
  const statusLower = status.toLowerCase()
  const emotion = emotionRaw?.trim().toLowerCase() ?? ""
  const energy = Number.isFinite(energyRaw) ? Math.max(0, Math.min(1, energyRaw)) : 0.5

  if (emotion.includes("СЂР°РґРѕСЃС‚") || emotion.includes("СЃС‡Р°СЃС‚") || emotion.includes("РІРґРѕС…РЅРѕРІ") || emotion.includes("РІРѕРѕРґСѓС€")) return "happy"
  if (emotion.includes("СЃРїРѕРєРѕР№") || emotion.includes("РЅРµР№С‚СЂР°Р»")) return "neutral"
  if (emotion.includes("СѓСЃС‚Р°Р»") || emotion.includes("РіСЂСѓСЃС‚")) return "sad"
  if (emotion.includes("СЂР°Р·РґСЂР°Р¶") || emotion.includes("Р·Р»")) return "angry"
  if (emotion.includes("С‚СЂРµРІРѕРі") || emotion.includes("РЅР°РїСЂСЏР¶")) return "anxious"

  if (statusLower.includes("error") || statusLower.includes("failed")) return "angry"
  if (statusLower.includes("stop") || statusLower.includes("archived")) return "sad"
  if (statusLower.includes("pause")) return "anxious"
  if (energy >= 0.8) return "excited"
  if (energy >= 0.6) return "happy"
  if (energy >= 0.4) return "neutral"
  if (energy >= 0.2) return "anxious"
  return "sad"
}

function toTraits(traits?: BackendPersonalityTraits, explicitTraits?: string[]): string[] {
  if (explicitTraits && explicitTraits.length > 0) {
    return explicitTraits.slice(0, 8)
  }

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
  const mood = toMood(agent.status, agent.energy, agent.emotion)
  const traits = toTraits(agent.personalityTraits, agent.traits)
  const memories =
    agent.memories && agent.memories.length > 0
      ? agent.memories
      : agent.state
        ? [`Current state: ${agent.state}`]
        : []
  return {
    id: agent.agentId,
    name: agent.name,
    avatar: agent.name?.trim()?.charAt(0)?.toUpperCase() || "?",
    mood,
    traits,
    description: agent.description?.trim() || `${agent.model} • status: ${agent.status}`,
    currentPlan: agent.currentPlan?.trim() || agent.state || "No current plan",
    memories,
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

function normalizeMood(rawMood: string): Mood {
  const mood = rawMood.trim().toLowerCase()
  if (mood === "happy" || mood === "neutral" || mood === "sad" || mood === "angry" || mood === "excited" || mood === "anxious") {
    return mood
  }

  return "neutral"
}

function mapBackendStats(stats: BackendWorldStatsDto): WorldStats {
  return {
    totalEvents: stats.totalEvents,
    totalConversations: stats.totalConversations,
    avgMood: stats.avgMood,
    mostActiveAgent: stats.mostActiveAgent,
    topRelationship: stats.topRelationship,
    eventsByType: stats.eventsByType,
    moodDistribution: stats.moodDistribution.map((item) => ({
      mood: normalizeMood(item.mood),
      count: item.count,
    })),
  }
}

export interface WorldTime {
  gameTime: string
  speed: number
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

export async function generateAgentWithAi(prompt: string, model?: string): Promise<Agent | null> {
  const trimmedPrompt = prompt.trim()
  if (!trimmedPrompt) {
    return null
  }

  const payload = {
    prompt: trimmedPrompt,
    model: model?.trim() || undefined,
  }

  try {
    const created = await backendRequest<BackendAgentDto>("/api/user-agents/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    })

    return mapBackendAgent(created)
  } catch (error) {
    console.warn("[data] generateAgentWithAi failed", error)
    return null
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
    const relationships = await backendRequest<BackendRelationshipDto[]>("/api/relationships")
    return relationships.map((relationship) => ({
      from: relationship.from,
      to: relationship.to,
      sentiment: relationship.sentiment,
      label: relationship.label ?? "interaction",
    }))
  } catch (error) {
    console.warn("[data] getRelationships fallback to mock", error)
    return MOCK_RELATIONSHIPS
  }
}

export async function getStats(): Promise<WorldStats> {
  try {
    const stats = await backendRequest<BackendWorldStatsDto>("/api/stats")
    return mapBackendStats(stats)
  } catch (error) {
    console.warn("[data] getStats fallback to mock", error)
    return MOCK_STATS
  }
}

export async function getWorldTime(): Promise<WorldTime | null> {
  try {
    const worldTime = await backendRequest<BackendWorldTimeDto>("/api/world/time")
    return {
      gameTime: worldTime.gameTime,
      speed: worldTime.speed,
    }
  } catch (error) {
    console.warn("[data] getWorldTime failed", error)
    return null
  }
}

export async function setWorldTimeSpeed(speed: number): Promise<WorldTime | null> {
  try {
    const updated = await backendRequest<BackendWorldTimeDto>("/api/world/time/speed", {
      method: "POST",
      body: JSON.stringify({ speed }),
    })
    return {
      gameTime: updated.gameTime,
      speed: updated.speed,
    }
  } catch (error) {
    console.warn("[data] setWorldTimeSpeed failed", error)
    return null
  }
}

export async function advanceWorldTime(minutes: number): Promise<WorldTime | null> {
  try {
    const updated = await backendRequest<BackendWorldTimeDto>("/api/world/time/advance", {
      method: "POST",
      body: JSON.stringify({ minutes }),
    })
    return {
      gameTime: updated.gameTime,
      speed: updated.speed,
    }
  } catch (error) {
    console.warn("[data] advanceWorldTime failed", error)
    return null
  }
}


