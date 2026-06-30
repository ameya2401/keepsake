import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, CheckCircle2, AlertCircle, Clock, Loader2,
  RotateCcw, RefreshCw, Zap
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button, Card, CardContent, Spinner } from '@/components/ui'
import { cn, timeAgo, formatCategoryLabel, CATEGORY_COLORS } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import { QUERY_KEYS, PROCESSING_STATUS_CONFIG } from '@/constants/app'
import type { AIJob, Document } from '@/types/database'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface JobWithDocument extends AIJob {
  document: Pick<Document, 'title' | 'file_type' | 'category' | 'original_filename'> | null
}

// ─────────────────────────────────────────────────────────────
// Query
// ─────────────────────────────────────────────────────────────

async function fetchJobs(userId: string): Promise<JobWithDocument[]> {
  const { data, error } = await supabase
    .from('ai_jobs')
    .select(`
      *,
      document:documents(title, file_type, category, original_filename)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data as JobWithDocument[]
}

// ─────────────────────────────────────────────────────────────
// Job Status Icon
// ─────────────────────────────────────────────────────────────

function JobStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    case 'failed':
      return <AlertCircle className="w-4 h-4 text-red-500" />
    case 'processing':
      return (
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Loader2 className="w-4 h-4 text-violet-500" />
        </motion.div>
      )
    case 'queued':
      return <Clock className="w-4 h-4 text-yellow-500" />
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />
  }
}

// ─────────────────────────────────────────────────────────────
// Job Card
// ─────────────────────────────────────────────────────────────

function JobCard({ job, onRetry }: { job: JobWithDocument; onRetry: (jobId: string) => void }) {
  const cfg = PROCESSING_STATUS_CONFIG[job.status as keyof typeof PROCESSING_STATUS_CONFIG]
  const doc = job.document
  const isActive = job.status === 'processing' || job.status === 'queued'
  const isFailed = job.status === 'failed'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        'p-4 rounded-xl border transition-colors',
        isActive ? 'border-violet-500/30 bg-violet-500/5' :
        isFailed ? 'border-red-500/20 bg-red-500/5' :
        'border-border bg-card'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-0.5">
          <JobStatusIcon status={job.status} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium truncate">
              {doc?.title || 'Unknown Document'}
            </p>
            {doc?.category && (
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0', CATEGORY_COLORS[doc.category])}>
                {formatCategoryLabel(doc.category)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
            <span className={cn('font-medium', cfg?.color)}>{cfg?.label || job.status}</span>
            {job.retry_count > 0 && (
              <span className="text-yellow-500">Retry #{job.retry_count}</span>
            )}
            <span>{timeAgo(job.created_at)}</span>
          </div>

          {/* Progress bar for active jobs */}
          {isActive && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Progress</span>
                <span>{job.progress}%</span>
              </div>
              <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${job.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}

          {/* Error message */}
          {isFailed && job.error_message && (
            <p className="text-xs text-red-400 bg-red-500/10 rounded-md px-2 py-1">
              {job.error_message}
            </p>
          )}
        </div>

        {/* Retry button */}
        {isFailed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRetry(job.id)}
            className="shrink-0 gap-1 text-xs"
          >
            <RotateCcw className="w-3 h-3" />
            Retry
          </Button>
        )}
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Stats Overview
// ─────────────────────────────────────────────────────────────

function ProcessingStats({ jobs }: { jobs: JobWithDocument[] }) {
  const counts = {
    queued: jobs.filter((j) => j.status === 'queued').length,
    processing: jobs.filter((j) => j.status === 'processing').length,
    completed: jobs.filter((j) => j.status === 'completed').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  }

  const total = jobs.length
  const successRate = total > 0 ? Math.round((counts.completed / total) * 100) : 0

  const stats = [
    { label: 'Queued', value: counts.queued, color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: Clock },
    { label: 'Processing', value: counts.processing, color: 'text-violet-500', bg: 'bg-violet-500/10', icon: Loader2 },
    { label: 'Completed', value: counts.completed, color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
    { label: 'Failed', value: counts.failed, color: 'text-red-500', bg: 'bg-red-500/10', icon: AlertCircle },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', stat.bg)}>
                <stat.icon className={cn('w-3.5 h-3.5', stat.color)} />
              </div>
            </div>
            <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
          </CardContent>
        </Card>
      ))}
      {total > 0 && (
        <Card className="col-span-2 sm:col-span-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Overall Success Rate</span>
              <span className={cn('text-sm font-bold', successRate > 80 ? 'text-emerald-500' : 'text-yellow-500')}>
                {successRate}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${successRate}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Processing Dashboard
// ─────────────────────────────────────────────────────────────

export default function ProcessingDashboard() {
  const { user } = useAuth()

  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: [...QUERY_KEYS.AI_JOBS, user?.id],
    queryFn: () => fetchJobs(user!.id),
    enabled: !!user,
    refetchInterval: (query) => {
      const jobList = query.state.data as JobWithDocument[] | undefined
      if (jobList?.some((j) => j.status === 'processing' || j.status === 'queued')) {
        return 2000
      }
      return false
    },
  })

  const handleRetry = async (_jobId: string) => {
    // Mark job for retry — re-run pipeline
    // For now, just refresh to show updated state
    await refetch()
  }

  const activeJobs = jobs.filter((j) => j.status === 'processing' || j.status === 'queued')
  const completedJobs = jobs.filter((j) => j.status === 'completed')
  const failedJobs = jobs.filter((j) => j.status === 'failed')

  return (
    <AppShell
      title="Processing"
      breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Processing' }]}
    >
      <div className="p-6 max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="w-6 h-6 text-violet-500" />
              Processing Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Monitor AI processing jobs for your uploaded documents
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* Stats */}
            {jobs.length > 0 && <ProcessingStats jobs={jobs} />}

            {/* Active Jobs */}
            {activeJobs.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-violet-500"
                  />
                  Active ({activeJobs.length})
                </h2>
                <AnimatePresence mode="popLayout">
                  {activeJobs.map((job) => (
                    <JobCard key={job.id} job={job} onRetry={handleRetry} />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Failed Jobs */}
            {failedJobs.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-red-500 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Failed ({failedJobs.length})
                </h2>
                <AnimatePresence mode="popLayout">
                  {failedJobs.map((job) => (
                    <JobCard key={job.id} job={job} onRetry={handleRetry} />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Completed Jobs */}
            {completedJobs.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-emerald-500 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Completed ({completedJobs.length})
                </h2>
                <AnimatePresence mode="popLayout">
                  {completedJobs.slice(0, 20).map((job) => (
                    <JobCard key={job.id} job={job} onRetry={handleRetry} />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Empty state */}
            {jobs.length === 0 && (
              <div className="flex flex-col items-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Zap className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">No processing jobs yet</h3>
                <p className="text-sm text-muted-foreground">
                  Upload documents and AI will automatically process them here
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
