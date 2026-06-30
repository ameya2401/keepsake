import { motion } from 'framer-motion'
import { useAuth } from '@/providers/AuthProvider'
import { AppShell } from '@/components/layout/AppShell'
import {
  Brain, Upload, BookOpen, GitBranch, TrendingUp, Star,
  Clock, Zap, FileText, Award, Briefcase, Code
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, Badge, Progress } from '@/components/ui'

// ─────────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  trend?: string
  delay?: number
}

function StatCard({ label, value, icon: Icon, color, trend, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
              {trend && (
                <p className="text-xs text-emerald-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {trend}
                </p>
              )}
            </div>
            <div className={`p-2.5 rounded-xl ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
          {/* Subtle bottom gradient decoration */}
          <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${color.replace('bg-', 'bg-').replace('/10', '/40')}`} />
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Quick Action Card
// ─────────────────────────────────────────────────────────────

interface QuickActionProps {
  icon: React.ElementType
  label: string
  description: string
  href: string
  color: string
  delay?: number
}

function QuickAction({ icon: Icon, label, description, href, color, delay = 0 }: QuickActionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      <Link to={href}>
        <Card className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group">
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${color} transition-transform group-hover:scale-110`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Dashboard Page
// ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { profile, user } = useAuth()

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'there'
  const firstName = displayName.split(' ')[0]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const stats = [
    { label: 'Total Memories', value: 0, icon: Brain, color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
    { label: 'Projects', value: 0, icon: Code, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
    { label: 'Certificates', value: 0, icon: Award, color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
    { label: 'Internships', value: 0, icon: Briefcase, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { label: 'Skills Identified', value: 0, icon: Star, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { label: 'Connections', value: 0, icon: GitBranch, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
    { label: 'Timeline Events', value: 0, icon: Clock, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { label: 'AI Insights', value: 0, icon: Zap, color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  ]

  const quickActions = [
    {
      icon: Upload,
      label: 'Upload Memory',
      description: 'Add documents, certificates, or projects',
      href: '/upload',
      color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
    {
      icon: BookOpen,
      label: 'Browse Memories',
      description: 'View and manage all your documents',
      href: '/memories',
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
    {
      icon: GitBranch,
      label: 'Knowledge Graph',
      description: 'Explore your knowledge connections',
      href: '/knowledge-graph',
      color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    },
    {
      icon: Clock,
      label: 'Your Timeline',
      description: 'View your journey over time',
      href: '/timeline',
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
  ]

  return (
    <AppShell title="Dashboard" breadcrumb={[{ label: 'Dashboard' }]}>
      <div className="p-6 max-w-7xl mx-auto space-y-8">

        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-600 p-6 text-white"
        >
          {/* Background decorations */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-8 -right-8 w-48 h-48 bg-white rounded-full blur-3xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-300 rounded-full blur-2xl" />
          </div>

          <div className="relative flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-violet-200 text-sm font-medium">{greeting} 👋</p>
              <h2 className="text-2xl font-bold">{firstName}</h2>
              <p className="text-violet-100 text-sm max-w-md">
                Your knowledge universe is ready. Upload your first memory and watch MemoryVerse
                build your professional intelligence map.
              </p>
              <div className="pt-2">
                <Link
                  to="/upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-medium transition-colors border border-white/20"
                >
                  <Upload className="w-4 h-4" />
                  Upload your first memory
                </Link>
              </div>
            </div>
            <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Memory Health Score */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Memory Health Score</h3>
                  <p className="text-sm text-muted-foreground">Start uploading to improve your score</p>
                </div>
                <Badge variant="secondary">Getting started</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall score</span>
                  <span className="font-medium">0 / 100</span>
                </div>
                <Progress value={0} />
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Knowledge Coverage', value: 0 },
                  { label: 'Graph Density', value: 0 },
                  { label: 'Timeline Quality', value: 0 },
                  { label: 'Search Readiness', value: 0 },
                ].map((metric) => (
                  <div key={metric.label} className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-lg font-bold">{metric.value}%</div>
                    <div className="text-[10px] text-muted-foreground">{metric.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats grid */}
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Your Memory Library
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <StatCard key={stat.label} {...stat} delay={i * 0.05} />
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-muted-foreground" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((action, i) => (
              <QuickAction key={action.label} {...action} delay={i * 0.05} />
            ))}
          </div>
        </div>

        {/* Empty state — Recent uploads */}
        <div>
          <h3 className="font-semibold mb-4">Recent Memories</h3>
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                <Brain className="w-8 h-8 text-violet-500" />
              </div>
              <h4 className="font-semibold text-lg mb-2">No memories yet</h4>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                Upload your first document and MemoryVerse will automatically extract knowledge,
                build connections, and create your professional timeline.
              </p>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload your first memory
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights placeholder */}
        <div>
          <h3 className="font-semibold mb-4">AI Insights</h3>
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <h4 className="font-medium mb-1">AI insights will appear here</h4>
              <p className="text-muted-foreground text-xs max-w-xs mx-auto">
                After you upload documents, MemoryVerse will generate personalized career
                insights and recommendations.
              </p>
            </CardContent>
          </Card>
        </div>

      </div>
    </AppShell>
  )
}
