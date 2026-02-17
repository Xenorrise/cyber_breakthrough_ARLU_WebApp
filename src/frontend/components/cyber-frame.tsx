"use client"

import { useEffect, useState } from "react"

const TABS = [
  { id: "graph", label: "ГРАФ" },
  { id: "events", label: "СОБЫТИЯ" },
  { id: "log", label: "ЛОГ" },
  { id: "agents", label: "АГЕНТЫ" },
  { id: "messages", label: "СООБЩЕНИЯ" },
] as const

export type TabId = (typeof TABS)[number]["id"]

const DEFAULT_SPEED = 1

export function CyberFrame({
  children,
  activeTab = "events",
  onTabChange,
  onAddEvent,
  timeSpeed = 1,
  onTimeSpeedChange,
}: {
  children: React.ReactNode
  activeTab?: TabId
  onTabChange?: (tab: TabId) => void
  onAddEvent?: (text: string) => void
  timeSpeed?: number
  onTimeSpeedChange?: (speed: number) => void
}) {
  const [time, setTime] = useState("")
  const [eventText, setEventText] = useState("")
  const [speedHover, setSpeedHover] = useState(false)

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const handleSubmitEvent = () => {
    if (eventText.trim() && onAddEvent) {
      onAddEvent(eventText.trim())
      setEventText("")
    }
  }

  return (
    <div className="relative h-screen w-screen bg-background overflow-hidden flex flex-col">
      {/* Scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-50"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(229,195,75,0.008) 2px, rgba(229,195,75,0.008) 4px)",
        }}
      />

      {/* SVG frame */}
      <svg
        className="pointer-events-none absolute inset-0 z-40 h-full w-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-strong">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Main border */}
        <path
          d={`
            M 80 20
            L 1840 20
            L 1900 80
            L 1900 1000
            L 1840 1060
            L 80 1060
            L 20 1000
            L 20 80
            Z
          `}
          stroke="var(--cyber-glow)"
          strokeWidth="2"
          filter="url(#glow)"
          opacity="0.8"
        />

        {/* Inner border */}
        <path
          d={`
            M 90 30
            L 1830 30
            L 1890 90
            L 1890 990
            L 1830 1050
            L 90 1050
            L 30 990
            L 30 90
            Z
          `}
          stroke="var(--cyber-glow)"
          strokeWidth="0.5"
          opacity="0.3"
        />

        {/* Corner accents */}
        <path d="M 20 130 L 20 80 L 80 20" stroke="var(--cyber-glow)" strokeWidth="3" filter="url(#glow-strong)" strokeLinecap="square" />
        <path d="M 1840 20 L 1900 80 L 1900 130" stroke="var(--cyber-glow)" strokeWidth="3" filter="url(#glow-strong)" strokeLinecap="square" />
        <path d="M 1900 950 L 1900 1000 L 1840 1060" stroke="var(--cyber-glow)" strokeWidth="3" filter="url(#glow-strong)" strokeLinecap="square" />
        <path d="M 80 1060 L 20 1000 L 20 950" stroke="var(--cyber-glow)" strokeWidth="3" filter="url(#glow-strong)" strokeLinecap="square" />

        {/* Top tick marks */}
        {[200, 400, 600, 1320, 1520, 1720].map((x) => (
          <line key={x} x1={x} y1={20} x2={x} y2={30} stroke="var(--cyber-glow)" strokeWidth="1" opacity="0.4" />
        ))}
      </svg>

      {/* Side indicators */}
      <div className="absolute left-2.5 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-1.5">
        {[0.9, 0.7, 0.5, 0.3].map((opacity, i) => (
          <div
            key={i}
            className="h-5 w-1.5 rounded-sm"
            style={{
              backgroundColor: "var(--cyber-glow)",
              opacity,
              boxShadow: "0 0 4px var(--cyber-glow-dim)",
            }}
          />
        ))}
      </div>
      <div className="absolute right-2.5 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-1.5">
        {[0.3, 0.5, 0.7, 0.9].map((opacity, i) => (
          <div
            key={i}
            className="h-5 w-1.5 rounded-sm"
            style={{
              backgroundColor: "var(--cyber-glow)",
              opacity,
              boxShadow: "0 0 4px var(--cyber-glow-dim)",
            }}
          />
        ))}
      </div>

      {/* ============================================= */}
      {/* MAIN CONTENT ZONE                             */}
      {/* ============================================= */}
      <div className="relative z-10 flex flex-col h-full px-12 pt-8 pb-6">
        {/* HEADER */}
        <header className="flex items-center justify-between pb-3 shrink-0">
          {/* Left: title + clock */}
          <div className="flex items-center gap-4">
            <h1
              className="font-mono text-lg tracking-[0.2em] uppercase"
              style={{ color: "var(--cyber-glow)" }}
            >
              LONG LIVE MODELS
            </h1>
            <span
              className="font-mono text-xs tabular-nums"
              style={{ color: "var(--cyber-glow)", opacity: 0.5 }}
            >
              {time}
            </span>
          </div>

          {/* Right: nav tabs + speed control */}
          <div className="flex items-center gap-5">
            <nav className="flex items-center gap-0.5">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange?.(tab.id)}
                    className="cyber-tab-btn group relative px-3.5 py-2 font-mono text-xs tracking-widest uppercase cursor-pointer"
                    style={{
                      color: isActive ? "var(--cyber-glow)" : "var(--muted-foreground)",
                      backgroundColor: isActive ? "rgba(229,195,75,0.1)" : "transparent",
                      borderBottom: isActive ? "1px solid var(--cyber-glow)" : "1px solid transparent",
                      textShadow: isActive ? "0 0 10px rgba(229,195,75,0.4)" : "none",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = "var(--cyber-glow)"
                        e.currentTarget.style.backgroundColor = "rgba(229,195,75,0.06)"
                        e.currentTarget.style.textShadow = "0 0 10px rgba(229,195,75,0.3)"
                        e.currentTarget.style.borderBottom = "1px solid rgba(229,195,75,0.4)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = "var(--muted-foreground)"
                        e.currentTarget.style.backgroundColor = "transparent"
                        e.currentTarget.style.textShadow = "none"
                        e.currentTarget.style.borderBottom = "1px solid transparent"
                      }
                    }}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </nav>

            {/* Speed control */}
            <div
              className="relative flex items-center gap-3 px-3.5 py-1.5"
              style={{
                backgroundColor: "rgba(229,195,75,0.04)",
                border: "1px solid rgba(229,195,75,0.1)",
                clipPath: "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)",
              }}
              onMouseEnter={() => setSpeedHover(true)}
              onMouseLeave={() => setSpeedHover(false)}
            >
              <span
                className="font-mono text-[10px] tracking-widest uppercase select-none"
                style={{ color: "var(--muted-foreground)" }}
              >
                {"СКОРОСТЬ"}
              </span>

              <input
                type="range"
                min={0}
                max={5}
                step={0.1}
                value={timeSpeed}
                onChange={(e) => onTimeSpeedChange?.(Math.round(parseFloat(e.target.value) * 10) / 10)}
                className="cyber-slider w-32 h-1"
                style={{
                  background: `linear-gradient(to right, var(--cyber-glow) ${(timeSpeed / 5) * 100}%, var(--border) ${(timeSpeed / 5) * 100}%)`,
                }}
              />

              <button
                onClick={() => onTimeSpeedChange?.(DEFAULT_SPEED)}
                className="font-mono text-sm tabular-nums text-right cursor-pointer"
                title={"Клик = сброс на " + DEFAULT_SPEED + "x"}
                style={{
                  color: "var(--cyber-glow)",
                  textShadow: timeSpeed > 0 ? "0 0 8px rgba(229,195,75,0.4)" : "none",
                  background: "none",
                  border: "none",
                  padding: 0,
                  width: "3.2em",
                  transition: "opacity 0.2s ease, text-shadow 0.2s ease",
                  opacity: timeSpeed === DEFAULT_SPEED ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textShadow = "0 0 14px rgba(229,195,75,0.7)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textShadow = timeSpeed > 0 ? "0 0 8px rgba(229,195,75,0.4)" : "none"
                }}
              >
                {timeSpeed.toFixed(1)}x
              </button>

              {/* Tooltip */}
              {speedHover && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 font-mono text-[10px] tracking-wide whitespace-nowrap pointer-events-none z-50"
                  style={{
                    backgroundColor: "rgba(17,17,24,0.95)",
                    border: "1px solid rgba(229,195,75,0.25)",
                    color: "var(--cyber-glow)",
                    clipPath: "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)",
                  }}
                >
                  {"Скорость течения времени мира // Клик на значение = сброс"}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div
          className="relative flex-1 min-h-0 overflow-hidden rounded-sm border"
          style={{ borderColor: "rgba(229,195,75,0.2)" }}
        >
          {children}
        </div>

        {/* BOTTOM PANEL: add event */}
        <div className="shrink-0 pt-3">
          <div
            className="relative overflow-hidden"
            style={{
              clipPath: "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)",
            }}
          >
            <div
              className="flex items-center gap-3 p-1.5"
              style={{
                border: "1px solid rgba(229,195,75,0.2)",
                backgroundColor: "rgba(17,17,24,0.9)",
                animation: "cyber-shimmer 4s ease-in-out infinite",
                clipPath: "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)",
              }}
            >
              {/* Pulsing indicator dot */}
              <div className="shrink-0 pl-2.5">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: "var(--cyber-glow)",
                    boxShadow: "0 0 6px var(--cyber-glow-dim)",
                    animation: "cyber-pulse 2s ease-in-out infinite",
                  }}
                />
              </div>

              <input
                type="text"
                value={eventText}
                onChange={(e) => setEventText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleSubmitEvent()
                  }
                }}
                placeholder="Введите событие для мира агентов..."
                className="flex-1 bg-transparent font-mono text-sm px-2 py-2.5 placeholder:opacity-30 focus:outline-none"
                style={{
                  color: "var(--foreground)",
                  caretColor: "var(--cyber-glow)",
                }}
              />

              <button
                onClick={handleSubmitEvent}
                className="shrink-0 px-5 py-2.5 mr-1.5 font-mono text-[11px] tracking-widest uppercase cursor-pointer"
                style={{
                  backgroundColor: "rgba(229,195,75,0.08)",
                  color: "var(--cyber-glow)",
                  border: "1px solid rgba(229,195,75,0.25)",
                  clipPath: "polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(229,195,75,0.18)"
                  e.currentTarget.style.borderColor = "rgba(229,195,75,0.6)"
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(229,195,75,0.15), inset 0 0 12px rgba(229,195,75,0.06)"
                  e.currentTarget.style.textShadow = "0 0 10px rgba(229,195,75,0.5)"
                  e.currentTarget.style.color = "#f5d96b"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(229,195,75,0.08)"
                  e.currentTarget.style.borderColor = "rgba(229,195,75,0.25)"
                  e.currentTarget.style.boxShadow = "none"
                  e.currentTarget.style.textShadow = "none"
                  e.currentTarget.style.color = "var(--cyber-glow)"
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(229,195,75,0.3)"
                  e.currentTarget.style.transform = "scale(0.97)"
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(229,195,75,0.18)"
                  e.currentTarget.style.transform = "scale(1)"
                }}
              >
                {"ДОБАВИТЬ СОБЫТИЕ"}
              </button>
            </div>

            {/* Corner accent lines on event panel */}
            <div
              className="absolute top-0 left-0 w-4 h-4 pointer-events-none"
              style={{
                borderTop: "1px solid var(--cyber-glow)",
                borderLeft: "1px solid var(--cyber-glow)",
                opacity: 0.5,
                clipPath: "polygon(0 0, 100% 0, 0 100%)",
              }}
            />
            <div
              className="absolute top-0 right-0 w-4 h-4 pointer-events-none"
              style={{
                borderTop: "1px solid var(--cyber-glow)",
                borderRight: "1px solid var(--cyber-glow)",
                opacity: 0.5,
                clipPath: "polygon(0 0, 100% 0, 100% 100%)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
