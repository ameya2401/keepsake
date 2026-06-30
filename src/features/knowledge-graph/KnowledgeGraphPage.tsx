// ============================================================
// MemoryVerse — Interactive Knowledge Graph Visualization
// Pure canvas/SVG-based graph with no external graph libraries
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitBranch, ZoomIn, ZoomOut, Maximize2, Filter, Search,
  RefreshCw, Info, X, Network
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Spinner } from '@/components/ui'
import { useAuth } from '@/providers/AuthProvider'
import { fetchGraphData, fetchGraphMetrics } from '@/lib/knowledge-graph-service'
import type { GraphNode, GraphEdge, GraphData, GraphMetrics } from '@/lib/knowledge-graph-service'
import type { NodeType } from '@/types/database'

// ─────────────────────────────────────────────────────────────
// Node type colors and icons
// ─────────────────────────────────────────────────────────────

const NODE_COLORS: Record<NodeType, string> = {
  skill: '#8b5cf6',      // violet
  technology: '#06b6d4', // cyan
  project: '#f59e0b',    // amber
  internship: '#10b981', // emerald
  certificate: '#3b82f6', // blue
  achievement: '#ec4899', // pink
  university: '#6366f1', // indigo
  company: '#14b8a6',    // teal
  resume: '#f97316',     // orange
  portfolio: '#a855f7',  // purple
  course: '#84cc16',     // lime
  person: '#ef4444',     // red
}

const NODE_SIZE: Record<NodeType, number> = {
  resume: 32,
  portfolio: 28,
  internship: 26,
  project: 26,
  certificate: 24,
  achievement: 22,
  university: 24,
  company: 24,
  skill: 18,
  technology: 18,
  course: 20,
  person: 20,
}

// ─────────────────────────────────────────────────────────────
// Physics simulation types
// ─────────────────────────────────────────────────────────────

interface SimNode extends GraphNode {
  x: number
  y: number
  vx: number
  vy: number
  fx?: number
  fy?: number
}

// ─────────────────────────────────────────────────────────────
// Force-directed layout simulation (custom, no d3)
// ─────────────────────────────────────────────────────────────

function createSimulation(nodes: GraphNode[], edges: GraphEdge[], width: number, height: number) {
  const simNodes: SimNode[] = nodes.map((n, i) => ({
    ...n,
    x: width / 2 + Math.cos((i / nodes.length) * 2 * Math.PI) * 200,
    y: height / 2 + Math.sin((i / nodes.length) * 2 * Math.PI) * 200,
    vx: 0,
    vy: 0,
  }))

  const nodeMap = new Map(simNodes.map((n) => [n.id, n]))
  const alpha = { value: 1 }
  const alphaDecay = 0.02
  const velocityDecay = 0.4

  function tick() {
    alpha.value *= 1 - alphaDecay
    if (alpha.value < 0.001) return

    // Repulsion between all nodes
    for (let i = 0; i < simNodes.length; i++) {
      for (let j = i + 1; j < simNodes.length; j++) {
        const a = simNodes[i]
        const b = simNodes[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const repulsion = 3000 / (dist * dist)
        const fx = (dx / dist) * repulsion * alpha.value
        const fy = (dy / dist) * repulsion * alpha.value
        a.vx -= fx
        a.vy -= fy
        b.vx += fx
        b.vy += fy
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const source = nodeMap.get(edge.source_node_id)
      const target = nodeMap.get(edge.target_node_id)
      if (!source || !target) continue
      const dx = target.x - source.x
      const dy = target.y - source.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const targetDist = 120
      const strength = ((dist - targetDist) / dist) * 0.15 * alpha.value
      source.vx += dx * strength
      source.vy += dy * strength
      target.vx -= dx * strength
      target.vy -= dy * strength
    }

    // Center gravity
    for (const node of simNodes) {
      if (node.fx !== undefined) { node.x = node.fx; node.vx = 0; continue }
      if (node.fy !== undefined) { node.y = node.fy; node.vy = 0; continue }
      node.vx += (width / 2 - node.x) * 0.01 * alpha.value
      node.vy += (height / 2 - node.y) * 0.01 * alpha.value
      node.vx *= velocityDecay
      node.vy *= velocityDecay
      node.x += node.vx
      node.y += node.vy
    }
  }

  return { simNodes, nodeMap, tick, alpha }
}

// ─────────────────────────────────────────────────────────────
// GraphCanvas component
// ─────────────────────────────────────────────────────────────

interface GraphCanvasProps {
  data: GraphData
  selectedNodeId: string | null
  onSelectNode: (id: string | null) => void
  filterType: NodeType | 'all'
  searchQuery: string
}

function GraphCanvas({ data, selectedNodeId, onSelectNode, filterType, searchQuery }: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const simRef = useRef<ReturnType<typeof createSimulation> | null>(null)
  const animFrameRef = useRef<number>(0)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const draggingNode = useRef<SimNode | null>(null)

  const filteredNodes = data.nodes.filter((n) => {
    if (filterType !== 'all' && n.node_type !== filterType) return false
    if (searchQuery && !n.label.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id))
  const filteredEdges = data.edges.filter(
    (e) => filteredNodeIds.has(e.source_node_id) && filteredNodeIds.has(e.target_node_id)
  )

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !simRef.current) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { simNodes, nodeMap } = simRef.current
    const w = canvas.width
    const h = canvas.height

    ctx.clearRect(0, 0, w, h)
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    // Draw edges
    for (const edge of filteredEdges) {
      const source = nodeMap.get(edge.source_node_id)
      const target = nodeMap.get(edge.target_node_id)
      if (!source || !target) continue

      const isSelected = selectedNodeId === source.id || selectedNodeId === target.id

      ctx.beginPath()
      ctx.moveTo(source.x, source.y)
      ctx.lineTo(target.x, target.y)
      ctx.strokeStyle = isSelected
        ? 'rgba(139, 92, 246, 0.8)'
        : 'rgba(148, 163, 184, 0.25)'
      ctx.lineWidth = isSelected ? 2 : 1
      ctx.stroke()

      // Edge label
      if (isSelected && zoom > 0.8) {
        const mx = (source.x + target.x) / 2
        const my = (source.y + target.y) / 2
        ctx.fillStyle = 'rgba(139, 92, 246, 0.9)'
        ctx.font = `${10 / zoom}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(edge.relationship, mx, my - 4)
      }
    }

    // Draw nodes
    for (const node of simNodes) {
      if (!filteredNodeIds.has(node.id)) continue

      const color = NODE_COLORS[node.node_type] || '#6b7280'
      const size = (NODE_SIZE[node.node_type] || 20) / zoom * 0.7
      const isSelected = selectedNodeId === node.id

      // Glow effect for selected
      if (isSelected) {
        ctx.shadowColor = color
        ctx.shadowBlur = 20
      }

      // Node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, size + (isSelected ? 4 : 0), 0, Math.PI * 2)
      ctx.fillStyle = isSelected ? color : `${color}cc`
      ctx.fill()
      ctx.strokeStyle = isSelected ? '#fff' : `${color}66`
      ctx.lineWidth = isSelected ? 2 : 1
      ctx.stroke()

      ctx.shadowBlur = 0
      ctx.shadowColor = 'transparent'

      // Node label
      if (zoom > 0.5) {
        const label = node.label.length > 15 ? node.label.slice(0, 15) + '…' : node.label
        ctx.fillStyle = isSelected ? '#fff' : 'rgba(226, 232, 240, 0.9)'
        ctx.font = `${Math.max(9, 11 / zoom)}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(label, node.x, node.y + size + 14 / zoom)
      }
    }

    ctx.restore()
  }, [filteredEdges, filteredNodeIds, selectedNodeId, zoom, pan])

  // Initialize simulation when data changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || filteredNodes.length === 0) return

    const sim = createSimulation(filteredNodes, filteredEdges, canvas.width, canvas.height)
    simRef.current = sim

    let ticks = 0
    const MAX_TICKS = 300

    const animate = () => {
      if (ticks < MAX_TICKS) {
        sim.tick()
        ticks++
      }
      draw()
      animFrameRef.current = requestAnimationFrame(animate)
    }
    animFrameRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animFrameRef.current)
  }, [data, filteredNodes.length, filterType, searchQuery]) // eslint-disable-line

  // Re-draw when selection/zoom/pan changes
  useEffect(() => {
    draw()
  }, [draw, selectedNodeId, zoom, pan])

  // Mouse interaction handlers
  const getNodeAt = (clientX: number, clientY: number): SimNode | null => {
    if (!simRef.current || !canvasRef.current) return null
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (clientX - rect.left - pan.x) / zoom
    const y = (clientY - rect.top - pan.y) / zoom

    for (const node of simRef.current.simNodes) {
      if (!filteredNodeIds.has(node.id)) continue
      const size = (NODE_SIZE[node.node_type] || 20) / zoom * 0.7
      const dx = node.x - x
      const dy = node.y - y
      if (Math.sqrt(dx * dx + dy * dy) < size + 4) return node
    }
    return null
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const node = getNodeAt(e.clientX, e.clientY)
    if (node) {
      draggingNode.current = node
      node.fx = node.x
      node.fy = node.y
      onSelectNode(node.id)
    } else {
      isDragging.current = true
      onSelectNode(null)
    }
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNode.current) {
      const dx = (e.clientX - lastMouse.current.x) / zoom
      const dy = (e.clientY - lastMouse.current.y) / zoom
      draggingNode.current.fx = (draggingNode.current.fx ?? draggingNode.current.x) + dx
      draggingNode.current.fy = (draggingNode.current.fy ?? draggingNode.current.y) + dy
      lastMouse.current = { x: e.clientX, y: e.clientY }
      if (simRef.current) simRef.current.alpha.value = 0.3
    } else if (isDragging.current) {
      setPan((p) => ({
        x: p.x + (e.clientX - lastMouse.current.x),
        y: p.y + (e.clientY - lastMouse.current.y),
      }))
      lastMouse.current = { x: e.clientX, y: e.clientY }
    }
  }

  const handleMouseUp = () => {
    if (draggingNode.current) {
      draggingNode.current.fx = undefined
      draggingNode.current.fy = undefined
      draggingNode.current = null
    }
    isDragging.current = false
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setZoom((z) => Math.max(0.2, Math.min(3, z - e.deltaY * 0.001)))
  }

  return (
    <div className="relative w-full h-full bg-card rounded-xl border overflow-hidden">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setZoom((z) => Math.min(3, z * 1.25))}
          className="w-8 h-8 rounded-lg bg-card border flex items-center justify-center hover:bg-accent transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.2, z * 0.8))}
          className="w-8 h-8 rounded-lg bg-card border flex items-center justify-center hover:bg-accent transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
          className="w-8 h-8 rounded-lg bg-card border flex items-center justify-center hover:bg-accent transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Node Detail Panel
// ─────────────────────────────────────────────────────────────

function NodeDetailPanel({
  node,
  edges,
  allNodes,
  onClose,
}: {
  node: GraphNode
  edges: GraphEdge[]
  allNodes: GraphNode[]
  onClose: () => void
}) {
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]))
  const connectedEdges = edges.filter(
    (e) => e.source_node_id === node.id || e.target_node_id === node.id
  )
  const color = NODE_COLORS[node.node_type] || '#6b7280'

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute top-4 right-4 w-72 bg-card border rounded-xl shadow-2xl p-4 z-10"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <div>
            <p className="font-semibold text-sm leading-tight">{node.label}</p>
            <p className="text-xs text-muted-foreground capitalize">{node.node_type.replace('_', ' ')}</p>
          </div>
        </div>
        <button onClick={onClose} className="hover:text-foreground text-muted-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Connected to ({connectedEdges.length})
          </p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {connectedEdges.map((edge) => {
              const otherId =
                edge.source_node_id === node.id ? edge.target_node_id : edge.source_node_id
              const other = nodeMap.get(otherId)
              return other ? (
                <div key={edge.id} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: NODE_COLORS[other.node_type] || '#6b7280' }}
                  />
                  <span className="text-muted-foreground truncate">{edge.relationship}</span>
                  <span className="truncate font-medium">{other.label}</span>
                </div>
              ) : null
            })}
            {connectedEdges.length === 0 && (
              <p className="text-xs text-muted-foreground">No connections yet</p>
            )}
          </div>
        </div>

        {node.document_ids.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              From {node.document_ids.length} document(s)
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Knowledge Graph Page
// ─────────────────────────────────────────────────────────────

const NODE_TYPE_OPTIONS: Array<{ value: NodeType | 'all'; label: string }> = [
  { value: 'all', label: 'All Types' },
  { value: 'skill', label: 'Skills' },
  { value: 'technology', label: 'Technologies' },
  { value: 'project', label: 'Projects' },
  { value: 'internship', label: 'Internships' },
  { value: 'certificate', label: 'Certificates' },
  { value: 'achievement', label: 'Achievements' },
  { value: 'company', label: 'Companies' },
  { value: 'university', label: 'Universities' },
]

export default function KnowledgeGraphPage() {
  const { user } = useAuth()
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] })
  const [metrics, setMetrics] = useState<GraphMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<NodeType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showLegend, setShowLegend] = useState(false)

  const selectedNode = graphData.nodes.find((n) => n.id === selectedNodeId) ?? null

  const loadData = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const [graph, metricsData] = await Promise.all([
        fetchGraphData(user.id),
        fetchGraphMetrics(user.id),
      ])
      setGraphData(graph)
      setMetrics(metricsData)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => { loadData() }, [loadData])

  const isEmpty = graphData.nodes.length === 0

  return (
    <AppShell
      title="Knowledge Graph"
      breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Knowledge Graph' }]}
    >
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Network className="w-6 h-6 text-violet-500" />
              Knowledge Graph
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              A living map of your skills, projects, and experiences — automatically built from your memories
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowLegend(!showLegend)}>
              <Info className="w-4 h-4 mr-1" />
              Legend
            </Button>
            <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Metrics Row */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Nodes', value: metrics.total_nodes, color: 'text-violet-500' },
              { label: 'Connections', value: metrics.total_edges, color: 'text-cyan-500' },
              { label: 'Graph Density', value: `${metrics.overall_density_score}%`, color: 'text-amber-500' },
              { label: 'Coverage', value: `${Math.round(metrics.document_coverage * 100)}%`, color: 'text-emerald-500' },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Legend */}
        <AnimatePresence>
          {showLegend && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(NODE_COLORS).map(([type, color]) => (
                      <div key={type} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-xs capitalize">{type.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            {NODE_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterType(opt.value)}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors border ${
                  filterType === opt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Graph Canvas */}
        <div className="relative" style={{ height: '600px' }}>
          {isLoading ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <Spinner size="lg" className="mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Loading knowledge graph...</p>
              </CardContent>
            </Card>
          ) : isEmpty ? (
            <Card className="h-full">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                    <GitBranch className="w-10 h-10 text-violet-500" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Knowledge Graph is building</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Upload and process documents. MemoryVerse will automatically discover entities and
                    relationships to populate your knowledge graph.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="relative h-full">
              <GraphCanvas
                data={graphData}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                filterType={filterType}
                searchQuery={searchQuery}
              />
              <AnimatePresence>
                {selectedNode && (
                  <NodeDetailPanel
                    node={selectedNode}
                    edges={graphData.edges}
                    allNodes={graphData.nodes}
                    onClose={() => setSelectedNodeId(null)}
                  />
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Node type breakdown */}
        {!isEmpty && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(NODE_COLORS)
              .map(([type, color]) => {
                const count = graphData.nodes.filter((n) => n.node_type === type).length
                return { type, color, count }
              })
              .filter((x) => x.count > 0)
              .sort((a, b) => b.count - a.count)
              .slice(0, 8)
              .map(({ type, color, count }) => (
                <button
                  key={type}
                  onClick={() => setFilterType(filterType === (type as NodeType) ? 'all' : (type as NodeType))}
                  className={`p-3 rounded-lg border text-left transition-colors hover:bg-accent ${
                    filterType === type ? 'border-primary bg-accent' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <Badge variant="secondary" className="text-xs ml-auto">{count}</Badge>
                  </div>
                  <p className="text-xs font-medium mt-1 capitalize">{type.replace('_', ' ')}</p>
                </button>
              ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
