"use client"

import { useEffect, useState } from "react"
import { CyberFrame, type TabId } from "@/components/cyber-frame"
import { GraphPanel } from "@/components/panels/graph-panel"
import { EventsPanel } from "@/components/panels/events-panel"
import { AgentsPanel } from "@/components/panels/agents-panel"
import { StatsPanel } from "@/components/panels/stats-panel"
import { MessagesPanel } from "@/components/panels/messages-panel"
import { addEvent, getWorldTime, setWorldTimeSpeed } from "@/lib/data"

/**
 * Главная. activeTab -- активная вкладка.
 * selectedAgentId + sourceTab -- отслеживаем откуда пришел (из графа -> нужен спец возврат).
 * Все данные из lib/data.ts, при подключении БД замени функции там.
 */
export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("graph")
  const [timeSpeed, setTimeSpeed] = useState(1)
  const [worldTime, setWorldTime] = useState<string | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [sourceTab, setSourceTab] = useState<TabId | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    let active = true

    const syncWorldTime = async () => {
      const current = await getWorldTime()
      if (!current || !active) {
        return
      }

      setTimeSpeed(current.speed)
      setWorldTime(current.gameTime)
    }

    void syncWorldTime()
    const timer = setInterval(syncWorldTime, 1500)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshToken((prev) => prev + 1)
    }, 3000)

    return () => clearInterval(timer)
  }, [])

  const handleAddEvent = async (text: string) => {
    const saved = await addEvent(text)
    if (!saved) {
      console.warn("[ui] Event was not sent to backend, fallback mode is active")
      return
    }

    setRefreshToken((prev) => prev + 1)
  }

  const handleTimeSpeedChange = async (speed: number) => {
    setTimeSpeed(speed)
    const updated = await setWorldTimeSpeed(speed)
    if (!updated) {
      return
    }

    setTimeSpeed(updated.speed)
    setWorldTime(updated.gameTime)
    setRefreshToken((prev) => prev + 1)
  }

  // Клик на ноду графа -> открыть досье + запомнить что пришли из графа
  const handleSelectAgentFromGraph = (agentId: string) => {
    setSelectedAgentId(agentId)
    setSourceTab("graph")
    setActiveTab("agents")
  }

  // Смена вкладки -- сбросить выбор если не на агентах
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    if (tab !== "agents") {
      setSelectedAgentId(null)
      setSourceTab(null)
    }
  }

  function renderContent() {
    switch (activeTab) {
      case "graph":
        return <GraphPanel onSelectAgent={handleSelectAgentFromGraph} refreshToken={refreshToken} />
      case "events":
        return <EventsPanel refreshToken={refreshToken} />
      case "stats":
        return <StatsPanel refreshToken={refreshToken} />
      case "agents":
        return (
          <AgentsPanel
            refreshToken={refreshToken}
            preSelectedAgentId={selectedAgentId}
            onClearSelection={() => {
              setSelectedAgentId(null)
              // Если были в графе, вернуться туда
              if (sourceTab === "graph") {
                setActiveTab("graph")
                setSourceTab(null)
              }
            }}
            fromGraph={sourceTab === "graph"}
          />
        )
      case "messages":
        return <MessagesPanel />
      default:
        return null
    }
  }

  return (
    <CyberFrame
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onAddEvent={handleAddEvent}
      timeSpeed={timeSpeed}
      onTimeSpeedChange={handleTimeSpeedChange}
      worldTime={worldTime}
    >
      {renderContent()}
    </CyberFrame>
  )
}
