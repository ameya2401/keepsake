// ============================================================
// Keepsake — Onboarding Component
// First-time user onboarding wizard shown after signup
// ============================================================

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Upload, GitBranch, Clock, Search, Sparkles,
  ArrowRight, ArrowLeft, CheckCircle2, X, Play,
  FileText, Award, Briefcase, Code2, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { seedDemoData } from '@/lib/demo-seeder'
import { useAuth } from '@/providers/AuthProvider'
import { useNavigate } from 'react-router-dom'

// ─────────────────────────────────────────────────────────────
// Steps definition
// ─────────────────────────────────────────────────────────────

interface Step {
  icon: React.ElementType
  color: string
  title: string
  subtitle: string
  description: string
  bullets?: string[]
}

const STEPS: Step[] = [
  {
    icon: Brain,
    color: 'from-violet-500 to-purple-700',
    title: 'Welcome to Keepsake',
    subtitle: 'Your AI-powered career memory',
    description: 'Keepsake organizes all your career documents — resumes, certificates, internship letters, projects, and achievements — into an intelligent, searchable knowledge base.',
    bullets: [
      'Upload once, discover forever',
      'AI extracts skills, dates, and relationships',
      'Your data stays private and secure',
    ],
  },
  {
    icon: Upload,
    color: 'from-blue-500 to-cyan-600',
    title: 'Upload your documents',
    subtitle: 'PDFs, Word files, and images',
    description: 'Drag and drop up to 10 files at once. Keepsake accepts any format your documents come in.',
    bullets: [
      'PDF, DOCX, JPG, PNG supported',
      'Batch upload up to 10 files',
      'Automatic document type detection',
    ],
  },
  {
    icon: Sparkles,
    color: 'from-violet-500 to-fuchsia-600',
    title: 'AI processes everything',
    subtitle: 'Powered by Groq Llama-3',
    description: 'Our AI pipeline extracts rich metadata from every document — skills, technologies, organizations, dates, and achievements — in seconds.',
    bullets: [
      'Text extraction from any format',
      'Entity and skill recognition',
      'Automatic classification and tagging',
    ],
  },
  {
    icon: GitBranch,
    color: 'from-emerald-500 to-teal-600',
    title: 'Knowledge graph builds',
    subtitle: 'See your career as a network',
    description: 'Entities from all your documents are connected automatically. Discover hidden links between your skills, projects, and experiences.',
    bullets: [
      'Automatic relationship discovery',
      'Interactive graph visualization',
      'Reveals non-obvious connections',
    ],
  },
  {
    icon: Clock,
    color: 'from-amber-500 to-orange-600',
    title: 'Timeline populates',
    subtitle: 'Your career story, visualized',
    description: 'Dates extracted from documents are automatically placed on a visual timeline — your entire career arc in one view.',
    bullets: [
      'Automatic date extraction',
      'Chronological career visualization',
      'Filter by document type',
    ],
  },
  {
    icon: Search,
    color: 'from-rose-500 to-pink-600',
    title: 'Semantic search & assistant',
    subtitle: 'Ask questions, get answers',
    description: 'Search using natural language across all your memories. Ask the AI assistant complex questions about your career history.',
    bullets: [
      '"Show everything related to Python"',
      '"What projects demonstrate my backend experience?"',
      '"What certifications do I have from 2024?"',
    ],
  },
]

// ─────────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────────

function StepDot({ active, complete }: { active: boolean; complete: boolean }) {
  return (
    <div
      className={`w-2 h-2 rounded-full transition-all duration-300 ${
        complete ? 'bg-violet-500 scale-100' :
        active ? 'bg-violet-500 scale-125' :
        'bg-white/20'
      }`}
    />
  )
}

// ─────────────────────────────────────────────────────────────
// Main Onboarding component
// ─────────────────────────────────────────────────────────────

interface OnboardingProps {
  onComplete: () => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [isSeeding, setIsSeeding] = useState(false)

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete()
      navigate('/upload')
    } else {
      setStep((s) => s + 1)
    }
  }, [isLast, onComplete, navigate])

  const handlePrev = useCallback(() => {
    setStep((s) => Math.max(0, s - 1))
  }, [])

  const handleLoadDemo = useCallback(async () => {
    if (!user?.id) return
    setIsSeeding(true)
    const { success, error } = await seedDemoData(user.id)
    setIsSeeding(false)
    if (success) {
      onComplete()
      navigate('/dashboard')
    } else {
      console.error("Failed to seed demo data:", error)
    }
  }, [user?.id, onComplete, navigate])

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg bg-[#111116] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Dismiss */}
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
          aria-label="Skip onboarding"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="p-8"
          >
            {/* Icon */}
            <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${current.color} shadow-lg mb-6`}>
              <Icon className="w-7 h-7 text-white" />
            </div>

            {/* Text */}
            <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-2">
              {current.subtitle}
            </p>
            <h2 className="text-2xl font-bold text-white mb-3">{current.title}</h2>
            <p className="text-zinc-400 leading-relaxed mb-6">{current.description}</p>

            {/* Bullets */}
            {current.bullets && (
              <ul className="space-y-2 mb-8">
                {current.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="px-8 pb-8 space-y-4">
          {/* Demo banner shown on first step */}
          {step === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
            >
              <Zap className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-300">Try with demo data</p>
                <p className="text-xs text-zinc-400">Load a realistic workspace instantly</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleLoadDemo}
                disabled={isSeeding}
                className="flex-shrink-0 border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
              >
                {isSeeding ? (
                  <>Loading…</>
                ) : (
                  <><Play className="w-3 h-3 mr-1" />Load Demo</>
                )}
              </Button>
            </motion.div>
          )}

          {/* Doc type pills shown on upload step */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-wrap gap-2"
            >
              {[
                { icon: FileText, label: 'Resume', color: 'text-blue-400' },
                { icon: Award, label: 'Certificate', color: 'text-amber-400' },
                { icon: Briefcase, label: 'Internship', color: 'text-emerald-400' },
                { icon: Code2, label: 'Project', color: 'text-violet-400' },
              ].map(({ icon: PillIcon, label, color }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/8 bg-white/[0.03] text-xs"
                >
                  <PillIcon className={`w-3 h-3 ${color}`} />
                  <span className="text-zinc-300">{label}</span>
                </span>
              ))}
            </motion.div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <StepDot key={i} active={i === step} complete={i < step} />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button variant="ghost" size="sm" onClick={handlePrev}>
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              <Button onClick={handleNext} size="sm" className="bg-violet-600 hover:bg-violet-500">
                {isLast ? 'Start uploading' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
