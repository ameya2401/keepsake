import { motion } from 'framer-motion'
import { BarChart3 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent } from '@/components/ui'

export default function AnalyticsPage() {
  return (
    <AppShell title="Analytics" breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Analytics' }]}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm">Visualize your knowledge growth and career progress over time</p>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardContent className="p-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Analytics coming after Phase 3</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                After you build your knowledge graph, analytics will show skill growth,
                relationship density, and career trajectory.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppShell>
  )
}
