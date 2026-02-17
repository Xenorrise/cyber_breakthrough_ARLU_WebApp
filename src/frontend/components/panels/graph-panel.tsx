"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import {
  MOOD_CONFIG,
  getAgents,
  getRelationships,
  type Agent,
  type Relationship,
} from "@/lib/data"

// Типы для графа
interface GraphNode {
  id: string
  name: string
  avatar: string
  mood: string
  moodColor: string
  val: number
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
  __dragging?: boolean
}

interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  sentiment: number
  label?: string
  color: string
}

interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

// Цвет связи по sentiment
function sentimentToColor(s: number): string {
  if (s >= 0.5) return "#4ade80"
  if (s >= 0.2) return "#86efac"
  if (s > -0.2) return "#555566"
  if (s > -0.5) return "#fca5a5"
  return "#f87171"
}

// Построить граф из агентов и связей
function buildGraphData(agents: Agent[], rels: Relationship[]): GraphData {
  const agentIds = new Set(agents.map((a) => a.id))

  const nodes: GraphNode[] = agents.map((a) => ({
    id: a.id,
    name: a.name,
    avatar: a.avatar,
    mood: a.mood,
    moodColor: MOOD_CONFIG[a.mood].color,
    val: 8,
  }))

  const links: GraphLink[] = rels
    .filter((r) => agentIds.has(r.from) && agentIds.has(r.to))
    .map((r) => ({
      source: r.from,
      target: r.to,
      sentiment: r.sentiment,
      label: r.label,
      color: sentimentToColor(r.sentiment),
    }))

  return { nodes, links }
}

// Загрузочный оверлей
function LoadingOverlay({ visible }: { visible: boolean }) {
  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center"
      style={{
        backgroundColor: "var(--cyber-surface)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.6s ease",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(var(--cyber-glow) 1px, transparent 1px), linear-gradient(90deg, var(--cyber-glow) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="relative flex flex-col items-center gap-4">
        <div
          className="h-16 w-16 rounded-full border flex items-center justify-center"
          style={{
            borderColor: "var(--cyber-glow)",
            boxShadow: "0 0 20px var(--cyber-glow-dim), inset 0 0 20px var(--cyber-glow-dim)",
            animation: "cyber-pulse 2s ease-in-out infinite",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--cyber-glow)" strokeWidth="1.5">
            <circle cx="5" cy="12" r="2" />
            <circle cx="19" cy="6" r="2" />
            <circle cx="19" cy="18" r="2" />
            <line x1="7" y1="12" x2="17" y2="6" />
            <line x1="7" y1="12" x2="17" y2="18" />
          </svg>
        </div>
        <p className="font-mono text-sm tracking-[0.2em] uppercase" style={{ color: "var(--cyber-glow)", opacity: 0.6 }}>
          {"ЗАГРУЗКА ГРАФА"}
        </p>
      </div>
    </div>
  )
}

// Легенда
function Legend() {
  const items = [
    { color: "#4ade80", label: "Дружба" },
    { color: "#555566", label: "Нейтрально" },
    { color: "#f87171", label: "Конфликт" },
  ]
  return (
    <div
      className="absolute bottom-3 left-3 z-20 flex items-center gap-4 px-3 py-2 font-mono text-[11px]"
      style={{
        backgroundColor: "rgba(10,10,15,0.85)",
        border: "1px solid rgba(229,195,75,0.15)",
      }}
    >
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className="h-[2px] w-4" style={{ backgroundColor: item.color }} />
          <span style={{ color: "var(--muted-foreground)" }}>{item.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 ml-2" style={{ borderLeft: "1px solid rgba(229,195,75,0.15)", paddingLeft: 8 }}>
        <span style={{ color: "var(--muted-foreground)" }}>{"Клик = профиль"}</span>
      </div>
    </div>
  )
}

// Панель графа -- узлы, связи, физика
export function GraphPanel({
  onSelectAgent,
  refreshToken,
}: {
  onSelectAgent?: (agentId: string) => void
  refreshToken?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [graphLoaded, setGraphLoaded] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [agents, setAgents] = useState<Agent[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ForceGraph, setForceGraph] = useState<React.ComponentType<any> | null>(null)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const agentsSignatureRef = useRef("")
  const relationshipsSignatureRef = useRef("")
  const initializedRef = useRef(false)

  const graphData = useMemo(() => buildGraphData(agents, relationships), [agents, relationships])

  useEffect(() => {
    let active = true
    if (!initializedRef.current) {
      setDataLoaded(false)
    }

    const loadData = async () => {
      const [loadedAgents, loadedRelationships] = await Promise.all([getAgents(), getRelationships()])
      if (!active) return

      const agentsSignature = JSON.stringify(
        loadedAgents.map((agent) => [agent.id, agent.mood, agent.currentPlan, agent.memories.length])
      )
      const relationshipsSignature = JSON.stringify(
        loadedRelationships.map((relationship) => [relationship.from, relationship.to, relationship.sentiment, relationship.label])
      )

      if (agentsSignature !== agentsSignatureRef.current) {
        agentsSignatureRef.current = agentsSignature
        setAgents(loadedAgents)
      }

      if (relationshipsSignature !== relationshipsSignatureRef.current) {
        relationshipsSignatureRef.current = relationshipsSignature
        setRelationships(loadedRelationships)
      }

      if (!initializedRef.current) {
        initializedRef.current = true
        setDataLoaded(true)
      }
    }

    void loadData()
    const timer = setInterval(() => {
      void loadData()
    }, 4000)

    return () => {
      active = false
      clearInterval(timer)
    }
  }, [refreshToken])

  // Track container size
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Dynamic import (SSR-safe)
  useEffect(() => {
    import("react-force-graph-2d").then((mod) => {
      setForceGraph(() => mod.default)
      setTimeout(() => setGraphLoaded(true), 500)
    })
  }, [])

  // Configure physics ONCE after graph renders
  const physicsConfigured = useRef(false)
  useEffect(() => {
    const fg = fgRef.current
    if (!fg || physicsConfigured.current || !graphLoaded) return
    physicsConfigured.current = true

    // Charge: nodes repel each other
    fg.d3Force("charge")?.strength(-300).distanceMax(500)

    // Links: connected nodes attract with moderate strength
    fg.d3Force("link")?.distance(120).strength(0.35)

    // Center: weak gravity toward center -- keeps the cluster centered
    fg.d3Force("center")?.strength(0.04)

    // Collision: prevent overlap (node radius 14 + padding = 30)
    import("d3-force").then(({ forceCollide }) => {
      fg.d3Force("collide", forceCollide(30).strength(1).iterations(4))
      fg.d3ReheatSimulation()
    })

    fg.d3ReheatSimulation()
  }, [graphLoaded])

  // Обработать изменение размера (fullscreen toggle) -- центрировать и прогреть физику
  useEffect(() => {
    const fg = fgRef.current
    if (!fg || !graphLoaded || dimensions.width === 0) return
    
    // Небольшая задержка чтобы canvas успел обновиться
    const timer = setTimeout(() => {
      fg.zoomToFit(400, 40)
      fg.d3ReheatSimulation()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [dimensions, graphLoaded])

  // Paint node -- minimal, consistent stroke width
  const paintNode = useCallback(
    (node: Record<string, unknown>, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as unknown as GraphNode
      const x = n.x ?? 0
      const y = n.y ?? 0
      const r = 14
      const isHovered = hoveredNode?.id === n.id
      const fontSize = Math.max(11 / globalScale, 2.5)

      ctx.save()

      // Subtle glow when hovered
      if (isHovered) {
        ctx.beginPath()
        ctx.arc(x, y, r + 6, 0, 2 * Math.PI)
        ctx.fillStyle = "rgba(229,195,75,0.06)"
        ctx.fill()
      }

      // Fill
      ctx.beginPath()
      ctx.arc(x, y, r, 0, 2 * Math.PI)
      ctx.fillStyle = "#111118"
      ctx.fill()

      // Stroke -- uniform 1.5px for all
      ctx.strokeStyle = isHovered ? "#e5c34b" : n.moodColor
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Avatar letter
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.font = `bold ${r * 0.8}px 'Geist Mono', monospace`
      ctx.fillStyle = isHovered ? "#e5c34b" : n.moodColor
      ctx.fillText(n.avatar, x, y + 0.5)

      // Name below node
      if (globalScale > 0.45) {
        ctx.font = `${fontSize}px 'Geist Mono', monospace`
        ctx.fillStyle = isHovered ? "#e5c34b" : "rgba(229,195,75,0.3)"
        ctx.fillText(n.name, x, y + r + fontSize + 3)
      }

      ctx.restore()
    },
    [hoveredNode]
  )

  // Paint link -- uniform width, no labels on canvas
  const paintLink = useCallback(
    (link: Record<string, unknown>, ctx: CanvasRenderingContext2D) => {
      const l = link as unknown as GraphLink
      const source = l.source as unknown as GraphNode
      const target = l.target as unknown as GraphNode
      if (source.x == null || source.y == null || target.x == null || target.y == null) return

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(source.x, source.y)
      ctx.lineTo(target.x, target.y)
      ctx.strokeStyle = l.color
      ctx.lineWidth = 1.2
      ctx.globalAlpha = 0.4
      ctx.stroke()
      ctx.restore()
    },
    []
  )

  // Tooltip content -- shows relationships when hovering
  const tooltipContent = useMemo(() => {
    if (!hoveredNode) return null
    const agent = agents.find((a) => a.id === hoveredNode.id)
    if (!agent) return null
    const moodCfg = MOOD_CONFIG[agent.mood]

    const rels = relationships.filter(
      (r) => r.from === agent.id || r.to === agent.id
    ).map((r) => {
      const otherId = r.from === agent.id ? r.to : r.from
      const other = agents.find((a) => a.id === otherId)
      return { name: other?.name ?? otherId, sentiment: r.sentiment, label: r.label }
    })

    return { agent, moodCfg, rels }
  }, [hoveredNode, agents, relationships])

  // Node click -- navigate to agent profile
  const handleNodeClick = useCallback(
    (node: Record<string, unknown>) => {
      const n = node as unknown as GraphNode
      if (onSelectAgent) {
        onSelectAgent(n.id)
      }
    },
    [onSelectAgent]
  )

  // Drag -- temporary pin, release back to physics after drag end
  const handleNodeDrag = useCallback((node: Record<string, unknown>) => {
    const n = node as unknown as GraphNode
    n.__dragging = true
    n.fx = n.x
    n.fy = n.y
  }, [])

  const handleNodeDragEnd = useCallback((node: Record<string, unknown>) => {
    const n = node as unknown as GraphNode
    n.__dragging = false
    // Release back to physics after a short delay
    setTimeout(() => {
      if (!n.__dragging) {
        n.fx = undefined as unknown as null
        n.fy = undefined as unknown as null
      }
    }, 300)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: "var(--cyber-surface)" }}
      onMouseMove={(e) => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        }
      }}
    >
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--cyber-glow) 1px, transparent 1px), linear-gradient(90deg, var(--cyber-glow) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <LoadingOverlay visible={!graphLoaded || !dataLoaded} />

      {ForceGraph && dimensions.width > 0 && (
        <ForceGraph
          ref={fgRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="transparent"
          // Physics: never stop
          d3AlphaDecay={0.005}
          d3VelocityDecay={0.25}
          warmupTicks={0}
          cooldownTime={Infinity}
          // Nodes
          nodeCanvasObject={paintNode}
          nodePointerAreaPaint={(node: Record<string, unknown>, color: string, ctx: CanvasRenderingContext2D) => {
            const n = node as unknown as GraphNode
            const x = n.x ?? 0
            const y = n.y ?? 0
            // Увеличенная зона клика для Firefox
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(x, y, 22, 0, 2 * Math.PI)
            ctx.fill()
          }}
          nodeLabel={() => ""}
          nodeVal={() => 1}
          onNodeHover={(node: Record<string, unknown> | null) => {
            setHoveredNode(node ? (node as unknown as GraphNode) : null)
            if (containerRef.current) {
              containerRef.current.style.cursor = node ? "pointer" : "default"
            }
          }}
          onNodeClick={handleNodeClick}
          onNodeDrag={handleNodeDrag}
          onNodeDragEnd={handleNodeDragEnd}
          enableNodeDrag={true}
          // Связи
          linkCanvasObject={paintLink}
          linkDirectionalParticles={0}
          linkPointerAreaPaint={() => {}}
          // Навигация
          enableZoomInteraction={true}
          enablePanInteraction={true}
          minZoom={0.3}
          maxZoom={6}
        />
      )}

      {/* Tooltip -- only on hover, disappears immediately on leave */}
      {hoveredNode && tooltipContent && (
        <div
          className="absolute z-40 pointer-events-none font-mono"
          style={{
            left: Math.min(tooltipPos.x + 18, dimensions.width - 230),
            top: Math.max(tooltipPos.y - 14, 8),
            backgroundColor: "rgba(10,10,15,0.94)",
            border: "1px solid rgba(229,195,75,0.2)",
            padding: "10px 14px",
            minWidth: "180px",
            maxWidth: "240px",
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{
                backgroundColor: tooltipContent.moodCfg.color + "25",
                color: tooltipContent.moodCfg.color,
                border: `1px solid ${tooltipContent.moodCfg.color}50`,
              }}
            >
              {tooltipContent.agent.avatar}
            </div>
            <span className="text-sm" style={{ color: "var(--cyber-glow)" }}>
              {tooltipContent.agent.name}
            </span>
          </div>

          <div className="text-[10px] flex items-center gap-1.5 mb-2" style={{ color: tooltipContent.moodCfg.color }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tooltipContent.moodCfg.color }} />
            {tooltipContent.moodCfg.label}
            <span style={{ color: "var(--muted-foreground)", marginLeft: 4 }}>
              {tooltipContent.agent.traits.slice(0, 2).join(", ")}
            </span>
          </div>

          {tooltipContent.rels.length > 0 && (
            <div style={{ borderTop: "1px solid rgba(229,195,75,0.1)" }} className="pt-1.5">
              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)" }}>
                {"Связи"}
              </div>
              {tooltipContent.rels.map((rel) => (
                <div key={rel.name} className="flex items-center justify-between text-[10px] py-0.5">
                  <span style={{ color: "var(--foreground)" }}>{rel.name}</span>
                  <span style={{ color: sentimentToColor(rel.sentiment), fontSize: "9px" }}>{rel.label}</span>
                </div>
              ))}
            </div>
          )}

          {tooltipContent.rels.length === 0 && (
            <div className="text-[10px] pt-1" style={{ color: "var(--muted-foreground)", borderTop: "1px solid rgba(229,195,75,0.1)", paddingTop: 6 }}>
              {"Нет связей с другими агентами"}
            </div>
          )}
        </div>
      )}

      <Legend />
    </div>
  )
}


