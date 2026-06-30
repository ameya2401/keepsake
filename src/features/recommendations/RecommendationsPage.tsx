// ============================================================
// MemoryVerse — Recommendations Page (Phase 3)
// Contextual career recommendations from the intelligence engine
// ============================================================

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb, RefreshCw, Check, TrendingUp,
  FileText, Zap, BookOpen, Link2, AlertCircle, Sparkles
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, Button, Badge, Spinner } from '@/components/ui'
import { useAuth } from '@/providers/AuthProvider'
import { fetchRecommendations, generateRecommendations, dismissRecommendation } from '@/lib/recommendation-engine'
import type { RecommendationItem } from '@/lib/recommendation-engine'

// ─────────────────────────────────────────────────────────────
// Recommendation type config
// ─────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, {
  icon: React.ReactNode
  label: string
  color: string
  bgColor: string
}> = {
  resume_update: {
    icon: <FileText className="w-4 h-4" />,
    label: 'Resume',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  portfolio_suggestion: {
    icon: <BookOpen className="w-4 h-4" />,
    label: 'Portfolio',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  career_insight: {
    icon: <TrendingUp className="w-4 h-4" />,
    label: 'Career Insight',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  missing_metadata: {
    icon: <AlertCircle className="w-4 h-4" />,
    label: 'Missing Data',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  skill_gap: {
    icon: <Zap className="w-4 h-4" />,
    label: 'Skill Gap',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  relationship_suggestion: {
    icon: <Link2 className="w-4 h-4" />,
    label: 'Connection',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
}

const IMPACT_CONFIG: Record<string, { label: string; color: string }> = {
  high: { label: 'High Impact', color: 'text-red-500 bg-red-500/10' },
  medium: { label: 'Medium Impact', color: 'text-amber-500 bg-amber-500/10' },
  low: { label: 'Low Impact', color: 'text-emerald-500 bg-emerald-500/10' },
}

// ─────────────────────────────────────────────────────────────
// Single Recommendation Card
// ─────────────────────────────────────────────────────────────

function RecommendationCard({
  rec,
  onDismiss,
}: {
  rec: RecommendationItem
  onDismiss: (id: string) => void
}) {
  const [isDismissing, setIsDismissing] = useState(false)
  const typeConfig = TYPE_CONFIG[rec.type] || TYPE_CONFIG.career_insight
  const impactConfig = IMPACT_CONFIG[rec.impact] || IMPACT_CONFIG.medium

  const handleDismiss = async () => {
    setIsDismissing(true)
    await dismissRecommendation(rec.id)
    onDismiss(rec.id)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
    >
      <Card className="hover:border-primary/30 transition-all">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${typeConfig.bgColor} ${typeConfig.color}`}>
              {typeConfig.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge className={`text-xs ${impactConfig.color}`}>
                  {impactConfig.label}
                </Badge>
                <Badge variant="outline" className={`text-xs ${typeConfig.color}`}>
                  {typeConfig.label}
                </Badge>
              </div>
              <h3 className="font-semibold text-sm mb-1.5">{rec.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{rec.description}</p>
            </div>

            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              disabled={isDismissing}
              className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-50 text-muted-foreground hover:text-foreground"
              title="Dismiss"
            >
              {isDismissing
                ? <Spinner size="sm" />
                : <Check className="w-4 h-4" />
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Recommendations Page
// ─────────────────────────────────────────────────────────────

export default function RecommendationsPage() {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadRecommendations = useCallback(async () => {
    if (!user?.id) return
    try {
      const data = await fetchRecommendations(user.id)
      setRecommendations(data)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => { loadRecommendations() }, [loadRecommendations])

  const handleRefresh = async () => {
    if (!user?.id || isRefreshing) return
    setIsRefreshing(true)
    try {
      await generateRecommendations(user.id)
      await loadRecommendations()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleDismiss = (id: string) => {
    setRecommendations((prev) => prev.filter((r) => r.id !== id))
  }

  const highImpact = recommendations.filter((r) => r.impact === 'high')
  const mediumImpact = recommendations.filter((r) => r.impact === 'medium')
  const lowImpact = recommendations.filter((r) => r.impact === 'low')

  return (
    <AppShell
      title="Recommendations"
      breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Recommendations' }]}
    >
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-amber-500" />
              Smart Recommendations
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Personalized insights based on your memory collection — never generic advice
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        {recommendations.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-red-500">{highImpact.length}</p>
                <p className="text-xs text-muted-foreground">High Impact</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-amber-500">{mediumImpact.length}</p>
                <p className="text-xs text-muted-foreground">Medium Impact</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-emerald-500">{lowImpact.length}</p>
                <p className="text-xs text-muted-foreground">Low Impact</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : recommendations.length === 0 ? (
          <Card>
            <CardContent className="p-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">All caught up!</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
                No active recommendations. Upload more documents or refresh to generate new insights
                based on your growing memory collection.
              </p>
              <Button onClick={handleRefresh} isLoading={isRefreshing}>
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Generate Recommendations
              </Button>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {/* High impact first */}
            {highImpact.length > 0 && (
              <div key="high" className="space-y-3">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  High Impact
                </h2>
                {highImpact.map((r) => (
                  <RecommendationCard key={r.id} rec={r} onDismiss={handleDismiss} />
                ))}
              </div>
            )}
            {mediumImpact.length > 0 && (
              <div key="medium" className="space-y-3">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  Medium Impact
                </h2>
                {mediumImpact.map((r) => (
                  <RecommendationCard key={r.id} rec={r} onDismiss={handleDismiss} />
                ))}
              </div>
            )}
            {lowImpact.length > 0 && (
              <div key="low" className="space-y-3">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  Low Impact
                </h2>
                {lowImpact.map((r) => (
                  <RecommendationCard key={r.id} rec={r} onDismiss={handleDismiss} />
                ))}
              </div>
            )}
          </AnimatePresence>
        )}

        {/* Tip */}
        {!isLoading && (
          <p className="text-xs text-center text-muted-foreground">
            Dismiss recommendations you've acted on. MemoryVerse learns from your collection as you add more memories.
          </p>
        )}
      </div>
    </AppShell>
  )
}
