import { motion } from 'framer-motion'
import { GitBranch } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent } from '@/components/ui'

export default function KnowledgeGraphPage() {
  return (
    <AppShell title="Knowledge Graph" breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Knowledge Graph' }]}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Graph</h1>
          <p className="text-muted-foreground text-sm">
            An interactive visualization of how your skills, projects, and experiences connect
          </p>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="h-[600px]">
            <CardContent className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                  <GitBranch className="w-8 h-8 text-cyan-500" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Graph will appear here</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Upload documents and MemoryVerse will automatically discover relationships
                  and build your personal knowledge graph.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppShell>
  )
}
