import { motion } from 'framer-motion'
import { MessageSquare, Sparkles } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, Badge } from '@/components/ui'

export default function AssistantPage() {
  return (
    <AppShell title="AI Assistant" breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'AI Assistant' }]}>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">AI Assistant</h1>
              <Badge variant="secondary">Phase 4</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Your personal career intelligence — understands your complete journey
            </p>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="bg-gradient-to-br from-violet-500/5 to-indigo-500/5 border-violet-500/20">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">AI Assistant arrives in Phase 4</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                Your AI assistant will understand your entire professional journey — not just individual documents.
                It will answer questions using your memories, timeline, and knowledge graph.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto text-left">
                {[
                  'What is my strongest skill?',
                  'Which projects show backend experience?',
                  'Summarize my cloud journey',
                  'What should I add to my resume?',
                ].map((q) => (
                  <div key={q} className="flex items-center gap-2 text-xs p-2.5 rounded-lg bg-background border">
                    <Sparkles className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                    {q}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppShell>
  )
}
