"use client"

import { useState } from "react"
import { CyberFrame, type TabId } from "@/components/cyber-frame"
import { PlaceholderContent } from "@/components/placeholder-content"

/**
 * Главная страница приложения.
 *
 * Хранит состояние:
 * - activeTab -- какая вкладка выбрана (ГРАФ / СОБЫТИЯ / ЛОГ / АГЕНТЫ / СООБЩЕНИЯ)
 * - timeSpeed -- текущая скорость времени (от 0 до 5)
 *
 * Передаёт всё в CyberFrame, а тот рисует рамку, кнопки, ползунок
 * и поле "ДОБАВИТЬ СОБЫТИЕ".
 */
export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("events")
  const [timeSpeed, setTimeSpeed] = useState(1)

  const handleAddEvent = (text: string) => {
    // Пока просто выводим в консоль.
    // На шаге 6 (SignalR) это будет отправляться на бэкенд.
    console.log("[v0] Новое событие:", text)
  }

  return (
    <CyberFrame
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onAddEvent={handleAddEvent}
      timeSpeed={timeSpeed}
      onTimeSpeedChange={setTimeSpeed}
    >
      <PlaceholderContent />
    </CyberFrame>
  )
}
