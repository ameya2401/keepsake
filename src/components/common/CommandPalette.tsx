// ============================================================
// MemoryVerse — Global Command Palette (Phase 4)
// Ctrl+K to search anything, navigate anywhere, ask the AI
// ============================================================

import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Brain, Upload, BookOpen, GitBranch, Clock,
  BarChart3, Lightbulb, MessageSquare, Settings, User,
  ArrowRight, Sparkles, Command, X, Loader2
} from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { reasonAcrossMemories } from '@/lib/reasoning-api'

// ─────────────────────────────────────────────────────────────
// Navigation commands
// ─────────────────────────────────────────────────────────────

const NAV_COMMANDS = [
  { id: 'dashboard', label: 'Go to Dashboard', icon: Brain, href: '/dashboard', group: 'Navigate' },
  { id: 'upload', label: 'Upload Memory', icon: Upload, href: '/upload', group: 'Navigate' },
  { id: 'memories', label: 'Browse Memories', icon: BookOpen, href: '/memories', group: 'Navigate' },
  { id: 'assistant', label: 'Open AI Assistant', icon: MessageSquare, href: '/assistant', group: 'Navigate' },
  { id: 'timeline', label: 'View Timeline', icon: Clock, href: '/timeline', group: 'Navigate' },
  { id: 'graph', label: 'Knowledge Graph', icon: GitBranch, href: '/knowledge-graph', group: 'Navigate' },
  { id: 'search', label: 'Smart Search', icon: Search, href: '/search', group: 'Navigate' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics', group: 'Navigate' },
  { id: 'recommendations', label: 'Recommendations', icon: Lightbulb, href: '/recommendations', group: 'Navigate' },
  { id: 'profile', label: 'Profile', icon: User, href: '/profile', group: 'Navigate' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings', group: 'Navigate' },
]

// ─────────────────────────────────────────────────────────────
// Hook: global keyboard shortcut
// ─────────────────────────────────────────────────────────────

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return { isOpen, setIsOpen }
}

// ─────────────────────────────────────────────────────────────
// CommandPalette component
// ─────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

interface SearchResult {
  id: string
  title: string
  category: string | null
  ai_summary: string | null
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAsking, setIsAsking] = useState(false)
  const [aiAnswer, setAiAnswer] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Focus input when open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults([])
      setAiAnswer(null)
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Search documents
  useEffect(() => {
    if (!query.trim() || !user?.id) {
      setResults([])
      return
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const { data } = await supabase
          .from('documents')
          .select('id, title, category, ai_summary')
          .eq('user_id', user.id)
          .or(`title.ilike.%${query}%,ai_summary.ilike.%${query}%`)
          .limit(5)
        setResults(data || [])
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }, [query, user?.id])

  const filteredNav = NAV_COMMANDS.filter(
    (cmd) => !query || cmd.label.toLowerCase().includes(query.toLowerCase())
  )

  const allItems = [
    ...results.map((r) => ({ type: 'memory' as const, ...r })),
    ...filteredNav.map((c) => ({ type: 'nav' as const, ...c })),
  ]

  const handleAskAI = useCallback(async () => {
    if (!query.trim() || !user?.id || isAsking) return
    setIsAsking(true)
    setAiAnswer(null)
    try {
      const answer = await reasonAcrossMemories(query, user.id)
      setAiAnswer(answer.answer)
    } finally {
      setIsAsking(false)
    }
  }, [query, user?.id, isAsking])

  const handleSelect = useCallback((item: typeof allItems[0]) => {
    if (item.type === 'nav') {
      navigate(item.href)
    } else {
      navigate(`/memories/${item.id}`)
    }
    onClose()
  }, [navigate, onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, allItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (allItems[selectedIndex]) {
        handleSelect(allItems[selectedIndex])
      } else if (query.trim()) {
        handleAskAI()
      }
    }
  }

  const isQuestion = query.trim().endsWith('?') || query.toLowerCase().startsWith('what') ||
    query.toLowerCase().startsWith('which') || query.toLowerCase().startsWith('how') ||
    query.toLowerCase().startsWith('when') || query.toLowerCase().startsWith('show') ||
    query.toLowerCase().startsWith('find') || query.toLowerCase().startsWith('tell')

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50 px-4"
          >
            <div className="bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search, navigate, or ask anything..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  id="cmd-palette-input"
                />
                <div className="flex items-center gap-2">
                  {(isSearching || isAsking) && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                    ESC
                  </kbd>
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto">
                {/* AI Answer */}
                {aiAnswer && (
                  <div className="p-4 border-b border-border">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-md bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-violet-500 mb-1">AI Answer</p>
                        <p className="text-sm leading-relaxed">{aiAnswer}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Memory results */}
                {results.length > 0 && (
                  <div className="p-2">
                    <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Memories
                    </p>
                    {results.map((result, i) => (
                      <button
                        key={result.id}
                        onClick={() => { navigate(`/memories/${result.id}`); onClose() }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          selectedIndex === i ? 'bg-accent' : 'hover:bg-accent'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                          <Brain className="w-3.5 h-3.5 text-violet-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          {result.category && (
                            <p className="text-xs text-muted-foreground capitalize">
                              {result.category.replace('_', ' ')}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Navigation */}
                {filteredNav.length > 0 && (
                  <div className="p-2">
                    <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Navigate
                    </p>
                    {filteredNav.map((cmd, i) => {
                      const idx = results.length + i
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => { navigate(cmd.href); onClose() }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                            selectedIndex === idx ? 'bg-accent' : 'hover:bg-accent'
                          }`}
                        >
                          <cmd.icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{cmd.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Ask AI button */}
                {isQuestion && !aiAnswer && (
                  <div className="p-2 border-t border-border">
                    <button
                      onClick={handleAskAI}
                      disabled={isAsking}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                        {isAsking
                          ? <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin" />
                          : <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium">Ask AI about your memories</p>
                        <p className="text-xs text-muted-foreground truncate max-w-xs">{query}</p>
                      </div>
                    </button>
                  </div>
                )}

                {/* Empty */}
                {!isSearching && query && results.length === 0 && filteredNav.length === 0 && !aiAnswer && (
                  <div className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">No results for "{query}"</p>
                    {isQuestion && (
                      <button
                        onClick={handleAskAI}
                        className="mt-3 text-xs text-violet-500 hover:underline flex items-center gap-1 mx-auto"
                      >
                        <Sparkles className="w-3 h-3" />
                        Ask AI instead
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-muted font-mono">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-muted font-mono">↵</kbd>
                    Select
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Command className="w-3 h-3" />
                  K to toggle
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
