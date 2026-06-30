import { motion } from 'framer-motion'
import { Lightbulb } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent } from '@/components/ui'

export default function RecommendationsPage() {
  return (
    <AppShell title="Insights" breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Insights' }]}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">AI Insights</h1>
          <p className="text-muted-foreground text-sm">Personalized recommendations to improve your professional profile</p>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardContent className="p-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Lightbulb className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Insights coming after Phase 3</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Upload documents and MemoryVerse will generate personalized career insights,
                resume suggestions, and growth recommendations.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppShell>
  )
}
