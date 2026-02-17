"use client"

import { useState } from "react"
import { CyberFrame, type TabId } from "@/components/cyber-frame"
import { PlaceholderContent } from "@/components/placeholder-content"
import { EventsPanel } from "@/components/panels/events-panel"
import { AgentsPanel } from "@/components/panels/agents-panel"
import { StatsPanel } from "@/components/panels/stats-panel"
import { MessagesPanel } from "@/components/panels/messages-panel"

/**
 * Главная страница.
 *
 * activeTab управляет тем, что отображается в основной области:
 * - graph      -> PlaceholderContent (позже -- react-force-graph)
 * - events     -> EventsPanel (лента событий + аватары агентов)
 * - stats      -> StatsPanel (красивая статистика)
 * - agents     -> AgentsPanel (список агентов + детальный просмотр)
 * - messages   -> MessagesPanel (заглушка, в разработке)
 *
 * Все панели используют данные из lib/data.ts.
 * Когда подключишь бэкенд, замени функции в lib/data.ts -- компоненты не трогай.
 */
export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("graph")
  const [timeSpeed, setTimeSpeed] = useState(1)

  const handleAddEvent = (text: string) => {
    // TODO: отправлять на бэкенд через SignalR / REST
    console.log("[v0] Новое событие:", text)
  }

  function renderContent() {
    switch (activeTab) {
      case "graph":
        return <PlaceholderContent />
      case "events":
        return <EventsPanel />
      case "stats":
        return <StatsPanel />
      case "agents":
        return <AgentsPanel />
      case "messages":
        return <MessagesPanel />
      default:
        return <PlaceholderContent />
    }
  }

  return (
    <CyberFrame
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onAddEvent={handleAddEvent}
      timeSpeed={timeSpeed}
      onTimeSpeedChange={setTimeSpeed}
    >
      {renderContent()}
    </CyberFrame>
  )
}
