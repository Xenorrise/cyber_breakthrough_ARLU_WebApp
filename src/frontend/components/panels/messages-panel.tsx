"use client"

export function MessagesPanel() {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ backgroundColor: "var(--cyber-surface)" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-20 w-20 rounded-sm border flex items-center justify-center"
          style={{
            borderColor: "rgba(229,195,75,0.2)",
            boxShadow: "0 0 20px rgba(229,195,75,0.05)",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--cyber-glow)" strokeWidth="1" opacity="0.4">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className="font-mono text-sm tracking-[0.2em] uppercase" style={{ color: "var(--cyber-glow)", opacity: 0.4 }}>
          {"СООБЩЕНИЯ // СКОРО"}
        </p>
        <p className="font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>
          {"Функция в разработке"}
        </p>
      </div>
    </div>
  )
}
