// ============================================================
// Keepsake — AI Assistant (Phase 4)
// Full conversational AI that understands the user's complete journey
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Sparkles, Brain, User as UserIcon, RefreshCw,
  Loader2, Clipboard, Check, Lightbulb, Clock, GitBranch,
  FileText, TrendingUp, ChevronDown
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, Badge, Button } from '@/components/ui'
import { useAuth } from '@/providers/AuthProvider'
import { reasonAcrossMemories } from '@/lib/reasoning-api'
import type { ReasoningAnswer } from '@/lib/reasoning-api'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  answer?: ReasoningAnswer
  timestamp: Date
  isLoading?: boolean
}

// ─────────────────────────────────────────────────────────────
// Example prompts by category
// ─────────────────────────────────────────────────────────────

const EXAMPLE_CATEGORIES = [
  {
    label: 'Career',
    icon: TrendingUp,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    prompts: [
      'How has my career evolved over the years?',
      'What are my strongest professional skills?',
      'Which internship improved my backend skills most?',
      'What should I add to my resume right now?',
    ],
  },
  {
    label: 'Projects',
    icon: GitBranch,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    prompts: [
      'Show me all my AI and machine learning projects',
      'Which project best demonstrates my technical depth?',
      'What technologies appear most across my projects?',
      'Which projects are portfolio-ready?',
    ],
  },
  {
    label: 'Learning',
    icon: Lightbulb,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    prompts: [
      'When did I first learn React?',
      'Summarize my cloud computing journey',
      'What certifications have I completed?',
      'What should I learn next based on my profile?',
    ],
  },
  {
    label: 'Timeline',
    icon: Clock,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    prompts: [
      'Generate a timeline of my career milestones',
      'What were my biggest achievements last year?',
      'Show every experience related to Python',
      'When did my professional growth accelerate?',
    ],
  },
]

// ─────────────────────────────────────────────────────────────
// Message bubble
// ─────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
        isUser
          ? 'bg-primary text-primary-foreground'
          : 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white'
      )}>
        {isUser
          ? <UserIcon className="w-4 h-4" />
          : <Sparkles className="w-4 h-4" />
        }
      </div>

      {/* Content */}
      <div className={cn('max-w-[80%] space-y-2', isUser ? 'items-end' : 'items-start', 'flex flex-col')}>
        <div className={cn(
          'px-4 py-3 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-card border border-border rounded-tl-sm'
        )}>
          {message.isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
              <span className="text-muted-foreground">Reasoning across your memories…</span>
            </div>
          ) : (
            message.content
          )}
        </div>

        {/* Metadata for assistant messages */}
        {!isUser && message.answer && !message.isLoading && (
          <div className="space-y-2 w-full">
            {/* Confidence + sources */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="text-xs bg-violet-500/10 text-violet-500 border-violet-500/20">
                {Math.round(message.answer.confidence * 100)}% confidence
              </Badge>
              {message.answer.supporting_documents.slice(0, 3).map((doc) => (
                <Badge key={doc} variant="outline" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" />
                  {doc.length > 30 ? doc.slice(0, 30) + '…' : doc}
                </Badge>
              ))}
            </div>

            {/* Reasoning chain */}
            {message.answer.reasoning_chain.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                  <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
                  View reasoning chain
                </summary>
                <div className="mt-2 pl-3 border-l-2 border-border space-y-1">
                  {message.answer.reasoning_chain.map((step, i) => (
                    <div key={i} className="text-xs text-muted-foreground flex gap-1.5">
                      <span className="text-violet-500 font-mono">{i + 1}.</span>
                      {step}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* Timestamp + copy */}
        {!message.isLoading && (
          <div className={cn('flex items-center gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
            <span className="text-[10px] text-muted-foreground">
              {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {!isUser && (
              <button
                onClick={handleCopy}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Copy response"
              >
                {copied
                  ? <Check className="w-3 h-3 text-emerald-500" />
                  : <Clipboard className="w-3 h-3" />
                }
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Welcome Screen
// ─────────────────────────────────────────────────────────────

function WelcomeScreen({
  onPrompt,
  displayName,
}: {
  onPrompt: (prompt: string) => void
  displayName: string
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Hello, {displayName} 👋</h2>
          <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
            I know your entire professional journey. Ask me anything about your memories,
            skills, projects, and career path.
          </p>
        </div>
      </motion.div>

      {/* Example categories */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {EXAMPLE_CATEGORIES.map((cat) => (
          <Card key={cat.label} className="hover:border-primary/30 transition-all">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg ${cat.bgColor} flex items-center justify-center`}>
                  <cat.icon className={`w-4 h-4 ${cat.color}`} />
                </div>
                <span className="text-sm font-semibold">{cat.label}</span>
              </div>
              <div className="space-y-1.5">
                {cat.prompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => onPrompt(prompt)}
                    className="w-full text-left text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md px-2 py-1.5 transition-colors flex items-center gap-2 group"
                  >
                    <Sparkles className="w-3 h-3 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    {prompt}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Assistant Page
// ─────────────────────────────────────────────────────────────

export default function AssistantPage() {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const displayName = profile?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there'

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim() || !user?.id || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    }

    const loadingMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      isLoading: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage, loadingMessage])
    setInput('')
    setIsLoading(true)

    try {
      const answer = await reasonAcrossMemories(question, user.id)

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMessage.id
            ? {
                ...m,
                content: answer.answer,
                answer,
                isLoading: false,
                timestamp: new Date(),
              }
            : m
        )
      )
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMessage.id
            ? {
                ...m,
                content: 'I encountered an issue reasoning across your memories. Please try again.',
                isLoading: false,
                timestamp: new Date(),
              }
            : m
        )
      )
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, isLoading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleClearChat = () => {
    setMessages([])
  }

  return (
    <AppShell
      title="AI Assistant"
      breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'AI Assistant' }]}
    >
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-base">Keepsake AI</h1>
                <Badge className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 inline-block" />
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Understands your full professional journey
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearChat}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              New chat
            </Button>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <WelcomeScreen onPrompt={sendMessage} displayName={displayName} />
          ) : (
            <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
              <AnimatePresence>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-border bg-background/95 backdrop-blur px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-3 p-3 rounded-2xl border border-border bg-card focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/30 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your memories, career, or skills…"
                rows={1}
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm outline-none resize-none leading-relaxed max-h-32 overflow-y-auto placeholder:text-muted-foreground"
                style={{ minHeight: '24px' }}
                id="assistant-input"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                id="assistant-send"
              >
                {isLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-2">
              Answers are grounded in your memories · Never hallucinated
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
