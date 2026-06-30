// ============================================================
// MemoryVerse — Semantic Search Page (Phase 3)
// Understands meaning, not just keywords
// ============================================================

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Sparkles, Clock, FileText, Tag,
  ChevronRight, Loader2, AlertCircle, X
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, Badge, Input } from '@/components/ui'
import { useAuth } from '@/providers/AuthProvider'
import { semanticSearch } from '@/lib/embedding-service'
import { supabase } from '@/lib/supabase'
import type { SemanticSearchResult } from '@/lib/embedding-service'

// ─────────────────────────────────────────────────────────────
// Category colors
// ─────────────────────────────────────────────────────────────

const CATEGORY_BADGE: Record<string, string> = {
  certificate: 'bg-blue-500/10 text-blue-500',
  internship: 'bg-emerald-500/10 text-emerald-500',
  project: 'bg-amber-500/10 text-amber-500',
  achievement: 'bg-pink-500/10 text-pink-500',
  hackathon: 'bg-violet-500/10 text-violet-500',
  resume: 'bg-orange-500/10 text-orange-500',
  research: 'bg-indigo-500/10 text-indigo-500',
  other: 'bg-muted text-muted-foreground',
}

// ─────────────────────────────────────────────────────────────
// Suggested queries
// ─────────────────────────────────────────────────────────────

const SUGGESTED_QUERIES = [
  'Show every AI project',
  'Where did I use PostgreSQL?',
  'Which internships taught backend development?',
  'Find all certificates related to cloud computing',
  'Which projects helped me learn React?',
  'Everything about machine learning',
  'Show my recent achievements',
  'What hackathons did I participate in?',
]

// ─────────────────────────────────────────────────────────────
// Recent keyword search (fallback)
// ─────────────────────────────────────────────────────────────

interface KeywordResult {
  id: string
  title: string
  category: string | null
  ai_summary: string | null
  tags: string[]
  similarity?: number
}

async function keywordSearch(query: string, userId: string): Promise<KeywordResult[]> {
  const { data } = await supabase
    .from('documents')
    .select('id, title, category, ai_summary, tags')
    .eq('user_id', userId)
    .eq('processing_status', 'completed')
    .or(`title.ilike.%${query}%,ai_summary.ilike.%${query}%`)
    .limit(10)

  return (data || []) as KeywordResult[]
}

// ─────────────────────────────────────────────────────────────
// Search Result Card
// ─────────────────────────────────────────────────────────────

function SearchResultCard({
  result,
  rank,
}: {
  result: SemanticSearchResult | KeywordResult
  rank: number
}) {
  const similarity = 'similarity' in result ? result.similarity : undefined
  const category = result.category || 'other'
  const badgeClass = CATEGORY_BADGE[category] || CATEGORY_BADGE.other

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
    >
      <Card className="hover:border-primary/40 transition-all cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-mono">#{rank + 1}</span>
                <Badge className={`text-xs ${badgeClass}`}>
                  {category.replace('_', ' ')}
                </Badge>
                {similarity !== undefined && (
                  <Badge variant="outline" className="text-xs">
                    {Math.round(similarity * 100)}% match
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                {result.title}
              </h3>
              {result.ai_summary && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {result.ai_summary}
                </p>
              )}
              {result.tags && result.tags.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <Tag className="w-3 h-3 text-muted-foreground" />
                  {result.tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Search history
// ─────────────────────────────────────────────────────────────

function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('mv_search_history') || '[]') as string[]
    } catch {
      return []
    }
  })

  const addToHistory = useCallback((query: string) => {
    setHistory((prev) => {
      const next = [query, ...prev.filter((q) => q !== query)].slice(0, 5)
      localStorage.setItem('mv_search_history', JSON.stringify(next))
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    localStorage.removeItem('mv_search_history')
    setHistory([])
  }, [])

  return { history, addToHistory, clearHistory }
}

// ─────────────────────────────────────────────────────────────
// Main Search Page
// ─────────────────────────────────────────────────────────────

export default function SearchPage() {
  const { user } = useAuth()
  const { history, addToHistory, clearHistory } = useSearchHistory()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<SemanticSearchResult | KeywordResult>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchMode, setSearchMode] = useState<'semantic' | 'keyword' | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim()
      if (!trimmed || !user?.id) return

      setIsSearching(true)
      setHasSearched(true)
      setErrorMsg(null)
      setResults([])
      addToHistory(trimmed)

      try {
        // Try semantic search first
        const semanticResults = await semanticSearch(trimmed, user.id, 0.35, 12)

        if (semanticResults.length > 0) {
          setResults(semanticResults)
          setSearchMode('semantic')
        } else {
          // Fall back to keyword search
          const kwResults = await keywordSearch(trimmed, user.id)
          setResults(kwResults)
          setSearchMode('keyword')
        }

        // Log to search_history
        await supabase.from('search_history').insert({
          user_id: user.id,
          query: trimmed,
          result_count: semanticResults.length,
          search_type: semanticResults.length > 0 ? 'semantic' : 'keyword',
        })
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Search failed')
        setSearchMode(null)
      } finally {
        setIsSearching(false)
      }
    },
    [user?.id, addToHistory]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  return (
    <AppShell
      title="Search"
      breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Search' }]}
    >
      <div className="p-6 max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Semantic Search</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Search by meaning, not just keywords. Ask questions about your memories in natural language.
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about your memories…"
              className="pl-12 pr-16 h-14 text-base rounded-2xl border-2 focus-visible:ring-0 focus-visible:border-primary/60"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setResults([]); setHasSearched(false) }}
                className="absolute right-12 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={!query.trim() || isSearching}
              className="absolute right-3 w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 transition-colors hover:bg-primary/90"
            >
              {isSearching
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <ChevronRight className="w-4 h-4" />
              }
            </button>
          </div>
        </form>

        {/* Search mode indicator */}
        {searchMode && !isSearching && (
          <div className="flex items-center justify-center gap-2">
            <Badge
              className={searchMode === 'semantic'
                ? 'bg-violet-500/10 text-violet-500'
                : 'bg-amber-500/10 text-amber-500'
              }
            >
              {searchMode === 'semantic' ? (
                <><Sparkles className="w-3 h-3 mr-1" />Semantic Match</>
              ) : (
                <><Search className="w-3 h-3 mr-1" />Keyword Match</>
              )}
            </Badge>
            <span className="text-xs text-muted-foreground">{results.length} results</span>
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/10">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Results */}
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-12 gap-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-violet-500 animate-pulse" />
              </div>
              <p className="text-muted-foreground text-sm">Reasoning across your memories…</p>
            </motion.div>
          ) : hasSearched && results.length === 0 && !errorMsg ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No memories found</h3>
              <p className="text-sm text-muted-foreground">
                Try a different query or upload more documents to expand your knowledge base.
              </p>
            </motion.div>
          ) : results.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {results.map((r, i) => (
                <SearchResultCard
                  key={'documentId' in r ? r.documentId : r.id}
                  result={r}
                  rank={i}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Suggested queries */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Try these queries
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_QUERIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => { setQuery(q); handleSearch(q) }}
                      className="flex items-center gap-2 p-3 rounded-xl border text-left hover:bg-accent hover:border-border/70 transition-colors group"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                      <span className="text-sm">{q}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search history */}
              {history.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Recent searches
                    </h3>
                    <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-foreground">
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1">
                    {history.map((q) => (
                      <button
                        key={q}
                        onClick={() => { setQuery(q); handleSearch(q) }}
                        className="flex items-center gap-2 w-full p-2 rounded-lg text-left hover:bg-accent transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm">{q}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  )
}
