// ============================================================
// Keepsake — Analytics Page (Phase 3)
// Knowledge Density, Memory Health Scores, and Reasoning API
// ============================================================

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, Brain, Zap, Activity, TrendingUp,
  CheckCircle2, XCircle, AlertCircle, RefreshCw, Sparkles,
  ChevronDown, ChevronRight, Send, Loader2
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import {
  Card, CardContent, CardHeader, CardTitle,
  Progress, Badge, Button, Input, Spinner
} from '@/components/ui'
import { useAuth } from '@/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { fetchGraphMetrics } from '@/lib/knowledge-graph-service'
import { reasonAcrossMemories, computeMemoryScore } from '@/lib/reasoning-api'
import { batchGenerateEmbeddings } from '@/lib/embedding-service'
import type { GraphMetrics } from '@/lib/knowledge-graph-service'
import type { ReasoningAnswer, MemoryScore } from '@/lib/reasoning-api'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface DocumentScore {
  id: string
  title: string
  category: string | null
  score: MemoryScore | null
}

interface SystemStats {
  totalMemories: number
  processedMemories: number
  totalSkills: number
  totalEmbeddings: number
  totalTimelineEvents: number
}

// ─────────────────────────────────────────────────────────────
// Reasoning queries
// ─────────────────────────────────────────────────────────────

const REASONING_EXAMPLES = [
  'What skill appears most frequently across my career?',
  'What project best demonstrates backend experience?',
  'Which certificate validates my strongest technical skill?',
  'What is the most important gap in my knowledge base?',
]

// ─────────────────────────────────────────────────────────────
// Memory Health Score card
// ─────────────────────────────────────────────────────────────

function HealthScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500'
  const variant = score >= 80 ? 'success' : score >= 50 ? 'warning' : 'destructive'

  return (
    <div className="text-center">
      <div className={`text-5xl font-bold ${color}`}>{score}</div>
      <p className="text-sm text-muted-foreground mt-1">/100</p>
      <Progress value={score} variant={variant} className="mt-3" />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Document Memory Score Row
// ─────────────────────────────────────────────────────────────

function DocumentScoreRow({
  doc,
  onCompute,
}: {
  doc: DocumentScore
  onCompute: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const score = doc.score

  const healthColor = !score
    ? 'text-muted-foreground'
    : score.healthScore >= 80
    ? 'text-emerald-500'
    : score.healthScore >= 50
    ? 'text-amber-500'
    : 'text-red-500'

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
      >
        <div className={`font-bold text-lg w-10 text-right ${healthColor}`}>
          {score ? score.healthScore : '—'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{doc.title}</p>
          <p className="text-xs text-muted-foreground capitalize">{doc.category?.replace('_', ' ') || 'other'}</p>
        </div>
        <div className="flex items-center gap-2">
          {score && (
            <div className="flex items-center gap-1">
              {score.hasEmbedding ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              {score.hasTimelineEvent ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </div>
          )}
          {!score && (
            <button
              onClick={(e) => { e.stopPropagation(); onCompute(doc.id) }}
              className="text-xs text-primary hover:underline"
            >
              Compute
            </button>
          )}
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && score && score.issues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="ml-13 pl-12 pb-2"
        >
          <div className="space-y-1">
            {score.issues.map((issue, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="w-3 h-3 flex-shrink-0 text-amber-500" />
                {issue}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Reasoning Panel
// ─────────────────────────────────────────────────────────────

function ReasoningPanel() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [isReasoning, setIsReasoning] = useState(false)
  const [answer, setAnswer] = useState<ReasoningAnswer | null>(null)

  const handleReason = async (q: string) => {
    if (!user?.id || !q.trim()) return
    setIsReasoning(true)
    setAnswer(null)
    const result = await reasonAcrossMemories(q, user.id)
    setAnswer(result)
    setIsReasoning(false)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="w-4 h-4 text-violet-500" />
          AI Reasoning Engine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Ask complex questions across all your memories. The engine reasons through your documents to find answers.
        </p>

        {/* Example queries */}
        <div className="flex flex-wrap gap-2">
          {REASONING_EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => { setQuery(ex); handleReason(ex) }}
              className="text-xs px-2.5 py-1.5 rounded-full border hover:bg-accent transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about your memories..."
            onKeyDown={(e) => e.key === 'Enter' && handleReason(query)}
            className="text-sm"
          />
          <Button
            size="icon"
            onClick={() => handleReason(query)}
            disabled={!query.trim() || isReasoning}
          >
            {isReasoning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>

        {/* Answer */}
        {isReasoning && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
            Reasoning across your memories…
          </div>
        )}

        {answer && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 p-4 rounded-xl bg-violet-500/5 border border-violet-500/20"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-violet-500">Answer</p>
              <Badge className="text-xs bg-violet-500/10 text-violet-500">
                {Math.round(answer.confidence * 100)}% confidence
              </Badge>
            </div>
            <p className="text-sm leading-relaxed">{answer.answer}</p>

            {answer.reasoning_chain.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Reasoning chain</p>
                {answer.reasoning_chain.map((step, i) => (
                  <div key={i} className="text-xs text-muted-foreground flex gap-1.5">
                    <span className="text-violet-500 font-mono">{i + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            )}

            {answer.supporting_documents.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Sources</p>
                <div className="flex flex-wrap gap-1.5">
                  {answer.supporting_documents.map((doc) => (
                    <Badge key={doc} variant="secondary" className="text-xs">{doc}</Badge>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Analytics Page
// ─────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState<GraphMetrics | null>(null)
  const [stats, setStats] = useState<SystemStats>({
    totalMemories: 0, processedMemories: 0, totalSkills: 0,
    totalEmbeddings: 0, totalTimelineEvents: 0
  })
  const [docScores, setDocScores] = useState<DocumentScore[]>([])
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false)
  const [embeddingResult, setEmbeddingResult] = useState<{ processed: number; failed: number } | null>(null)

  const loadData = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const [metricsData, docsResult, skillsResult, embsResult, timelineResult, scoresResult] =
        await Promise.all([
          fetchGraphMetrics(user.id),
          supabase
            .from('documents')
            .select('id, title, category, processing_status')
            .eq('user_id', user.id),
          supabase.from('skills').select('id').eq('user_id', user.id),
          supabase.from('embeddings').select('id').eq('user_id', user.id),
          supabase.from('timeline_events').select('id').eq('user_id', user.id),
          supabase
            .from('memory_scores')
            .select('document_id, health_score, issues, metadata_completeness, relationship_count, has_embedding, has_timeline_event')
            .eq('user_id', user.id),
        ])

      setMetrics(metricsData)

      const docs = docsResult.data || []
      setStats({
        totalMemories: docs.length,
        processedMemories: docs.filter((d: { processing_status: string }) => d.processing_status === 'completed').length,
        totalSkills: skillsResult.data?.length || 0,
        totalEmbeddings: embsResult.data?.length || 0,
        totalTimelineEvents: timelineResult.data?.length || 0,
      })

      const scoreMap = new Map(
        (scoresResult.data || []).map((s: {
          document_id: string
          health_score: number
          issues: string[]
          metadata_completeness: number
          relationship_count: number
          has_embedding: boolean
          has_timeline_event: boolean
        }) => [
          s.document_id,
          {
            documentId: s.document_id,
            healthScore: s.health_score,
            issues: s.issues || [],
            metadataCompleteness: s.metadata_completeness,
            relationshipCount: s.relationship_count,
            hasEmbedding: s.has_embedding,
            hasTimelineEvent: s.has_timeline_event,
          } as MemoryScore,
        ])
      )

      const completedDocs = docs
        .filter((d: { processing_status: string }) => d.processing_status === 'completed')
        .map((d: { id: string; title: string; category: string | null }) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          score: scoreMap.get(d.id) ?? null,
        }))
        .sort((a: DocumentScore, b: DocumentScore) => {
          if (!a.score && !b.score) return 0
          if (!a.score) return 1
          if (!b.score) return -1
          return a.score.healthScore - b.score.healthScore
        })

      setDocScores(completedDocs)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => { loadData() }, [loadData])

  const handleComputeScore = async (docId: string) => {
    if (!user?.id) return
    const score = await computeMemoryScore(docId, user.id)
    setDocScores((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, score } : d))
    )
  }

  const handleGenerateEmbeddings = async () => {
    if (!user?.id) return
    setIsGeneratingEmbeddings(true)
    const result = await batchGenerateEmbeddings(user.id)
    setEmbeddingResult(result)
    setIsGeneratingEmbeddings(false)
    loadData()
  }

  const avgHealthScore =
    docScores.filter((d) => d.score).length > 0
      ? Math.round(
          docScores.filter((d) => d.score).reduce((sum, d) => sum + (d.score?.healthScore ?? 0), 0) /
            docScores.filter((d) => d.score).length
        )
      : 0

  return (
    <AppShell
      title="Analytics"
      breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Analytics' }]}
    >
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-500" />
              Analytics & Intelligence
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Knowledge density, memory health, and AI reasoning across your entire collection
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* System Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Memories', value: stats.totalMemories, color: 'text-blue-500' },
                { label: 'Processed', value: stats.processedMemories, color: 'text-emerald-500' },
                { label: 'Skills', value: stats.totalSkills, color: 'text-violet-500' },
                { label: 'Embeddings', value: stats.totalEmbeddings, color: 'text-cyan-500' },
                { label: 'Timeline', value: stats.totalTimelineEvents, color: 'text-amber-500' },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-3 text-center">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Knowledge Density + Memory Health */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Knowledge Density */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-500" />
                    Knowledge Density
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {metrics ? (
                    <>
                      <div className="text-center">
                        <p className="text-5xl font-bold text-cyan-500">{metrics.overall_density_score}</p>
                        <p className="text-sm text-muted-foreground mt-1">/100</p>
                        <Progress value={metrics.overall_density_score} className="mt-3" />
                      </div>
                      <div className="space-y-2">
                        {[
                          { label: 'Graph Nodes', value: metrics.total_nodes },
                          { label: 'Connections', value: metrics.total_edges },
                          { label: 'Avg. Relationships', value: Number(metrics.avg_relationships).toFixed(1) },
                          { label: 'Timeline Completeness', value: `${Math.round(metrics.timeline_completeness * 100)}%` },
                          { label: 'Document Coverage', value: `${Math.round(metrics.document_coverage * 100)}%` },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-medium">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Process documents to compute knowledge density
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Average Memory Health */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Memory Health Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {docScores.filter((d) => d.score).length > 0 ? (
                    <>
                      <HealthScoreGauge score={avgHealthScore} />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Embeddings</span>
                          <span>{docScores.filter((d) => d.score?.hasEmbedding).length}/{docScores.filter((d) => d.score).length}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Timeline Events</span>
                          <span>{docScores.filter((d) => d.score?.hasTimelineEvent).length}/{docScores.filter((d) => d.score).length}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Graph Connections</span>
                          <span>{docScores.filter((d) => (d.score?.relationshipCount || 0) > 0).length}/{docScores.filter((d) => d.score).length}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        No health scores computed yet
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => docScores[0] && handleComputeScore(docScores[0].id)}
                      >
                        Compute Scores
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Embeddings Generator */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-500" />
                  Embedding Generator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">
                      {stats.totalEmbeddings} of {stats.processedMemories} documents have embeddings
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Generate embeddings to enable semantic search for all processed documents
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleGenerateEmbeddings}
                    disabled={isGeneratingEmbeddings || stats.totalEmbeddings >= stats.processedMemories}
                  >
                    {isGeneratingEmbeddings ? (
                      <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Generating…</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-1.5" />Generate All</>
                    )}
                  </Button>
                </div>
                {embeddingResult && (
                  <div className="mt-3 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-600">
                    ✓ Processed {embeddingResult.processed} documents
                    {embeddingResult.failed > 0 && `, ${embeddingResult.failed} failed`}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Per-Document Health Scores */}
            {docScores.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    Per-Memory Health Scores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 px-3">
                    <span className="w-10 text-right">Score</span>
                    <span className="flex-1">Memory</span>
                    <div className="flex gap-1 items-center">
                      <span title="Has embedding">Emb</span>
                      <span title="Has timeline event">TL</span>
                    </div>
                  </div>
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {docScores.map((doc) => (
                      <DocumentScoreRow key={doc.id} doc={doc} onCompute={handleComputeScore} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reasoning Panel */}
            <ReasoningPanel />
          </>
        )}
      </div>
    </AppShell>
  )
}
