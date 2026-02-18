"use client"

import { useEffect, useMemo, useState } from "react"
import {
  HubConnectionBuilder,
  LogLevel,
  type HubConnection,
} from "@microsoft/signalr"
import {
  MOOD_CONFIG,
  broadcastAgentCommand,
  commandAgent,
  getAgentMessages,
  getAgents,
  getAllAgentMessages,
  type Agent,
  type AgentConversationMessage,
} from "@/lib/data"

const DEFAULT_USER_ID = "demo-user"
const ALL_AGENTS_TARGET = "__all_agents__"
const REALTIME_EVENT_NAMES = [
  "agents.list.updated",
  "agent.status.changed",
  "agent.message",
  "agent.progress",
  "agent.error",
]

type MessageMode = "ask" | "nudge"

function getRealtimeBackendBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL?.trim()
  if (raw && raw.length > 0) {
    return raw.replace(/\/+$/, "")
  }

  return "http://localhost:5133"
}

function getUserId(): string {
  const fromEnv = process.env.NEXT_PUBLIC_USER_ID?.trim()
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_USER_ID
}

function formatMessageTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function renderMessagePreview(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim()
  if (compact.length <= 42) {
    return compact
  }

  return `${compact.slice(0, 39)}...`
}

export function MessagesPanel({ refreshToken }: { refreshToken?: number }) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedTarget, setSelectedTarget] = useState<string>(ALL_AGENTS_TARGET)
  const [messages, setMessages] = useState<AgentConversationMessage[]>([])
  const [messageMode, setMessageMode] = useState<MessageMode>("ask")
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastAck, setLastAck] = useState<string | null>(null)

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedTarget),
    [agents, selectedTarget]
  )

  useEffect(() => {
    let active = true
    let connection: HubConnection | null = null

    const loadData = async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) {
        setLoading(true)
      }

      try {
        const loadedAgents = await getAgents()
        if (!active) {
          return
        }

        setAgents(loadedAgents)

        const nextTarget =
          selectedTarget === ALL_AGENTS_TARGET || loadedAgents.some((agent) => agent.id === selectedTarget)
            ? selectedTarget
            : (loadedAgents[0]?.id ?? ALL_AGENTS_TARGET)

        if (nextTarget !== selectedTarget) {
          setSelectedTarget(nextTarget)
        }

        const loadedMessages =
          nextTarget === ALL_AGENTS_TARGET
            ? await getAllAgentMessages(20)
            : await getAgentMessages(nextTarget, 120)

        if (!active) {
          return
        }

        setMessages(
          loadedMessages
            .slice()
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        )
      } finally {
        if (active && !silent) {
          setLoading(false)
        }
      }
    }

    const handleRealtimeUpdate = () => {
      if (!active) {
        return
      }

      void loadData({ silent: true })
    }

    const startRealtime = async () => {
      const backendBaseUrl = getRealtimeBackendBaseUrl()
      const userId = getUserId()
      const hubUrl = `${backendBaseUrl}/hubs/agents?userId=${encodeURIComponent(userId)}`

      connection = new HubConnectionBuilder()
        .withUrl(hubUrl)
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Error)
        .build()

      for (const eventName of REALTIME_EVENT_NAMES) {
        connection.on(eventName, handleRealtimeUpdate)
      }

      connection.onreconnected(() => {
        if (!active) {
          return
        }

        void connection?.invoke("SubscribeUser").catch(() => undefined)
        void loadData({ silent: true })
      })

      try {
        await connection.start()
        if (!active) {
          return
        }

        await connection.invoke("SubscribeUser")
      } catch (realtimeError) {
        console.warn("[messages-panel] SignalR connection failed, fallback to polling", realtimeError)
      }
    }

    void loadData()
    void startRealtime()

    const pollingTimer = setInterval(() => {
      void loadData({ silent: true })
    }, 5000)

    return () => {
      active = false
      clearInterval(pollingTimer)

      if (!connection) {
        return
      }

      for (const eventName of REALTIME_EVENT_NAMES) {
        connection.off(eventName, handleRealtimeUpdate)
      }

      void connection.stop()
    }
  }, [refreshToken, selectedTarget])

  const handleSend = async () => {
    const text = draft.trim()
    if (!text || sending) {
      return
    }

    setSending(true)
    setError(null)
    setLastAck(null)

    const command = messageMode === "ask" ? "chat.ask" : "action.nudge"

    try {
      if (selectedTarget === ALL_AGENTS_TARGET) {
        const ack = await broadcastAgentCommand(text, { command })
        if (!ack) {
          setError("Не удалось отправить сообщение всем агентам.")
          return
        }

        const rejectedItems = ack.items.filter((item) => item.status.toLowerCase() !== "accepted")
        if (rejectedItems.length > 0) {
          setLastAck(`Отправлено: ${ack.acceptedCount}, отклонено: ${ack.rejectedCount}.`)
        } else {
          setLastAck(`Отправлено всем агентам: ${ack.acceptedCount}.`)
        }
      } else {
        const ack = await commandAgent(selectedTarget, text, command)
        if (!ack) {
          setError("Не удалось отправить сообщение выбранному агенту.")
          return
        }

        setLastAck("Сообщение отправлено, агент обрабатывает команду.")
      }

      setDraft("")

      const [freshAgents, freshMessages] = await Promise.all([
        getAgents(),
        selectedTarget === ALL_AGENTS_TARGET
          ? getAllAgentMessages(20)
          : getAgentMessages(selectedTarget, 120),
      ])

      setAgents(freshAgents)
      setMessages(
        freshMessages
          .slice()
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-full w-full" style={{ backgroundColor: "var(--cyber-surface)" }}>
      <aside
        className="shrink-0 border-r px-3 py-4 overflow-y-auto"
        style={{ borderColor: "rgba(229,195,75,0.15)", width: "clamp(220px, 21%, 300px)" }}
      >
        <div className="font-mono text-[10px] tracking-widest uppercase mb-3" style={{ color: "var(--muted-foreground)" }}>
          Диалоги
        </div>

        <button
          onClick={() => setSelectedTarget(ALL_AGENTS_TARGET)}
          className="w-full text-left rounded-sm px-3 py-2 mb-2"
          style={{
            backgroundColor:
              selectedTarget === ALL_AGENTS_TARGET ? "rgba(229,195,75,0.12)" : "rgba(229,195,75,0.05)",
            border:
              selectedTarget === ALL_AGENTS_TARGET
                ? "1px solid rgba(229,195,75,0.4)"
                : "1px solid rgba(229,195,75,0.16)",
          }}
        >
          <div className="font-mono text-xs uppercase" style={{ color: "var(--cyber-glow)" }}>
            Все агенты
          </div>
          <div className="font-mono text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            Общий сигнал и ответы
          </div>
        </button>

        <div className="flex flex-col gap-2">
          {agents.map((agent) => {
            const mood = MOOD_CONFIG[agent.mood]
            const isActive = selectedTarget === agent.id
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedTarget(agent.id)}
                className="w-full text-left rounded-sm px-3 py-2"
                style={{
                  backgroundColor: isActive ? "rgba(229,195,75,0.12)" : "rgba(229,195,75,0.04)",
                  border: isActive
                    ? "1px solid rgba(229,195,75,0.4)"
                    : "1px solid rgba(229,195,75,0.12)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs uppercase" style={{ color: "var(--foreground)" }}>
                    {agent.name}
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: mood.color }}>
                    {mood.label}
                  </span>
                </div>
                <div className="font-mono text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                  {renderMessagePreview(agent.currentPlan)}
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div
          className="shrink-0 border-b px-4 py-3 flex items-center justify-between"
          style={{ borderColor: "rgba(229,195,75,0.15)" }}
        >
          <div className="font-mono text-sm tracking-widest uppercase" style={{ color: "var(--cyber-glow)" }}>
            {selectedTarget === ALL_AGENTS_TARGET
              ? "Сообщения / Все агенты"
              : `Сообщения / ${selectedAgent?.name ?? "Агент"}`}
          </div>
          <div className="font-mono text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            {messages.length} сообщений
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {loading ? (
            <div className="font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>
              Загрузка переписки...
            </div>
          ) : null}

          {!loading && messages.length === 0 ? (
            <div className="font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>
              Пока нет сообщений.
            </div>
          ) : null}

          {messages.map((message) => {
            const isUser = message.role === "user"
            const accent = isUser ? "#e5c34b" : "#4ade80"

            return (
              <div
                key={message.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[82%] rounded-sm px-3 py-2"
                  style={{
                    backgroundColor: isUser ? "rgba(229,195,75,0.08)" : "rgba(74,222,128,0.08)",
                    border: `1px solid ${accent}40`,
                  }}
                >
                  {selectedTarget === ALL_AGENTS_TARGET ? (
                    <div className="font-mono text-[10px] mb-1 uppercase" style={{ color: "var(--cyber-glow)" }}>
                      {message.agentName}
                    </div>
                  ) : null}
                  <div className="font-mono text-xs whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>
                    {message.content}
                  </div>
                  <div className="font-mono text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                    {message.role} • {formatMessageTime(message.timestamp)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div
          className="shrink-0 border-t px-4 py-3"
          style={{ borderColor: "rgba(229,195,75,0.15)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setMessageMode("ask")}
              className="font-mono text-[10px] tracking-widest uppercase px-2 py-1 rounded-sm"
              style={{
                color: messageMode === "ask" ? "var(--cyber-glow)" : "var(--muted-foreground)",
                border:
                  messageMode === "ask"
                    ? "1px solid rgba(229,195,75,0.4)"
                    : "1px solid rgba(229,195,75,0.15)",
                backgroundColor:
                  messageMode === "ask" ? "rgba(229,195,75,0.1)" : "rgba(229,195,75,0.03)",
              }}
            >
              Вопрос
            </button>
            <button
              onClick={() => setMessageMode("nudge")}
              className="font-mono text-[10px] tracking-widest uppercase px-2 py-1 rounded-sm"
              style={{
                color: messageMode === "nudge" ? "var(--cyber-glow)" : "var(--muted-foreground)",
                border:
                  messageMode === "nudge"
                    ? "1px solid rgba(229,195,75,0.4)"
                    : "1px solid rgba(229,195,75,0.15)",
                backgroundColor:
                  messageMode === "nudge" ? "rgba(229,195,75,0.1)" : "rgba(229,195,75,0.03)",
              }}
            >
              Подстрекать к действию
            </button>
          </div>

          <div className="flex gap-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={
                selectedTarget === ALL_AGENTS_TARGET
                  ? "Введите общий сигнал для всех агентов..."
                  : "Введите сообщение агенту..."
              }
              className="flex-1 min-h-[72px] max-h-[180px] rounded-sm p-2 font-mono text-xs outline-none resize-y"
              style={{
                backgroundColor: "rgba(229,195,75,0.04)",
                border: "1px solid rgba(229,195,75,0.2)",
                color: "var(--foreground)",
              }}
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={sending || draft.trim().length === 0}
              className="shrink-0 h-fit font-mono text-xs tracking-widest uppercase px-3 py-2 rounded-sm disabled:cursor-not-allowed"
              style={{
                color: sending ? "var(--muted-foreground)" : "var(--cyber-glow)",
                border: "1px solid rgba(229,195,75,0.35)",
                backgroundColor: sending ? "rgba(229,195,75,0.03)" : "rgba(229,195,75,0.09)",
              }}
            >
              {sending ? "ОТПРАВКА..." : "ОТПРАВИТЬ"}
            </button>
          </div>

          {error ? (
            <div className="font-mono text-[11px] mt-2" style={{ color: "#f87171" }}>
              {error}
            </div>
          ) : null}
          {lastAck ? (
            <div className="font-mono text-[11px] mt-2" style={{ color: "#4ade80" }}>
              {lastAck}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
