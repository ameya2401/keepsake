// ============================================================
// Keepsake — Public Landing Page
// Marketing page for hackathon judges and new visitors
// ============================================================

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Brain, Upload, GitBranch, Clock, Search, Sparkles,
  ArrowRight, CheckCircle2, Zap, Shield, Star,
  FileText, Award, Briefcase, Code2, ChevronRight,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// Animation variants
// ─────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
}

// ─────────────────────────────────────────────────────────────
// Feature Card
// ─────────────────────────────────────────────────────────────

interface FeatureCardProps {
  icon: React.ElementType
  title: string
  description: string
  color: string
  delay: number
}

function FeatureCard({ icon: Icon, title, description, color, delay }: FeatureCardProps) {
  return (
    <motion.div
      custom={delay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      className="group relative p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
    >
      <div className={`inline-flex p-3 rounded-xl mb-4 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Step Card
// ─────────────────────────────────────────────────────────────

function StepCard({
  step, title, description, delay,
}: { step: string; title: string; description: string; delay: number }) {
  return (
    <motion.div
      custom={delay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      className="flex gap-4"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
        <span className="text-sm font-bold text-violet-400">{step}</span>
      </div>
      <div className="pt-1">
        <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
        <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Category Pill
// ─────────────────────────────────────────────────────────────

const docTypes = [
  { icon: FileText, label: 'Resumes', color: 'text-blue-400' },
  { icon: Award, label: 'Certificates', color: 'text-amber-400' },
  { icon: Briefcase, label: 'Internship Letters', color: 'text-emerald-400' },
  { icon: Code2, label: 'Projects', color: 'text-violet-400' },
  { icon: Star, label: 'Achievements', color: 'text-rose-400' },
  { icon: Brain, label: 'Research', color: 'text-cyan-400' },
]

// ─────────────────────────────────────────────────────────────
// Main Landing Page
// ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 backdrop-blur-xl bg-[#0a0a0f]/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Keepsake</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-40 pb-24 px-6">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-violet-500/30 bg-violet-500/10 text-violet-300 mb-8"
          >
            <Sparkles className="w-3 h-3" />
            AI-Powered Career Intelligence
            <ChevronRight className="w-3 h-3" />
          </motion.div>

          <motion.h1
            custom={0.1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Your career documents,{' '}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              intelligently organized
            </span>
          </motion.h1>

          <motion.p
            custom={0.25}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Upload your resumes, certificates, internship letters, and projects.
            Keepsake uses AI to extract insights, build a knowledge graph, and surface what matters
            — so you never lose track of your career journey again.
          </motion.p>

          <motion.div
            custom={0.4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center gap-3 justify-center"
          >
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-medium transition-all duration-200 hover:scale-105 active:scale-100 shadow-lg shadow-violet-600/25"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 font-medium transition-all duration-200 text-zinc-300"
            >
              View demo
              <Zap className="w-4 h-4 text-amber-400" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Document types marquee ── */}
      <section className="pb-20 px-6">
        <motion.p
          custom={0.5}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-xs font-medium text-zinc-500 uppercase tracking-widest text-center mb-6"
        >
          Works with all your career documents
        </motion.p>
        <motion.div
          custom={0.6}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto"
        >
          {docTypes.map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/8 bg-white/[0.03] text-sm"
            >
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-zinc-300">{label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything your career memory needs
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              From raw documents to actionable intelligence — Keepsake handles the entire pipeline automatically.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon={Upload}
              title="Intelligent Ingestion"
              description="Upload PDFs, Word docs, and images. Our pipeline extracts text, detects document type, and structures metadata automatically."
              color="bg-blue-500/10 text-blue-400"
              delay={0.05}
            />
            <FeatureCard
              icon={Brain}
              title="AI Extraction"
              description="Powered by Groq Llama-3, we extract skills, technologies, organizations, dates, and achievements with high accuracy."
              color="bg-violet-500/10 text-violet-400"
              delay={0.1}
            />
            <FeatureCard
              icon={GitBranch}
              title="Knowledge Graph"
              description="Every document becomes a node. Skills, companies, and projects are connected automatically to reveal hidden relationships."
              color="bg-emerald-500/10 text-emerald-400"
              delay={0.15}
            />
            <FeatureCard
              icon={Clock}
              title="Career Timeline"
              description="Dates are extracted and plotted on a visual timeline showing the complete arc of your career and education history."
              color="bg-amber-500/10 text-amber-400"
              delay={0.2}
            />
            <FeatureCard
              icon={Search}
              title="Semantic Search"
              description="Search across all your memories using natural language. Vector embeddings ensure you find conceptually related documents."
              color="bg-cyan-500/10 text-cyan-400"
              delay={0.25}
            />
            <FeatureCard
              icon={Sparkles}
              title="AI Recommendations"
              description="Get personalized career recommendations — gaps in your resume, certificates to add, projects to highlight, and more."
              color="bg-rose-500/10 text-rose-400"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">From upload to insight in seconds</h2>
            <p className="text-zinc-400">A fully automated pipeline, no manual tagging required.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StepCard step="1" title="Upload your documents" description="Drag and drop any PDF, DOCX, or image. Keepsake accepts up to 10 files at once." delay={0.05} />
            <StepCard step="2" title="AI processes everything" description="Text extraction, entity recognition, and classification happen in real-time using Groq's Llama-3 model." delay={0.1} />
            <StepCard step="3" title="Knowledge graph builds" description="Entities are linked automatically — see how your skills, projects, and roles connect to each other." delay={0.15} />
            <StepCard step="4" title="Insights surface" description="The timeline populates, recommendations appear, and semantic search becomes available across all your memories." delay={0.2} />
          </div>
        </div>
      </section>

      {/* ── Trust signals ── */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Private by default', desc: 'Your data never leaves your account. Row-level security enforced at database level.', color: 'text-emerald-400' },
              { icon: Zap, title: 'Lightning fast', desc: 'Groq inference at 300+ tokens/second ensures near-instant AI processing for every upload.', color: 'text-amber-400' },
              { icon: CheckCircle2, title: 'Open source ready', desc: 'Built on Supabase, Vite, React, and Groq — proven open technologies you can trust.', color: 'text-violet-400' },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                custom={i * 0.1}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="text-center p-6"
              >
                <Icon className={`w-8 h-8 mx-auto mb-4 ${color}`} />
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-500/20">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Never lose track of your career again
            </h2>
            <p className="text-zinc-400 mb-8">
              Join Keepsake and let AI organize your professional journey for you.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold text-lg transition-all duration-200 hover:scale-105 active:scale-100 shadow-xl shadow-violet-600/30"
            >
              Get started for free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center">
              <Brain className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-zinc-400">Keepsake</span>
            <span>— Built for the AI Hackathon 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-zinc-300 transition-colors">Sign in</Link>
            <Link to="/signup" className="hover:text-zinc-300 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
