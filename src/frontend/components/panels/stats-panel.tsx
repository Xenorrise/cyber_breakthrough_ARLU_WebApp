"use client"

import { useState, useEffect } from "react"
import { MOOD_CONFIG, getStats, type WorldStats } from "@/lib/data"

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      className="flex flex-col gap-1 p-4 rounded-sm"
      style={{
        backgroundColor: "rgba(229,195,75,0.03)",
        border: "1px solid rgba(229,195,75,0.1)",
      }}
    >
      <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </span>
      <span className="font-mono text-2xl tabular-nums" style={{ color: "var(--cyber-glow)", textShadow: "0 0 10px rgba(229,195,75,0.3)" }}>
        {value}
      </span>
      {sub && (
        <span className="font-mono text-[10px]" style={{ color: "var(--muted-foreground)" }}>{sub}</span>
      )}
    </div>
  )
}

function BarChart({ items, maxVal }: { items: { label: string; value: number; color: string }[]; maxVal: number }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-wider uppercase shrink-0" style={{ color: "var(--muted-foreground)", width: 80 }}>
            {item.label}
          </span>
          <div className="flex-1 h-5 rounded-sm" style={{ backgroundColor: "rgba(229,195,75,0.06)" }}>
            <div
              className="h-full rounded-sm"
              style={{
                width: `${Math.max((item.value / maxVal) * 100, 2)}%`,
                backgroundColor: item.color,
                opacity: 0.7,
                boxShadow: `0 0 8px ${item.color}40`,
                transition: "width 0.5s ease",
              }}
            />
          </div>
          <span className="font-mono text-xs tabular-nums shrink-0" style={{ color: item.color, width: 36, textAlign: "right" }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function StatsPanel() {
  const [stats, setStats] = useState<WorldStats | null>(null)

  // Грузим статистику -- при подключении БД заменить getStats()
  useEffect(() => {
    let active = true
    getStats().then((loadedStats) => {
      if (active) {
        setStats(loadedStats)
      }
    })

    return () => {
      active = false
    }
  }, [])

  if (!stats) {
    return (
      <div className="flex h-full items-center justify-center font-mono text-xs" style={{ backgroundColor: "var(--cyber-surface)", color: "var(--muted-foreground)" }}>
        Загрузка статистики...
      </div>
    )
  }

  const eventTypeColors: Record<string, string> = {
    chat: "#4ade80",
    action: "#e5c34b",
    emotion: "#c084fc",
    system: "#60a5fa",
  }

  const eventTypeLabels: Record<string, string> = {
    chat: "Чат",
    action: "Действие",
    emotion: "Эмоция",
    system: "Система",
  }

  const maxEventCount = Math.max(1, ...stats.eventsByType.map((e) => e.count))
  const maxMoodCount = Math.max(1, ...stats.moodDistribution.map((m) => m.count))
  const topRelationshipColor =
    stats.topRelationship.sentiment > 0
      ? "#4ade80"
      : stats.topRelationship.sentiment < 0
        ? "#f87171"
        : "var(--muted-foreground)"

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--cyber-surface)" }}>
      <div
        className="shrink-0 flex items-center px-5 py-3 border-b"
        style={{ borderColor: "rgba(229,195,75,0.15)" }}
      >
        <span className="font-mono text-sm tracking-widest uppercase" style={{ color: "var(--cyber-glow)" }}>
          {"СТАТИСТИКА МИРА"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
        {/* Карточки метрик */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Всего событий" value={stats.totalEvents} />
          <StatCard label="Диалогов" value={stats.totalConversations} />
          <StatCard label="Среднее настроение" value={`${(stats.avgMood * 100).toFixed(0)}%`} sub="0% = плохо, 100% = отлично" />
          <StatCard label="Самый активный" value={stats.mostActiveAgent} />
        </div>

        {/* События по типам */}
        <div>
          <h3 className="font-mono text-[10px] tracking-widest uppercase mb-3" style={{ color: "var(--muted-foreground)" }}>
            {"СОБЫТИЯ ПО ТИПАМ"}
          </h3>
          <BarChart
            items={stats.eventsByType.map((e) => ({
              label: eventTypeLabels[e.type] || e.type,
              value: e.count,
              color: eventTypeColors[e.type] || "var(--cyber-glow)",
            }))}
            maxVal={maxEventCount}
          />
        </div>

        {/* Распределение настроений */}
        <div>
          <h3 className="font-mono text-[10px] tracking-widest uppercase mb-3" style={{ color: "var(--muted-foreground)" }}>
            {"РАСПРЕДЕЛЕНИЕ НАСТРОЕНИЙ"}
          </h3>
          <BarChart
            items={stats.moodDistribution.map((m) => ({
              label: MOOD_CONFIG[m.mood].label,
              value: m.count,
              color: MOOD_CONFIG[m.mood].color,
            }))}
            maxVal={maxMoodCount}
          />
        </div>

        {/* Самая сильная связь */}
        <div>
          <h3 className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "var(--muted-foreground)" }}>
            {"САМАЯ СИЛЬНАЯ СВЯЗЬ"}
          </h3>
          <div
            className="flex items-center justify-between px-4 py-3 rounded-sm"
            style={{
              backgroundColor: "rgba(229,195,75,0.04)",
              border: "1px solid rgba(229,195,75,0.15)",
            }}
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm" style={{ color: "var(--foreground)" }}>
                {stats.topRelationship.from}
              </span>
              <span className="font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>{"<->"}</span>
              <span className="font-mono text-sm" style={{ color: "var(--foreground)" }}>
                {stats.topRelationship.to}
              </span>
            </div>
            <span className="font-mono text-sm font-bold" style={{ color: topRelationshipColor }}>
              {stats.topRelationship.sentiment > 0 ? "+" : ""}{(stats.topRelationship.sentiment * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
