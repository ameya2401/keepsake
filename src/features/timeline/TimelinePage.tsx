import { motion } from 'framer-motion'
import { Clock, Plus } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent } from '@/components/ui'

export default function TimelinePage() {
  return (
    <AppShell title="Timeline" breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Timeline' }]}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your Journey</h1>
            <p className="text-muted-foreground text-sm">A chronological view of your professional and academic life</p>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-accent transition-colors">
            <Plus className="w-4 h-4" />
            Add event
          </button>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardContent className="p-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Clock className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Timeline empty</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Upload documents with dates and MemoryVerse will automatically build your professional timeline.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppShell>
  )
}
