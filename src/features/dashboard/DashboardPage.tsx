// ============================================================
// MemoryVerse — Dashboard (Phase 4)
// Personalized home with live stats, AI insights, and daily digest
// ============================================================

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/providers/AuthProvider'
import { AppShell } from '@/components/layout/AppShell'
import {
  Brain, Upload, BookOpen, GitBranch, TrendingUp, Star,
  Clock, Zap, FileText, Award, Briefcase, Code,
  Sparkles, ArrowRight, RefreshCw, Loader2, MessageSquare,
  Target, Calendar
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { fetchRecommendations } from '@/lib/recommendation-engine'
import type { RecommendationItem } from '@/lib/recommendation-engine'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface DashboardStats {
  totalMemories: number
  projects: number
  certificates: number
  internships: number
  skills: number
  connections: number
  timelineEvents: number
  aiInsights: number
  processedToday: number
  weeklyGrowth: number
}

interface RecentMemory {
  id: string
  title: string
  category: string | null
  processing_status: string
  created_at: string
}

// ─────────────────────────────────────────────────────────────
// Skeleton Loader
// ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card p-5 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="h-7 w-12 bg-muted rounded" />
        </div>
        <div className="w-10 h-10 rounded-xl bg-muted" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number
  icon: React.ElementType
  color: string
  trend?: string
  delay?: number
  href?: string
}

function StatCard({ label, value, icon: Icon, color, trend, delay = 0, href }: StatCardProps) {
  const content = (
    <Card className="relative overflow-hidden group hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            {trend && (
              <p className="text-xs text-emerald-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {trend}
              </p>
            )}
          </div>
          <div className={`p-2.5 rounded-xl ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className={`absolute bottom-0 left-0 right-0 h-0.5 opacity-50 ${color.replace('/10', '/60')}`} />
      </CardContent>
    </Card>
  )

  const wrapped = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      {content}
    </motion.div>
  )

  return href ? <Link to={href}>{wrapped}</Link> : wrapped
}

// ─────────────────────────────────────────────────────────────
// AI Insight Chip
// ─────────────────────────────────────────────────────────────

function InsightChip({ rec }: { rec: RecommendationItem }) {
  const impactColor = rec.impact === 'high'
    ? 'border-red-500/30 bg-red-500/5'
    : rec.impact === 'medium'
    ? 'border-amber-500/30 bg-amber-500/5'
    : 'border-emerald-500/30 bg-emerald-500/5'

  return (
    <Link to="/recommendations">
      <div className={cn(
        'flex items-start gap-3 p-3 rounded-xl border transition-all hover:shadow-sm cursor-pointer',
        impactColor
      )}>
        <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{rec.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{rec.description}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      </div>
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────
// Recent Memory Row
// ─────────────────────────────────────────────────────────────

const CATEGORY_EMOJIS: Record<string, string> = {
  certificate: '🏆',
  internship: '💼',
  project: '⚡',
  achievement: '🌟',
  hackathon: '🚀',
  resume: '📄',
  course_completion: '📚',
  workshop: '🔧',
  research: '🔬',
  portfolio: '🎨',
  other: '📎',
}

function RecentMemoryRow({ memory }: { memory: RecentMemory }) {
  const emoji = CATEGORY_EMOJIS[memory.category || 'other'] || '📎'
  const isProcessed = memory.processing_status === 'completed'
  const isProcessing = memory.processing_status === 'processing' || memory.processing_status === 'queued'

  return (
    <Link to={`/memories/${memory.id}`}>
      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer group">
        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-base">
          {isProcessing ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
              <Brain className="w-4 h-4 text-violet-500" />
            </motion.div>
          ) : emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{memory.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {memory.category && (
              <span className="text-xs text-muted-foreground capitalize">{memory.category.replace('_', ' ')}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isProcessing && (
            <Badge className="text-[10px] bg-violet-500/10 text-violet-500 border-violet-500/20">
              <Loader2 className="w-2.5 h-2.5 mr-1 animate-spin" />
              Processing
            </Badge>
          )}
          {isProcessed && (
            <Badge className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              Ready
            </Badge>
          )}
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { profile, user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalMemories: 0, projects: 0, certificates: 0, internships: 0,
    skills: 0, connections: 0, timelineEvents: 0, aiInsights: 0,
    processedToday: 0, weeklyGrowth: 0,
  })
  const [recentMemories, setRecentMemories] = useState<RecentMemory[]>([])
  const [insights, setInsights] = useState<RecommendationItem[]>([])

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'there'
  const firstName = displayName.split(' ')[0]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const loadDashboard = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [
        docsResult, skillsResult, connectionsResult,
        timelineResult, recommendationsResult, recentResult
      ] = await Promise.all([
        supabase.from('documents').select('id, category, processing_status, created_at').eq('user_id', user.id),
        supabase.from('skills').select('id').eq('user_id', user.id),
        supabase.from('knowledge_edges').select('id').eq('user_id', user.id),
        supabase.from('timeline_events').select('id').eq('user_id', user.id),
        fetchRecommendations(user.id),
        supabase
          .from('documents')
          .select('id, title, category, processing_status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      const docs = docsResult.data || []
      const processedToday = docs.filter((d: { created_at: string }) => {
        const created = new Date(d.created_at)
        created.setHours(0, 0, 0, 0)
        return created.getTime() === today.getTime()
      }).length

      // Weekly growth
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const thisWeek = docs.filter((d: { created_at: string }) => new Date(d.created_at) >= weekAgo).length

      setStats({
        totalMemories: docs.length,
        projects: docs.filter((d: { category: string }) => d.category === 'project').length,
        certificates: docs.filter((d: { category: string }) => d.category === 'certificate').length,
        internships: docs.filter((d: { category: string }) => d.category === 'internship').length,
        skills: skillsResult.data?.length || 0,
        connections: connectionsResult.data?.length || 0,
        timelineEvents: timelineResult.data?.length || 0,
        aiInsights: recommendationsResult.length,
        processedToday,
        weeklyGrowth: thisWeek,
      })

      setRecentMemories((recentResult.data || []) as RecentMemory[])
      setInsights(recommendationsResult.slice(0, 3))
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  // Memory health score (derived from stats)
  const healthScore = Math.min(100, Math.round(
    (stats.totalMemories > 0 ? 20 : 0) +
    (stats.skills > 5 ? 20 : stats.skills * 4) +
    (stats.connections > 10 ? 20 : stats.connections * 2) +
    (stats.timelineEvents > 5 ? 20 : stats.timelineEvents * 4) +
    (stats.aiInsights > 0 ? 20 : 0)
  ))

  const statCards = [
    { label: 'Total Memories', value: stats.totalMemories, icon: Brain, color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400', href: '/memories' },
    { label: 'Projects', value: stats.projects, icon: Code, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', href: '/memories' },
    { label: 'Certificates', value: stats.certificates, icon: Award, color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400', href: '/memories' },
    { label: 'Internships', value: stats.internships, icon: Briefcase, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', href: '/memories' },
    { label: 'Skills Identified', value: stats.skills, icon: Star, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { label: 'Connections', value: stats.connections, icon: GitBranch, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', href: '/knowledge-graph' },
    { label: 'Timeline Events', value: stats.timelineEvents, icon: Clock, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', href: '/timeline' },
    { label: 'AI Insights', value: stats.aiInsights, icon: Zap, color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', href: '/recommendations' },
  ]

  return (
    <AppShell title="Dashboard" breadcrumb={[{ label: 'Dashboard' }]}>
      <div className="p-6 max-w-7xl mx-auto space-y-8">

        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-600 p-6 text-white"
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-8 -right-8 w-48 h-48 bg-white rounded-full blur-3xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-300 rounded-full blur-2xl" />
          </div>

          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <p className="text-violet-200 text-sm font-medium">{greeting} 👋</p>
              <h2 className="text-2xl font-bold">{firstName}</h2>
              {stats.totalMemories > 0 ? (
                <div className="space-y-1">
                  <p className="text-violet-100 text-sm">
                    MemoryVerse has indexed <strong>{stats.totalMemories} memories</strong> and discovered{' '}
                    <strong>{stats.connections} knowledge connections</strong>.
                  </p>
                  {stats.processedToday > 0 && (
                    <p className="text-violet-200 text-xs flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {stats.processedToday} new memories processed today
                    </p>
                  )}
                  {stats.weeklyGrowth > 0 && (
                    <p className="text-violet-200 text-xs flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3" />
                      {stats.weeklyGrowth} uploads this week
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-violet-100 text-sm max-w-md">
                  Your knowledge universe is ready. Upload your first memory and watch MemoryVerse
                  build your professional intelligence map.
                </p>
              )}

              <div className="pt-2 flex items-center gap-2 flex-wrap">
                <Link
                  to="/upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-medium transition-colors border border-white/20"
                >
                  <Upload className="w-4 h-4" />
                  Upload Memory
                </Link>
                <Link
                  to="/assistant"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium transition-colors border border-white/10"
                >
                  <MessageSquare className="w-4 h-4" />
                  Ask AI
                </Link>
              </div>
            </div>

            {/* Health score circle */}
            <div className="hidden sm:flex flex-col items-center gap-1">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                  <circle
                    cx="40" cy="40" r="32"
                    fill="none"
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 32 * healthScore / 100} ${2 * Math.PI * 32}`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-white">{healthScore}</span>
                  <span className="text-[9px] text-violet-200">/100</span>
                </div>
              </div>
              <p className="text-[10px] text-violet-200">Memory Health</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Your Memory Library
            </h3>
            <button
              onClick={loadDashboard}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={cn('w-3 h-3', isLoading && 'animate-spin')} />
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {statCards.map((stat, i) => (
                <StatCard key={stat.label} {...stat} delay={i * 0.05} />
              ))}
            </div>
          )}
        </div>

        {/* Two-column layout: Recent + AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Memories */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  Recent Memories
                </CardTitle>
                <Link to="/memories" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                      <div className="w-9 h-9 rounded-xl bg-muted flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-muted rounded w-3/4" />
                        <div className="h-2.5 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentMemories.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">No memories yet</p>
                  <Link
                    to="/upload"
                    className="text-xs text-primary hover:underline"
                  >
                    Upload your first memory →
                  </Link>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentMemories.map((mem) => (
                    <RecentMemoryRow key={mem.id} memory={mem} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  AI Insights
                </CardTitle>
                <Link to="/recommendations" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-3 rounded-xl border animate-pulse space-y-2">
                      <div className="h-3 bg-muted rounded w-2/3" />
                      <div className="h-2.5 bg-muted rounded w-full" />
                    </div>
                  ))}
                </div>
              ) : insights.length === 0 ? (
                <div className="text-center py-8">
                  <Zap className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">No insights yet</p>
                  <p className="text-xs text-muted-foreground">
                    Upload memories to generate personalized insights
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {insights.map((insight) => (
                    <InsightChip key={insight.id} rec={insight} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: MessageSquare, label: 'Ask AI', desc: 'Chat with your memories', href: '/assistant', color: 'bg-violet-500/10 text-violet-500' },
              { icon: Upload, label: 'Upload', desc: 'Add a new memory', href: '/upload', color: 'bg-indigo-500/10 text-indigo-500' },
              { icon: GitBranch, label: 'Knowledge Graph', desc: 'Explore connections', href: '/knowledge-graph', color: 'bg-cyan-500/10 text-cyan-500' },
              { icon: Clock, label: 'Timeline', desc: 'View your journey', href: '/timeline', color: 'bg-emerald-500/10 text-emerald-500' },
            ].map((action, i) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 + 0.3 }}
              >
                <Link to={action.href}>
                  <Card className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group h-full">
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      <div className={`p-3 rounded-xl ${action.color} transition-transform group-hover:scale-110`}>
                        <action.icon className="w-5 h-5" />
                      </div>
                      <p className="font-medium text-sm">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.desc}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  )
}
