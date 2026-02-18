"use client"

import { useEffect, useState } from "react"
import {
  HubConnectionBuilder,
  LogLevel,
  type HubConnection,
} from "@microsoft/signalr"
import { MOOD_CONFIG, getAgents, getEvents, type Agent, type AgentEvent } from "@/lib/data"

const DEFAULT_USER_ID = "demo-user"
const REALTIME_EVENT_NAMES = [
  "events.updated",
  "agents.list.updated",
  "agent.status.changed",
  "agent.message",
  "agent.progress",
  "agent.thought",
  "agent.error",
]

const EVENT_TYPE_LABELS: Record<AgentEvent["type"], { label: string; color: string }> = {
  chat: { label: "ЧАТ", color: "#4ade80" },
  action: { label: "ДЕЙСТВИЕ", color: "#e5c34b" },
  emotion: { label: "ЭМОЦИЯ", color: "#c084fc" },
  system: { label: "СИСТЕМА", color: "#60a5fa" },
}

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

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export function EventsPanel({ refreshToken }: { refreshToken?: number }) {
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    let connection: HubConnection | null = null

    const loadData = async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) {
        setLoading(true)
      }

      try {
        const [loadedEvents, loadedAgents] = await Promise.all([
          getEvents({ forceRefresh: true }),
          getAgents({ forceRefresh: true }),
        ])
        if (!active) {
          return
        }

        setEvents(loadedEvents)
        setAgents(loadedAgents)
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
      } catch (error) {
        console.warn("[events-panel] SignalR connection failed, fallback to polling", error)
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
  }, [refreshToken])

  return (
    <div className="flex h-full w-full" style={{ backgroundColor: "var(--cyber-surface)" }}>
      <aside
        className="shrink-0 flex flex-col gap-3 overflow-y-auto border-r py-4 px-3"
        style={{ borderColor: "rgba(229,195,75,0.15)", width: "clamp(160px, 15%, 220px)" }}
      >
        <span
          className="font-mono text-[10px] tracking-widest uppercase px-1"
          style={{ color: "var(--muted-foreground)" }}
        >
          {"АГЕНТЫ ОНЛАЙН"}
        </span>
        {agents.map((agent) => {
          const mc = MOOD_CONFIG[agent.mood]
          return (
            <div
              key={agent.id}
              className="flex items-center gap-2 px-2 py-2 rounded-sm"
              style={{ backgroundColor: "rgba(229,195,75,0.04)" }}
            >
              <div
                className="shrink-0 flex items-center justify-center font-mono text-xs font-bold rounded-sm"
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: "rgba(229,195,75,0.1)",
                  color: mc.color,
                  border: `1px solid ${mc.color}`,
                }}
              >
                {agent.avatar}
              </div>
              <div className="min-w-0">
                <div className="font-mono text-xs truncate" style={{ color: "var(--foreground)" }}>
                  {agent.name}
                </div>
                <div className="font-mono text-[10px]" style={{ color: mc.color }}>
                  {mc.label}
                </div>
              </div>
            </div>
          )
        })}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div
          className="shrink-0 flex items-center justify-between px-4 py-2 border-b"
          style={{ borderColor: "rgba(229,195,75,0.15)" }}
        >
          <span className="font-mono text-sm tracking-widest uppercase" style={{ color: "var(--cyber-glow)" }}>
            {"ЛЕНТА СОБЫТИЙ"}
          </span>
          <span className="font-mono text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            {events.length} {"событий"}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1.5">
          {loading && (
            <div className="font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>
              Загрузка событий...
            </div>
          )}

          {!loading && events.length === 0 && (
            <div className="font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>
              Событий пока нет
            </div>
          )}

          {events.map((evt) => {
            const typeConf = EVENT_TYPE_LABELS[evt.type]
            return (
              <div
                key={evt.id}
                className="group flex items-start gap-3 px-3 py-2.5 rounded-sm"
                style={{
                  backgroundColor: "rgba(229,195,75,0.02)",
                  borderLeft: `2px solid ${typeConf.color}`,
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(229,195,75,0.06)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(229,195,75,0.02)"
                }}
              >
                <span
                  className="shrink-0 font-mono text-[11px] tabular-nums pt-0.5"
                  style={{ color: "var(--muted-foreground)", width: "64px" }}
                >
                  {formatTime(evt.timestamp)}
                </span>

                <span
                  className="shrink-0 font-mono text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded-sm mt-0.5"
                  style={{
                    color: typeConf.color,
                    backgroundColor: `${typeConf.color}15`,
                    border: `1px solid ${typeConf.color}30`,
                  }}
                >
                  {typeConf.label}
                </span>

                <div className="flex-1 min-w-0">
                  <span className="font-mono text-xs font-bold mr-2" style={{ color: "var(--cyber-glow)" }}>
                    {evt.agentName}
                  </span>
                  <span className="font-mono text-xs" style={{ color: "var(--foreground)", opacity: 0.85 }}>
                    {evt.text}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
