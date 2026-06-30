import { useState } from 'react'
import { Search, Clock } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent } from '@/components/ui'

export default function SearchPage() {
  const [query, setQuery] = useState('')

  return (
    <AppShell title="Search" breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Search' }]}>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Search Memories</h1>
          <p className="text-muted-foreground text-sm">Find anything across your entire knowledge universe</p>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try "Show my AI projects" or "Which certificates mention Python"'
            className="w-full pl-12 pr-4 py-3.5 text-sm rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            id="search-input"
            autoFocus
          />
        </div>

        {/* Empty state */}
        {!query && (
          <Card>
            <CardContent className="p-10 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                <Search className="w-7 h-7 text-violet-500" />
              </div>
              <h3 className="font-semibold mb-2">Semantic search coming in Phase 3</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                MemoryVerse will use AI embeddings to understand the meaning behind your queries —
                not just keywords.
              </p>
              <div className="mt-6 text-left space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  Example queries you'll be able to use:
                </p>
                {[
                  'Show all my AI-related projects',
                  'Which internship taught me React?',
                  'Find certificates from 2024',
                  'Show everything related to cloud computing',
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => setQuery(example)}
                    className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-muted hover:bg-accent transition-colors"
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
