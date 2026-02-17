"use client"

/**
 * Временная заглушка -- заполняет основную область контента.
 * На шаге 2 заменится на настоящий граф отношений (react-force-graph).
 */
export function PlaceholderContent() {
  return (
    <div className="relative flex h-full w-full items-center justify-center" style={{ backgroundColor: "var(--cyber-surface)" }}>
      {/* Сетка на фоне */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(var(--cyber-glow) 1px, transparent 1px), linear-gradient(90deg, var(--cyber-glow) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Центральная метка */}
      <div className="relative flex flex-col items-center gap-4">
        <div
          className="h-24 w-24 rounded-full border-2 flex items-center justify-center"
          style={{
            borderColor: "var(--cyber-glow)",
            boxShadow: "0 0 30px var(--cyber-glow-dim), inset 0 0 30px var(--cyber-glow-dim)",
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--cyber-glow)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M1 12h4M19 12h4" />
            <path d="M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
          </svg>
        </div>
        <p
          className="font-mono text-sm tracking-[0.3em] uppercase"
          style={{ color: "var(--cyber-glow)", opacity: 0.6 }}
        >
          {"ОЖИДАНИЕ ДАННЫХ ГРАФА"}
        </p>
      </div>
    </div>
  )
}
