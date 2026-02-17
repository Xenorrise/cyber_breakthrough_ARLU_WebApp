"use client"

import { useEffect, useRef, useState } from "react"
import {
  MOOD_CONFIG,
  getAgents,
  getEvents,
  getRelationships,
  type Agent,
  type AgentEvent,
  type Relationship,
} from "@/lib/data"

function AgentDetail({
  agent,
  onBack,
  fromGraph,
  allAgents,
  allEvents,
  allRelationships,
}: {
  agent: Agent
  onBack: () => void
  fromGraph?: boolean
  allAgents: Agent[]
  allEvents: AgentEvent[]
  allRelationships: Relationship[]
}) {
  const mc = MOOD_CONFIG[agent.mood]
  const events = allEvents.filter((e) => e.agentId === agent.id)
  const relations = allRelationships.filter(
    (r) => r.from === agent.id || r.to === agent.id
  )

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--cyber-surface)" }}>
      {/* Header */}
      <div
        className="shrink-0 flex items-center gap-3 px-5 py-3 border-b"
        style={{ borderColor: "rgba(229,195,75,0.15)" }}
      >
        <button
          onClick={onBack}
          className="font-mono text-xs tracking-wider uppercase cursor-pointer"
          style={{
            color: "var(--cyber-glow)",
            padding: "4px 10px",
            border: "1px solid rgba(229,195,75,0.25)",
            backgroundColor: "rgba(229,195,75,0.05)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(229,195,75,0.15)"
            e.currentTarget.style.borderColor = "rgba(229,195,75,0.5)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(229,195,75,0.05)"
            e.currentTarget.style.borderColor = "rgba(229,195,75,0.25)"
          }}
        >
          {fromGraph ? "<- К ГРАФУ" : "<- НАЗАД"}
        </button>
        <span className="font-mono text-sm tracking-widest uppercase" style={{ color: "var(--cyber-glow)" }}>
          {"ДОСЬЕ АГЕНТА"}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
        {/* Profile card */}
        <div className="flex items-start gap-4">
          <div
            className="shrink-0 flex items-center justify-center font-mono text-2xl font-bold rounded-sm"
            style={{
              width: 64,
              height: 64,
              backgroundColor: "rgba(229,195,75,0.1)",
              color: mc.color,
              border: `2px solid ${mc.color}`,
              boxShadow: `0 0 12px ${mc.color}30`,
            }}
          >
            {agent.avatar}
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <h2 className="font-mono text-lg uppercase tracking-wider" style={{ color: "var(--foreground)" }}>
              {agent.name}
            </h2>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: mc.color }} />
              <span className="font-mono text-xs" style={{ color: mc.color }}>{mc.label}</span>
            </div>
            <p className="font-mono text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              {agent.description}
            </p>
          </div>
        </div>

        {/* Traits */}
        <div>
          <h3 className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "var(--muted-foreground)" }}>
            {"ЧЕРТЫ ХАРАКТЕРА"}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {agent.traits.map((t) => (
              <span
                key={t}
                className="font-mono text-[11px] px-2 py-0.5 rounded-sm"
                style={{
                  color: "var(--cyber-glow)",
                  backgroundColor: "rgba(229,195,75,0.08)",
                  border: "1px solid rgba(229,195,75,0.2)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Current plan */}
        <div>
          <h3 className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "var(--muted-foreground)" }}>
            {"ТЕКУЩИЙ ПЛАН"}
          </h3>
          <p className="font-mono text-xs" style={{ color: "var(--foreground)", opacity: 0.9 }}>
            {agent.currentPlan}
          </p>
        </div>

        {/* Relationships */}
        <div>
          <h3 className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "var(--muted-foreground)" }}>
            {"ОТНОШЕНИЯ"}
          </h3>
          <div className="flex flex-col gap-1.5">
            {relations.map((rel, i) => {
              const otherId = rel.from === agent.id ? rel.to : rel.from
              const other = allAgents.find((a) => a.id === otherId)
              const sentColor = rel.sentiment > 0 ? "#4ade80" : rel.sentiment < 0 ? "#f87171" : "#a0a0b0"
              return (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-sm"
                  style={{ backgroundColor: "rgba(229,195,75,0.03)", borderLeft: `2px solid ${sentColor}` }}
                >
                  <span className="font-mono text-xs" style={{ color: "var(--foreground)" }}>
                    {other?.name || otherId}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                      {rel.label}
                    </span>
                    <span className="font-mono text-xs font-bold" style={{ color: sentColor }}>
                      {rel.sentiment > 0 ? "+" : ""}{(rel.sentiment * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Memories */}
        <div>
          <h3 className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "var(--muted-foreground)" }}>
            {"ВОСПОМИНАНИЯ"}
          </h3>
          <div className="flex flex-col gap-1">
            {agent.memories.map((m, i) => (
              <div key={i} className="flex items-start gap-2 py-1">
                <div className="shrink-0 mt-1.5 h-1 w-1 rounded-full" style={{ backgroundColor: "var(--cyber-glow)", opacity: 0.5 }} />
                <span className="font-mono text-xs" style={{ color: "var(--foreground)", opacity: 0.8 }}>{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent events */}
        <div>
          <h3 className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "var(--muted-foreground)" }}>
            {"ПОСЛЕДНИЕ СОБЫТИЯ"}
          </h3>
          <div className="flex flex-col gap-1">
            {events.map((evt) => (
              <div key={evt.id} className="flex items-start gap-2 py-1.5 px-2 rounded-sm" style={{ backgroundColor: "rgba(229,195,75,0.02)" }}>
                <span className="shrink-0 font-mono text-[10px] tabular-nums" style={{ color: "var(--muted-foreground)", width: 56 }}>
                  {new Date(evt.timestamp).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="font-mono text-xs" style={{ color: "var(--foreground)", opacity: 0.8 }}>{evt.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AgentsPanel({
  preSelectedAgentId,
  onClearSelection,
  fromGraph,
}: {
  preSelectedAgentId?: string | null
  onClearSelection?: () => void
  fromGraph?: boolean
}) {
  const [selectedId, setSelectedId] = useState<string | null>(preSelectedAgentId ?? null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    Promise.all([getAgents(), getEvents(), getRelationships()])
      .then(([loadedAgents, loadedEvents, loadedRelationships]) => {
        if (!active) return
        setAgents(loadedAgents)
        setEvents(loadedEvents)
        setRelationships(loadedRelationships)
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  // Синхро с внешним выбором (из клика на ноду)
  const prevPreSelected = useRef(preSelectedAgentId)
  if (preSelectedAgentId && preSelectedAgentId !== prevPreSelected.current) {
    prevPreSelected.current = preSelectedAgentId
    if (selectedId !== preSelectedAgentId) {
      setSelectedId(preSelectedAgentId)
    }
  }

  const selected = agents.find((a) => a.id === selectedId)

  if (selected) {
    return (
      <AgentDetail
        agent={selected}
        allAgents={agents}
        allEvents={events}
        allRelationships={relationships}
        onBack={() => {
          setSelectedId(null)
          onClearSelection?.()
        }}
        fromGraph={fromGraph}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center font-mono text-xs" style={{ backgroundColor: "var(--cyber-surface)", color: "var(--muted-foreground)" }}>
        Загрузка агентов...
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="flex h-full items-center justify-center font-mono text-xs" style={{ backgroundColor: "var(--cyber-surface)", color: "var(--muted-foreground)" }}>
        Агентов пока нет
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--cyber-surface)" }}>
      <div
        className="shrink-0 flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: "rgba(229,195,75,0.15)" }}
      >
        <span className="font-mono text-sm tracking-widest uppercase" style={{ color: "var(--cyber-glow)" }}>
          {"СПИСОК АГЕНТОВ"}
        </span>
        <span className="font-mono text-[10px]" style={{ color: "var(--muted-foreground)" }}>
          {agents.length} {"агентов"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-3 auto-rows-min">
        {agents.map((agent) => {
          const mc = MOOD_CONFIG[agent.mood]
          return (
            <button
              key={agent.id}
              onClick={() => setSelectedId(agent.id)}
              className="text-left p-4 rounded-sm cursor-pointer flex items-start gap-3"
              style={{
                backgroundColor: "rgba(229,195,75,0.03)",
                border: "1px solid rgba(229,195,75,0.1)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(229,195,75,0.08)"
                e.currentTarget.style.borderColor = "rgba(229,195,75,0.3)"
                e.currentTarget.style.boxShadow = "0 0 12px rgba(229,195,75,0.06)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(229,195,75,0.03)"
                e.currentTarget.style.borderColor = "rgba(229,195,75,0.1)"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <div
                className="shrink-0 flex items-center justify-center font-mono text-lg font-bold rounded-sm"
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: "rgba(229,195,75,0.08)",
                  color: mc.color,
                  border: `1px solid ${mc.color}`,
                }}
              >
                {agent.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm uppercase" style={{ color: "var(--foreground)" }}>
                    {agent.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: mc.color }} />
                    <span className="font-mono text-[10px]" style={{ color: mc.color }}>{mc.label}</span>
                  </div>
                </div>
                <p className="font-mono text-[11px] mt-1 line-clamp-2" style={{ color: "var(--muted-foreground)" }}>
                  {agent.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {agent.traits.map((t) => (
                    <span
                      key={t}
                      className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm"
                      style={{
                        color: "var(--cyber-glow)",
                        backgroundColor: "rgba(229,195,75,0.06)",
                        border: "1px solid rgba(229,195,75,0.15)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
