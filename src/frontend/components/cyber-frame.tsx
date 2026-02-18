"use client"

import { useEffect, useRef, useState } from "react"

const TABS = [
  { id: "graph", label: "ГРАФ" },
  { id: "events", label: "СОБЫТИЯ" },
  { id: "stats", label: "СТАТИСТИКА" },
  { id: "agents", label: "АГЕНТЫ" },
  { id: "messages", label: "СООБЩЕНИЯ" },
] as const

export type TabId = (typeof TABS)[number]["id"]

const DEFAULT_SPEED = 1

export function CyberFrame({
  children,
  activeTab = "graph",
  onTabChange,
  onAddEvent,
  timeSpeed = 1,
  onTimeSpeedChange,
  onRestartSimulation,
  worldTime,
}: {
  children: React.ReactNode
  activeTab?: TabId
  onTabChange?: (tab: TabId) => void
  onAddEvent?: (text: string) => void
  timeSpeed?: number
  onTimeSpeedChange?: (speed: number) => void
  onRestartSimulation?: () => void
  worldTime?: string | null
}) {
  const [time, setTime] = useState("--:--:--")
  const [date, setDate] = useState("--.--.----")
  const [eventText, setEventText] = useState("")
  const [speedHover, setSpeedHover] = useState(false)
  const [mounted, setMounted] = useState(false)
  const lastNonZeroSpeedRef = useRef(DEFAULT_SPEED)

  const isPaused = timeSpeed <= 0.001

  useEffect(() => {
    if (timeSpeed > 0.001) {
      lastNonZeroSpeedRef.current = timeSpeed
    }
  }, [timeSpeed])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!worldTime) {
      setTime("--:--:--")
      setDate("--.--.----")
      return
    }

    const base = new Date(worldTime)
    if (Number.isNaN(base.getTime())) {
      setTime("--:--:--")
      setDate("--.--.----")
      return
    }

    let virtualTimeMs = base.getTime()
    const speed = Math.max(0, timeSpeed)

    const tick = () => {
      const current = new Date(virtualTimeMs)
      setTime(
        current.toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      )
      setDate(
        current.toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      )

      // 1.0x = 1 in-game minute per real second.
      virtualTimeMs += 1000 * speed * 60
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [worldTime, timeSpeed])

  const handleSubmitEvent = () => {
    if (eventText.trim() && onAddEvent) {
      onAddEvent(eventText.trim())
      setEventText("")
    }
  }

  const handleTogglePause = () => {
    if (!onTimeSpeedChange) {
      return
    }

    if (isPaused) {
      onTimeSpeedChange(Math.max(lastNonZeroSpeedRef.current, DEFAULT_SPEED))
      return
    }

    onTimeSpeedChange(0)
  }

  /* percentage-based paddings: 1.2% top/bottom, 1.5% sides -- scales with any screen */
  const framePad = {
    padding: "1.2% 1.8%",
  }

  return (
    <div
      className="relative w-screen overflow-hidden flex flex-col"
      style={{ height: "100dvh", backgroundColor: "var(--background)" }}
    >
      {/* Scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-50"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(229,195,75,0.008) 2px, rgba(229,195,75,0.008) 4px)",
        }}
      />

      {/* ========== SVG frame (desktop) ========== */}
      <svg
        className="pointer-events-none absolute inset-0 z-40 hidden md:block"
        style={{ width: "100%", height: "100%" }}
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-strong">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Main border */}
        <path
          d="M 30 6 L 970 6 L 994 30 L 994 970 L 970 994 L 30 994 L 6 970 L 6 30 Z"
          stroke="var(--cyber-glow)"
          strokeWidth="1.2"
          filter="url(#glow)"
          opacity="0.8"
        />
        {/* Inner border */}
        <path
          d="M 34 10 L 966 10 L 990 34 L 990 966 L 966 990 L 34 990 L 10 966 L 10 34 Z"
          stroke="var(--cyber-glow)"
          strokeWidth="0.3"
          opacity="0.25"
        />
        {/* Corner accents */}
        <path d="M 6 55 L 6 30 L 30 6" stroke="var(--cyber-glow)" strokeWidth="2" filter="url(#glow-strong)" strokeLinecap="square" />
        <path d="M 970 6 L 994 30 L 994 55" stroke="var(--cyber-glow)" strokeWidth="2" filter="url(#glow-strong)" strokeLinecap="square" />
        <path d="M 994 945 L 994 970 L 970 994" stroke="var(--cyber-glow)" strokeWidth="2" filter="url(#glow-strong)" strokeLinecap="square" />
        <path d="M 30 994 L 6 970 L 6 945" stroke="var(--cyber-glow)" strokeWidth="2" filter="url(#glow-strong)" strokeLinecap="square" />
        {/* Tick marks */}
        {[150, 300, 500, 700, 850].map((x) => (
          <line key={x} x1={x} y1={6} x2={x} y2={12} stroke="var(--cyber-glow)" strokeWidth="0.5" opacity="0.35" />
        ))}
      </svg>

      {/* Mobile border */}
      <div
        className="pointer-events-none absolute inset-[2px] z-40 md:hidden"
        style={{
          border: "1px solid var(--cyber-glow)",
          boxShadow: "0 0 6px var(--cyber-glow-dim), inset 0 0 6px var(--cyber-glow-dim)",
          opacity: 0.5,
        }}
      />

      {/* Side indicators */}
      <div className="absolute left-[0.35%] top-1/2 z-40 -translate-y-1/2 flex-col gap-1 hidden lg:flex">
        {[0.9, 0.7, 0.5, 0.3].map((opacity, i) => (
          <div
            key={i}
            className="rounded-sm"
            style={{
              width: "3px",
              height: "14px",
              backgroundColor: "var(--cyber-glow)",
              opacity,
              boxShadow: "0 0 4px var(--cyber-glow-dim)",
            }}
          />
        ))}
      </div>
      <div className="absolute right-[0.35%] top-1/2 z-40 -translate-y-1/2 flex-col gap-1 hidden lg:flex">
        {[0.3, 0.5, 0.7, 0.9].map((opacity, i) => (
          <div
            key={i}
            className="rounded-sm"
            style={{
              width: "3px",
              height: "14px",
              backgroundColor: "var(--cyber-glow)",
              opacity,
              boxShadow: "0 0 4px var(--cyber-glow-dim)",
            }}
          />
        ))}
      </div>

      {/* ============================================= */}
      {/* MAIN CONTENT -- percentage-based spacing      */}
      {/* ============================================= */}
      <div className="relative z-10 flex flex-col h-full" style={framePad}>

        {/* -------- HEADER -------- */}
        <header className="shrink-0 flex flex-col gap-2 pb-[0.6%]">
          {/* Title row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 pl-[1.5%]">
              <h1
                className="font-mono text-base md:text-lg lg:text-xl tracking-[0.2em] uppercase whitespace-nowrap"
                style={{ color: "var(--cyber-glow)" }}
              >
                LONG LIVE MODELS
              </h1>
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTogglePause}
                    className="font-mono text-[10px] md:text-xs tracking-wider uppercase cursor-pointer"
                    style={{
                      color: isPaused ? "#4ade80" : "#f87171",
                      border: `1px solid ${isPaused ? "rgba(74,222,128,0.45)" : "rgba(248,113,113,0.45)"}`,
                      backgroundColor: isPaused ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
                      padding: "2px 8px",
                      transition: "all 0.2s ease",
                    }}
                    title={isPaused ? "Продолжить течение игрового времени" : "Остановить течение игрового времени"}
                  >
                    {isPaused ? "ПРОДОЛЖИТЬ ВРЕМЯ" : "ОСТАНОВИТЬ ВРЕМЯ"}
                  </button>

                  <button
                    onClick={onRestartSimulation}
                    disabled={!onRestartSimulation}
                    className="font-mono text-[10px] md:text-xs tracking-wider uppercase cursor-pointer disabled:cursor-not-allowed"
                    style={{
                      color: !onRestartSimulation ? "var(--muted-foreground)" : "var(--cyber-glow)",
                      border: "1px solid rgba(229,195,75,0.35)",
                      backgroundColor: !onRestartSimulation ? "rgba(229,195,75,0.03)" : "rgba(229,195,75,0.1)",
                      padding: "2px 8px",
                      transition: "all 0.2s ease",
                    }}
                    title="Полностью сбросить мир и начать симуляцию заново"
                  >
                    НАЧАТЬ ЗАНОВО
                  </button>
                </div>

                <span
                  className="font-mono text-xs md:text-sm tabular-nums whitespace-nowrap"
                  style={{ color: "var(--cyber-glow)", opacity: 0.5 }}
                >
                  {date}
                  <span className="mx-1.5" style={{ opacity: 0.4 }}>{"/"}</span>
                  {time}
                </span>
              </div>
            </div>
          </div>

          {/* Nav row */}
          <div className="flex items-center justify-between">
            <nav className="flex items-center pl-[1.5%]">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange?.(tab.id)}
                    className="font-mono text-sm md:text-base tracking-wider uppercase cursor-pointer whitespace-nowrap"
                    style={{
                      padding: "6px 14px",
                      color: isActive ? "var(--cyber-glow)" : "var(--muted-foreground)",
                      backgroundColor: isActive ? "rgba(229,195,75,0.1)" : "transparent",
                      borderBottom: isActive ? "2px solid var(--cyber-glow)" : "2px solid transparent",
                      textShadow: isActive ? "0 0 10px rgba(229,195,75,0.4)" : "none",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = "var(--cyber-glow)"
                        e.currentTarget.style.backgroundColor = "rgba(229,195,75,0.06)"
                        e.currentTarget.style.textShadow = "0 0 10px rgba(229,195,75,0.3)"
                        e.currentTarget.style.borderBottom = "2px solid rgba(229,195,75,0.4)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = "var(--muted-foreground)"
                        e.currentTarget.style.backgroundColor = "transparent"
                        e.currentTarget.style.textShadow = "none"
                        e.currentTarget.style.borderBottom = "2px solid transparent"
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
              className="relative flex items-center gap-3 shrink-0"
              style={{
                padding: "5px 14px",
                backgroundColor: "rgba(229,195,75,0.04)",
                border: "1px solid rgba(229,195,75,0.1)",
                clipPath: "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)",
              }}
              onMouseEnter={() => setSpeedHover(true)}
              onMouseLeave={() => setSpeedHover(false)}
            >
              <span
                className="font-mono text-xs tracking-widest uppercase select-none"
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
                className="cyber-slider h-1"
                style={{
                  width: "clamp(80px, 8vw, 160px)",
                  background: `linear-gradient(to right, var(--cyber-glow) ${(timeSpeed / 5) * 100}%, var(--border) ${(timeSpeed / 5) * 100}%)`,
                }}
              />

              <button
                onClick={() => onTimeSpeedChange?.(DEFAULT_SPEED)}
                className="font-mono text-sm tabular-nums cursor-pointer"
                title={mounted ? `Клик = сброс на ${DEFAULT_SPEED}x` : undefined}
                style={{
                  color: "var(--cyber-glow)",
                  textShadow: timeSpeed > 0 ? "0 0 8px rgba(229,195,75,0.4)" : "none",
                  background: "none",
                  border: "none",
                  padding: 0,
                  width: "3.5em",
                  textAlign: "right",
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

              {speedHover && (
                <div
                  className="absolute top-full right-0 mt-2 px-3 py-1.5 font-mono text-[10px] tracking-wide whitespace-nowrap pointer-events-none z-50 hidden lg:block"
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

        {/* -------- CONTENT -------- */}
        <div
          className="relative flex-1 min-h-0 overflow-hidden rounded-sm border"
          style={{ borderColor: "rgba(229,195,75,0.2)" }}
        >
          {children}
        </div>

        {/* -------- BOTTOM PANEL -------- */}
        <div className="shrink-0" style={{ paddingTop: "0.6%" }}>
          <div
            className="relative overflow-hidden"
            style={{
              clipPath: "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
            }}
          >
            <div
              className="flex items-center gap-3"
              style={{
                padding: "4px 6px",
                border: "1px solid rgba(229,195,75,0.2)",
                backgroundColor: "rgba(17,17,24,0.9)",
                animation: "cyber-shimmer 4s ease-in-out infinite",
                clipPath: "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
              }}
            >
              {/* Pulsing dot */}
              <div className="shrink-0 pl-2">
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
                className="flex-1 bg-transparent font-mono text-sm md:text-base py-2.5 placeholder:opacity-30 focus:outline-none"
                style={{
                  color: "var(--foreground)",
                  caretColor: "var(--cyber-glow)",
                  paddingLeft: "8px",
                  paddingRight: "8px",
                }}
              />

              <button
                onClick={handleSubmitEvent}
                className="shrink-0 font-mono text-xs md:text-sm tracking-widest uppercase cursor-pointer"
                style={{
                  padding: "10px 20px",
                  marginRight: "4px",
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
          </div>
        </div>
      </div>
    </div>
  )
}
