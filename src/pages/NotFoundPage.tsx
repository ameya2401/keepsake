import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Home } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 max-w-sm"
      >
        <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20">
          <Brain className="w-8 h-8 text-violet-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-muted-foreground/30">404</h1>
          <h2 className="text-xl font-semibold">Memory not found</h2>
          <p className="text-muted-foreground text-sm">
            This page doesn't exist in your knowledge universe.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </motion.div>
    </div>
  )
}
