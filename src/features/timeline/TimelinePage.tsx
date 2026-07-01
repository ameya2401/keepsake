// ============================================================
// Keepsake — Timeline Page (Phase 3)
// Chronological view with intelligence patterns and milestone detection
// ============================================================

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, Calendar, Plus, Sparkles, TrendingUp,
  AlertCircle, Star, Building2, X, ChevronDown, ChevronRight
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import {
  Card, CardContent, CardHeader, CardTitle,
  Badge, Button, Spinner
} from '@/components/ui'
import { useAuth } from '@/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { detectTimelinePatterns } from '@/lib/reasoning-api'
import type { TimelineEvent } from '@/types/database'
import type { TimelinePattern } from '@/lib/reasoning-api'

// ─────────────────────────────────────────────────────────────
// Category colors
// ─────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  certificate: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  internship: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  project: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  achievement: 'bg-pink-500/10 text-pink-500 border-pink-500/30',
  hackathon: 'bg-violet-500/10 text-violet-500 border-violet-500/30',
  resume: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  course_completion: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30',
  workshop: 'bg-teal-500/10 text-teal-500 border-teal-500/30',
  research: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30',
  portfolio: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  academic_transcript: 'bg-lime-500/10 text-lime-500 border-lime-500/30',
  other: 'bg-muted text-muted-foreground',
}

const CATEGORY_DOT: Record<string, string> = {
  certificate: 'bg-blue-500',
  internship: 'bg-emerald-500',
  project: 'bg-amber-500',
  achievement: 'bg-pink-500',
  hackathon: 'bg-violet-500',
  resume: 'bg-orange-500',
  course_completion: 'bg-cyan-500',
  workshop: 'bg-teal-500',
  research: 'bg-indigo-500',
  portfolio: 'bg-purple-500',
  academic_transcript: 'bg-lime-500',
  other: 'bg-muted',
}

const PATTERN_ICONS: Record<string, React.ReactNode> = {
  learning_streak: <Sparkles className="w-4 h-4 text-amber-500" />,
  skill_growth: <TrendingUp className="w-4 h-4 text-emerald-500" />,
  career_gap: <AlertCircle className="w-4 h-4 text-orange-500" />,
  technology_transition: <TrendingUp className="w-4 h-4 text-cyan-500" />,
  domain_change: <TrendingUp className="w-4 h-4 text-violet-500" />,
}

// ─────────────────────────────────────────────────────────────
// Group events by year
// ─────────────────────────────────────────────────────────────

function groupByYear(events: TimelineEvent[]): Map<number, TimelineEvent[]> {
  const groups = new Map<number, TimelineEvent[]>()
  for (const event of events) {
    const year = new Date(event.event_date).getFullYear()
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year)!.push(event)
  }
  return groups
}

// ─────────────────────────────────────────────────────────────
// Timeline Event Card
// ─────────────────────────────────────────────────────────────

function TimelineEventCard({ event }: { event: TimelineEvent }) {
  const [expanded, setExpanded] = useState(false)
  const colorClass = CATEGORY_COLORS[event.event_type || 'other'] || CATEGORY_COLORS.other
  const dotClass = CATEGORY_DOT[event.event_type || 'other'] || CATEGORY_DOT.other
  const date = new Date(event.event_date)
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="flex gap-4 group">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 mt-1 ring-2 ring-background ${dotClass} ${event.is_milestone ? 'ring-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : ''}`} />
        <div className="w-0.5 bg-border flex-1 mt-1" />
      </div>

      {/* Event card */}
      <motion.div
        layout
        className="flex-1 mb-4"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left p-4 rounded-xl border bg-card hover:bg-accent/30 transition-colors group-hover:border-border/70"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {event.is_milestone && (
                  <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                )}
                <h3 className="font-semibold text-sm truncate">{event.title}</h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`text-xs border ${colorClass}`}>
                  {event.event_type?.replace('_', ' ') || 'event'}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formattedDate}
                </span>
                {event.organization && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {event.organization}
                  </span>
                )}
              </div>
            </div>
            {event.description && (
              expanded
                ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>

          <AnimatePresence>
            {expanded && event.description && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t"
              >
                <p className="text-sm text-muted-foreground">{event.description}</p>
                {event.confidence_score && (
                  <p className="text-xs text-muted-foreground mt-2">
                    AI confidence: {Math.round(event.confidence_score * 100)}%
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Add Event Modal (lightweight inline form)
// ─────────────────────────────────────────────────────────────

function AddEventForm({ userId, onAdd }: { userId: string; onAdd: () => void }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !date) return
    setIsSaving(true)
    try {
      await supabase.from('timeline_events').insert({
        user_id: userId,
        title,
        event_date: date,
        description: description || null,
        source_type: 'manual',
      })
      setTitle('')
      setDate('')
      setDescription('')
      onAdd()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      <Card className="border-dashed border-primary/50">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <h4 className="text-sm font-semibold">Add Manual Event</h4>
            <input
              placeholder="Event title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" isLoading={isSaving}>
                Add Event
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setTitle(''); setDate(''); setDescription('') }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Timeline Page
// ─────────────────────────────────────────────────────────────

export default function TimelinePage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [patterns, setPatterns] = useState<TimelinePattern[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set())

  const loadTimeline = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const [eventsResult, patternsResult] = await Promise.all([
        supabase
          .from('timeline_events')
          .select('*')
          .eq('user_id', user.id)
          .order('event_date', { ascending: false }),
        detectTimelinePatterns(user.id),
      ])

      const data = (eventsResult.data || []) as TimelineEvent[]
      setEvents(data)
      setPatterns(patternsResult)

      // Expand most recent year by default
      if (data.length > 0) {
        const mostRecentYear = new Date(data[0].event_date).getFullYear()
        setExpandedYears(new Set([mostRecentYear]))
      }
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => { loadTimeline() }, [loadTimeline])

  const grouped = groupByYear(events)
  const years = Array.from(grouped.keys()).sort((a, b) => b - a)

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })
  }

  return (
    <AppShell
      title="Timeline"
      breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Timeline' }]}
    >
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Clock className="w-6 h-6 text-emerald-500" />
              Your Journey
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {events.length > 0
                ? `${events.length} events across ${years.length} years — automatically built from your memories`
                : 'A chronological view of your professional and academic life'}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            {showAddForm ? 'Cancel' : 'Add Event'}
          </Button>
        </div>

        {/* Add Event Form */}
        <AnimatePresence>
          {showAddForm && user && (
            <AddEventForm
              userId={user.id}
              onAdd={() => { setShowAddForm(false); loadTimeline() }}
            />
          )}
        </AnimatePresence>

        {/* Intelligence Patterns */}
        {patterns.length > 0 && (
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Intelligence Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {patterns.map((pattern, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">{PATTERN_ICONS[pattern.type]}</div>
                  <div>
                    <p className="text-sm font-medium">{pattern.title}</p>
                    <p className="text-xs text-muted-foreground">{pattern.description}</p>
                    {pattern.period && (
                      <p className="text-xs text-muted-foreground mt-0.5">{pattern.period}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Stats row */}
        {events.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-emerald-500">{events.length}</p>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-amber-500">
                  {events.filter((e) => e.is_milestone).length}
                </p>
                <p className="text-xs text-muted-foreground">Milestones</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-violet-500">{years.length}</p>
                <p className="text-xs text-muted-foreground">Years</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Timeline */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="p-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Clock className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Timeline is empty</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Upload documents with dates and Keepsake will automatically build your professional timeline.
                You can also add events manually using the button above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {years.map((year) => {
              const yearEvents = grouped.get(year) || []
              const isExpanded = expandedYears.has(year)

              return (
                <div key={year}>
                  <button
                    onClick={() => toggleYear(year)}
                    className="flex items-center gap-3 w-full text-left mb-3 group"
                  >
                    <div className="h-px flex-1 bg-border" />
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full border bg-card group-hover:bg-accent transition-colors">
                      <span className="text-sm font-bold">{year}</span>
                      <Badge variant="secondary" className="text-xs">{yearEvents.length}</Badge>
                      {isExpanded
                        ? <ChevronDown className="w-3 h-3 text-muted-foreground" />
                        : <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      }
                    </div>
                    <div className="h-px flex-1 bg-border" />
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-2"
                      >
                        {yearEvents.map((event) => (
                          <TimelineEventCard key={event.id} event={event} />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
