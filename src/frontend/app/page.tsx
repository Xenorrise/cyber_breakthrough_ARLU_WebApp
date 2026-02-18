"use client"

import { useEffect, useState } from "react"
import { CyberFrame, type TabId } from "@/components/cyber-frame"
import { GraphPanel } from "@/components/panels/graph-panel"
import { EventsPanel } from "@/components/panels/events-panel"
import { AgentsPanel } from "@/components/panels/agents-panel"
import { StatsPanel } from "@/components/panels/stats-panel"
import { MessagesPanel } from "@/components/panels/messages-panel"
import { addEvent, getWorldTime, resetWorldSimulation, setWorldTimeSpeed } from "@/lib/data"
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

      setTimeSpeed((prev) => (Math.abs(prev - current.speed) > 0.001 ? current.speed : prev))
      setWorldTime((prev) => {
        if (!prev) {
          return current.gameTime
        }

        const prevMs = new Date(prev).getTime()
        const nextMs = new Date(current.gameTime).getTime()
        if (!Number.isFinite(prevMs) || !Number.isFinite(nextMs)) {
          return current.gameTime
        }

        // Keep UI smooth: resync only if drift exceeds one in-game minute.
        return Math.abs(nextMs - prevMs) >= 60_000 ? current.gameTime : prev
      })
    }

    void syncWorldTime()
    const timer = setInterval(syncWorldTime, 5000)
    return () => {
      active = false
      clearInterval(timer)
    }
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

  const handleRestartSimulation = async () => {
    const confirmed = window.confirm(
      "Начать симуляцию заново? Текущие агенты, связи и события будут сброшены."
    )
    if (!confirmed) {
      return
    }

    const restarted = await resetWorldSimulation()
    if (!restarted) {
      return
    }

    setTimeSpeed(restarted.speed)
    setWorldTime(restarted.gameTime)
    setSelectedAgentId(null)
    setSourceTab(null)
    setRefreshToken((prev) => prev + 1)
  }

  const handleSelectAgentFromGraph = (agentId: string) => {
    setSelectedAgentId(agentId)
    setSourceTab("graph")
    setActiveTab("agents")
  }

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
      onRestartSimulation={handleRestartSimulation}
      worldTime={worldTime}
    >
      {renderContent()}
    </CyberFrame>
  )
}

