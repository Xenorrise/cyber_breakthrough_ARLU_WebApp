"use client"

import { MOCK_AGENTS, MOCK_EVENTS, MOOD_CONFIG, type AgentEvent } from "@/lib/data"

// Типы событий и их стили
const EVENT_TYPE_LABELS: Record<AgentEvent["type"], { label: string; color: string }> = {
  chat:    { label: "ЧАТ",     color: "#4ade80" },
  action:  { label: "ДЕЙСТВИЕ", color: "#e5c34b" },
  emotion: { label: "ЭМОЦИЯ",  color: "#c084fc" },
  system:  { label: "СИСТЕМА", color: "#60a5fa" },
}

// Форматировать время
function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

export function EventsPanel() {
  const events = MOCK_EVENTS
  const agents = MOCK_AGENTS

  return (
    <div className="flex h-full w-full" style={{ backgroundColor: "var(--cyber-surface)" }}>
      {/* Слева: список агентов */}
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

      {/* Справа: лента */}
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
                {/* Timestamp */}
                <span
                  className="shrink-0 font-mono text-[11px] tabular-nums pt-0.5"
                  style={{ color: "var(--muted-foreground)", width: "64px" }}
                >
                  {formatTime(evt.timestamp)}
                </span>

                {/* Type badge */}
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

                {/* Content */}
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
