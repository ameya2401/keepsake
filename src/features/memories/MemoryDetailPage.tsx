// ============================================================
// MemoryVerse — Memory Detail Page (Phase 4)
// Full per-memory view with AI narrative, graph preview, related memories
// ============================================================

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Brain, Calendar, Building2, Tag, Zap, GitBranch,
  Clock, FileText, Sparkles, ExternalLink, Star, Award,
  Loader2, AlertCircle, CheckCircle2, TrendingUp, Code
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Progress, Spinner } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import { cn, timeAgo, formatFileSize } from '@/lib/utils'
import type { Document } from '@/types/database'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface RelatedMemory {
  id: string
  title: string
  category: string | null
  similarity?: number
}

interface MemoryScore {
  health_score: number
  has_embedding: boolean
  has_timeline_event: boolean
  metadata_completeness: number
  relationship_count: number
  issues: string[]
}

// ─────────────────────────────────────────────────────────────
// Category display config
// ─────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  certificate: { emoji: '🏆', label: 'Certificate', color: 'text-blue-500 bg-blue-500/10' },
  internship: { emoji: '💼', label: 'Internship', color: 'text-emerald-500 bg-emerald-500/10' },
  project: { emoji: '⚡', label: 'Project', color: 'text-amber-500 bg-amber-500/10' },
  achievement: { emoji: '🌟', label: 'Achievement', color: 'text-pink-500 bg-pink-500/10' },
  hackathon: { emoji: '🚀', label: 'Hackathon', color: 'text-violet-500 bg-violet-500/10' },
  resume: { emoji: '📄', label: 'Resume', color: 'text-orange-500 bg-orange-500/10' },
  course_completion: { emoji: '📚', label: 'Course', color: 'text-cyan-500 bg-cyan-500/10' },
  workshop: { emoji: '🔧', label: 'Workshop', color: 'text-teal-500 bg-teal-500/10' },
  research: { emoji: '🔬', label: 'Research', color: 'text-indigo-500 bg-indigo-500/10' },
  portfolio: { emoji: '🎨', label: 'Portfolio', color: 'text-purple-500 bg-purple-500/10' },
  other: { emoji: '📎', label: 'Other', color: 'text-muted-foreground bg-muted' },
}

// ─────────────────────────────────────────────────────────────
// Health Score Ring
// ─────────────────────────────────────────────────────────────

function HealthRing({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500'
  const strokeColor = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="24" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/20" />
          <circle
            cx="32" cy="32" r="24"
            fill="none"
            stroke={strokeColor}
            strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 24 * score / 100} ${2 * Math.PI * 24}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-sm font-bold', color)}>{score}</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold">Memory Health</p>
        <p className="text-xs text-muted-foreground">
          {score >= 80 ? 'Excellent — fully indexed' : score >= 50 ? 'Good — some gaps remain' : 'Needs attention'}
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Memory Detail Page
// ─────────────────────────────────────────────────────────────

export default function MemoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [document, setDocument] = useState<Document | null>(null)
  const [score, setScore] = useState<MemoryScore | null>(null)
  const [relatedMemories, setRelatedMemories] = useState<RelatedMemory[]>([])
  const [timelineEvents, setTimelineEvents] = useState<{ title: string; event_date: string; event_type: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id || !user?.id) return

    async function load() {
      setIsLoading(true)
      try {
        const [docResult, scoreResult, tlResult, relatedResult] = await Promise.all([
          supabase
            .from('documents')
            .select('*')
            .eq('id', id)
            .eq('user_id', user!.id)
            .single(),
          supabase
            .from('memory_scores')
            .select('*')
            .eq('document_id', id)
            .maybeSingle(),
          supabase
            .from('timeline_events')
            .select('title, event_date, event_type')
            .eq('document_id', id)
            .limit(3),
          supabase
            .from('documents')
            .select('id, title, category')
            .eq('user_id', user!.id)
            .neq('id', id)
            .limit(4),
        ])

        if (docResult.error || !docResult.data) {
          setNotFound(true)
          return
        }

        setDocument(docResult.data as Document)
        setScore(scoreResult.data)
        setTimelineEvents(tlResult.data || [])
        setRelatedMemories(relatedResult.data || [])
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [id, user?.id])

  if (isLoading) {
    return (
      <AppShell title="Memory" breadcrumb={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Memories', href: '/memories' },
        { label: 'Loading…' },
      ]}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </AppShell>
    )
  }

  if (notFound || !document) {
    return (
      <AppShell title="Not Found" breadcrumb={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Memories', href: '/memories' },
      ]}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
          <AlertCircle className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <h2 className="text-lg font-semibold mb-2">Memory not found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This memory doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate('/memories')}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Memories
          </Button>
        </div>
      </AppShell>
    )
  }

  const meta = (document.metadata || {}) as Record<string, unknown>
  const skills = (meta.skills as string[]) || []
  const technologies = (meta.technologies as string[]) || []
  const organization = meta.organization as string | undefined
  const issueDate = meta.issue_date as string | undefined
  const categoryConfig = CATEGORY_CONFIG[document.category || 'other'] || CATEGORY_CONFIG.other
  const isProcessed = document.processing_status === 'completed'

  return (
    <AppShell
      title={document.title}
      breadcrumb={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Memories', href: '/memories' },
        { label: document.title.length > 40 ? document.title.slice(0, 40) + '…' : document.title },
      ]}
    >
      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4"
        >
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-accent transition-colors flex-shrink-0 mt-1"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={cn('text-xs px-2 py-1 rounded-full font-medium', categoryConfig.color)}>
                {categoryConfig.emoji} {categoryConfig.label}
              </span>
              <Badge
                className={cn(
                  'text-xs',
                  isProcessed
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-violet-500/10 text-violet-500 border-violet-500/20'
                )}
              >
                {isProcessed ? (
                  <><CheckCircle2 className="w-3 h-3 mr-1" />Processed</>
                ) : (
                  <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processing</>
                )}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold leading-snug">{document.title}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {organization && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Building2 className="w-3.5 h-3.5" />
                  {organization}
                </span>
              )}
              {issueDate && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {issueDate}
                </span>
              )}
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {timeAgo(document.created_at)}
              </span>
              {document.file_size && (
                <span className="text-sm text-muted-foreground">
                  {formatFileSize(document.file_size)}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column (2/3) */}
          <div className="lg:col-span-2 space-y-6">

            {/* AI Summary */}
            {document.ai_summary && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="w-4 h-4 text-violet-500" />
                    AI Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {document.ai_summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Skills & Technologies */}
            {(skills.length > 0 || technologies.length > 0) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Skills & Technologies
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {skills.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <Badge key={skill} className="bg-violet-500/10 text-violet-500 border-violet-500/20">
                            <Star className="w-3 h-3 mr-1" />
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {technologies.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Technologies</p>
                      <div className="flex flex-wrap gap-2">
                        {technologies.map((tech) => (
                          <Badge key={tech} variant="secondary">
                            <Code className="w-3 h-3 mr-1" />
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {document.tags && document.tags.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Tag className="w-4 h-4 text-cyan-500" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {document.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline Events */}
            {timelineEvents.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      Timeline Position
                    </CardTitle>
                    <Link to="/timeline" className="text-xs text-primary hover:underline">
                      View timeline →
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {timelineEvents.map((event, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      <Badge className="text-xs capitalize bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        {(event.event_type || '').replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column (1/3) */}
          <div className="space-y-6">

            {/* Memory Health */}
            {score ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    Memory Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <HealthRing score={score.health_score} />

                  <div className="space-y-2">
                    {[
                      { label: 'Metadata', value: score.metadata_completeness, icon: FileText },
                      { label: 'Embedding', done: score.has_embedding },
                      { label: 'Timeline', done: score.has_timeline_event },
                      { label: 'Relationships', value: score.relationship_count, suffix: ' links' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{item.label}</span>
                        {'done' in item ? (
                          item.done
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            : <AlertCircle className="w-4 h-4 text-muted-foreground" />
                        ) : 'value' in item && typeof item.value === 'number' ? (
                          item.suffix
                            ? <span className="font-medium">{item.value}{item.suffix}</span>
                            : (
                              <div className="flex items-center gap-2">
                                <Progress value={item.value} className="w-16 h-1.5" />
                                <span className="font-medium">{item.value}%</span>
                              </div>
                            )
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {score.issues.length > 0 && (
                    <div className="pt-2 border-t space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Issues to fix:</p>
                      {score.issues.map((issue, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-amber-600">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          {issue}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4 text-center">
                  <Award className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No health score yet. Visit Analytics to compute it.
                  </p>
                  <Link to="/analytics" className="text-xs text-primary hover:underline mt-1 block">
                    Go to Analytics →
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Confidence score */}
            {document.confidence_score !== null && document.confidence_score !== undefined && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium">AI Confidence</p>
                    <span className={cn(
                      'text-xs font-bold',
                      document.confidence_score > 0.8 ? 'text-emerald-500' :
                      document.confidence_score > 0.6 ? 'text-amber-500' : 'text-red-500'
                    )}>
                      {Math.round(document.confidence_score * 100)}%
                    </span>
                  </div>
                  <Progress value={document.confidence_score * 100} />
                </CardContent>
              </Card>
            )}

            {/* Related Memories */}
            {relatedMemories.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-rose-500" />
                    Related Memories
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {relatedMemories.map((mem) => {
                    const cfg = CATEGORY_CONFIG[mem.category || 'other'] || CATEGORY_CONFIG.other
                    return (
                      <Link key={mem.id} to={`/memories/${mem.id}`}>
                        <div className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-accent transition-colors group">
                          <span className="text-base">{cfg.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                              {mem.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground capitalize">
                              {cfg.label}
                            </p>
                          </div>
                          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                      </Link>
                    )
                  })}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <Link
                  to="/assistant"
                  className="inline-flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  Ask AI about this memory
                </Link>
                <Link
                  to="/knowledge-graph"
                  className="inline-flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <GitBranch className="w-4 h-4 text-cyan-500" />
                  View in knowledge graph
                </Link>
                <Link
                  to="/timeline"
                  className="inline-flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Clock className="w-4 h-4 text-emerald-500" />
                  View on timeline
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
