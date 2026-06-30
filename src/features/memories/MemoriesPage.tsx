import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, RefreshCw,
  LayoutGrid, List,
  Clock, CheckCircle2,
  AlertCircle, Loader2, Brain,
  Calendar, Zap, RotateCcw,
  Image as ImageIcon, FileText as FileTextIcon, File as FileIcon, Building2
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button, Card, CardContent, Badge, Spinner, Input } from '@/components/ui'
import { cn, timeAgo, formatFileSize, CATEGORY_COLORS, formatCategoryLabel } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import { QUERY_KEYS, DOCUMENT_CATEGORIES, PROCESSING_STATUS_CONFIG } from '@/constants/app'
import type { Document, ProcessingStatus, DocumentCategory } from '@/types/database'

// ─────────────────────────────────────────────────────────────
// Query
// ─────────────────────────────────────────────────────────────

async function fetchDocuments(userId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Document[]
}

// ─────────────────────────────────────────────────────────────
// File Type Icon
// ─────────────────────────────────────────────────────────────

function DocIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType?.startsWith('image/')) return <ImageIcon className={className} />
  if (mimeType === 'application/pdf') return <FileTextIcon className={className} />
  return <FileIcon className={className} />
}

// ─────────────────────────────────────────────────────────────
// Processing Status Badge
// ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProcessingStatus }) {
  const cfg = PROCESSING_STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', cfg.bg, cfg.color)}>
      {status === 'processing' || status === 'queued' ? (
        <Loader2 className="w-2.5 h-2.5 animate-spin" />
      ) : status === 'completed' ? (
        <CheckCircle2 className="w-2.5 h-2.5" />
      ) : status === 'failed' ? (
        <AlertCircle className="w-2.5 h-2.5" />
      ) : (
        <Clock className="w-2.5 h-2.5" />
      )}
      {cfg.label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// Memory Card — Grid View
// ─────────────────────────────────────────────────────────────

function MemoryCard({ doc }: { doc: Document }) {
  const category = doc.category
  const status = doc.processing_status
  const isProcessed = status === 'completed'
  const isProcessing = status === 'processing' || status === 'queued'
  const tags = doc.tags || []
  const skills = (doc.metadata as Record<string, unknown>)?.skills as string[] | undefined

  const categoryConfig = DOCUMENT_CATEGORIES.find((c) => c.value === category)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
    >
      <Card className={cn(
        'group hover:border-primary/40 transition-all duration-200 hover:shadow-md hover:shadow-primary/5 overflow-hidden',
        isProcessing && 'border-violet-500/30 bg-violet-500/5'
      )}>
        <CardContent className="p-4 space-y-3">

          {/* Top: Icon + Status */}
          <div className="flex items-start justify-between gap-2">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              category ? CATEGORY_COLORS[category]?.replace('text-', 'bg-').replace('/10', '/10') : 'bg-muted'
            )}>
              {isProcessing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Brain className="w-5 h-5 text-violet-500" />
                </motion.div>
              ) : categoryConfig ? (
                <span className="text-lg">{categoryConfig.emoji}</span>
              ) : (
                <DocIcon mimeType={doc.file_type} className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <StatusBadge status={status} />
          </div>

          {/* Title + Category */}
          <div>
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {doc.title}
            </h3>
            {category && (
              <p className={cn('text-xs mt-0.5', CATEGORY_COLORS[category])}>
                {formatCategoryLabel(category)}
              </p>
            )}
          </div>

          {/* Summary */}
          {isProcessed && doc.ai_summary && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {doc.ai_summary}
            </p>
          )}

          {/* Processing state */}
          {isProcessing && (
            <div className="flex items-center gap-1.5 text-xs text-violet-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>AI is creating your memory...</span>
            </div>
          )}

          {/* Skills pills */}
          {isProcessed && skills && skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {skills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-400"
                >
                  <Zap className="w-2 h-2" />
                  {skill}
                </span>
              ))}
              {skills.length > 3 && (
                <span className="text-[10px] text-muted-foreground">+{skills.length - 3} more</span>
              )}
            </div>
          )}

          {/* Tags */}
          {isProcessed && tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
              {tags.length > 4 && (
                <span className="text-[10px] text-muted-foreground">+{tags.length - 4}</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar className="w-2.5 h-2.5" />
              {timeAgo(doc.created_at)}
            </div>
            {isProcessed && doc.confidence_score !== null && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-medium',
                  doc.confidence_score > 0.8 ? 'bg-emerald-500/10 text-emerald-500' :
                  doc.confidence_score > 0.6 ? 'bg-yellow-500/10 text-yellow-500' :
                  'bg-red-500/10 text-red-500'
                )}>
                  {Math.round(doc.confidence_score * 100)}% confidence
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Memory Row — List View
// ─────────────────────────────────────────────────────────────

function MemoryRow({ doc }: { doc: Document }) {
  const category = doc.category
  const categoryConfig = DOCUMENT_CATEGORIES.find((c) => c.value === category)
  const tags = doc.tags || []
  const metadata = doc.metadata as Record<string, unknown> | null
  const org = metadata?.organization as string | undefined
  const isProcessing = doc.processing_status === 'processing' || doc.processing_status === 'queued'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border hover:border-primary/30 transition-all cursor-pointer hover:bg-accent/20',
        isProcessing && 'border-violet-500/20 bg-violet-500/5'
      )}
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
        {isProcessing ? (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <Brain className="w-4 h-4 text-violet-500" />
          </motion.div>
        ) : categoryConfig ? (
          <span>{categoryConfig.emoji}</span>
        ) : (
          <DocIcon mimeType={doc.file_type} className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium truncate">{doc.title}</p>
          {category && (
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0', CATEGORY_COLORS[category])}>
              {formatCategoryLabel(category)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {org && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Building2 className="w-2.5 h-2.5" />
              {org}
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">{formatFileSize(doc.file_size)}</span>
          {tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0">{tag}</Badge>
          ))}
        </div>
      </div>

      {/* Status + Date */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <StatusBadge status={doc.processing_status} />
        <span className="text-[10px] text-muted-foreground">{timeAgo(doc.created_at)}</span>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Brain className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-2">
        {hasFilter ? 'No memories match your filter' : 'No memories yet'}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {hasFilter
          ? 'Try adjusting your search or filter criteria'
          : 'Upload your first document and MemoryVerse will transform it into an intelligent Memory Object'}
      </p>
      {!hasFilter && (
        <Link
          to="/upload"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Upload your first memory
        </Link>
      )}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Stats Bar
// ─────────────────────────────────────────────────────────────

function StatsBar({ docs }: { docs: Document[] }) {
  const completed = docs.filter((d) => d.processing_status === 'completed').length
  const processing = docs.filter((d) => ['processing', 'queued'].includes(d.processing_status)).length
  const failed = docs.filter((d) => d.processing_status === 'failed').length

  const allSkills = new Set(
    docs.flatMap((d) => (d.metadata as Record<string, unknown>)?.skills as string[] || [])
  ).size

  const stats = [
    { label: 'Total', value: docs.length, color: 'text-foreground' },
    { label: 'Processed', value: completed, color: 'text-emerald-500' },
    { label: 'Processing', value: processing, color: 'text-violet-500' },
    { label: 'Failed', value: failed, color: 'text-red-500' },
    { label: 'Skills Found', value: allSkills, color: 'text-cyan-500' },
  ]

  return (
    <div className="flex items-center gap-4 px-1 flex-wrap">
      {stats.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2">
          {i > 0 && <span className="text-border hidden sm:inline">·</span>}
          <span className="text-xs text-muted-foreground">{s.label}:</span>
          <span className={cn('text-sm font-semibold', s.color)}>{s.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main MemoriesPage
// ─────────────────────────────────────────────────────────────

type ViewMode = 'grid' | 'list'

export default function MemoriesPage() {
  const { user } = useAuth()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProcessingStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'all'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const { data: documents = [], isLoading, error, refetch } = useQuery({
    queryKey: [...QUERY_KEYS.DOCUMENTS, user?.id],
    queryFn: () => fetchDocuments(user!.id),
    enabled: !!user,
    refetchInterval: (query) => {
      // Auto-refresh every 3s if any doc is still processing
      const docs = query.state.data as Document[] | undefined
      if (docs?.some((d) => ['processing', 'queued'].includes(d.processing_status))) {
        return 3000
      }
      return false
    },
  })

  // Filter documents
  const filtered = documents.filter((doc) => {
    const matchesSearch =
      !search ||
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.original_filename.toLowerCase().includes(search.toLowerCase()) ||
      doc.ai_summary?.toLowerCase().includes(search.toLowerCase()) ||
      doc.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || doc.processing_status === statusFilter
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const hasFilter = !!search || statusFilter !== 'all' || categoryFilter !== 'all'

  return (
    <AppShell
      title="Memories"
      breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Memories' }]}
    >
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Your Memories</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              All your uploaded documents, processed into intelligent Memory Objects
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
            <Link
            to="/upload"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Upload New
          </Link>
          </div>
        </div>

        {/* Stats bar */}
        {documents.length > 0 && <StatsBar docs={documents} />}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search memories, skills, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              id="memories-search"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProcessingStatus | 'all')}
            className="px-3 py-2 text-sm rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            id="status-filter"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="queued">Queued</option>
            <option value="uploaded">Uploaded</option>
            <option value="failed">Failed</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as DocumentCategory | 'all')}
            className="px-3 py-2 text-sm rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            id="category-filter"
          >
            <option value="all">All Categories</option>
            {DOCUMENT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>

          {/* View Mode */}
          <div className="flex rounded-lg border overflow-hidden shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-3 py-2 transition-colors',
                viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              )}
              id="view-grid"
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-2 transition-colors',
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              )}
              id="view-list"
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-16 text-center">
            <AlertCircle className="w-10 h-10 text-destructive mb-3" />
            <p className="text-sm text-muted-foreground">Failed to load memories</p>
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="mt-3">
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Try again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasFilter={hasFilter} />
        ) : viewMode === 'grid' ? (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((doc) => (
                <MemoryCard key={doc.id} doc={doc} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div layout className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filtered.map((doc) => (
                <MemoryRow key={doc.id} doc={doc} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Results count */}
        {filtered.length > 0 && (
          <p className="text-xs text-muted-foreground text-center pb-4">
            Showing {filtered.length} of {documents.length} memories
          </p>
        )}
      </div>
    </AppShell>
  )
}
