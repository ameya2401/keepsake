import { motion } from 'framer-motion'
import { BookOpen, Search, Filter } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent } from '@/components/ui'

export default function MemoriesPage() {
  return (
    <AppShell title="Memories" breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Memories' }]}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your Memories</h1>
            <p className="text-muted-foreground text-sm">All your uploaded documents, intelligently organized</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-accent transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search your memories..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Empty state */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardContent className="p-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No memories yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Upload documents and they'll appear here, organized by AI.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppShell>
  )
}
