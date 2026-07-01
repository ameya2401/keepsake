// ============================================================
// MemoryVerse — Resume Analyzer (Phase 4)
// Compare memories against your resume; detect gaps and suggest updates
// ============================================================

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Sparkles, AlertCircle, CheckCircle2,
  TrendingUp, Loader2, Plus, RefreshCw, Download
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/ui'
import { useAuth } from '@/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ResumeGap {
  type: 'missing_project' | 'missing_certificate' | 'missing_skill' | 'missing_internship' | 'outdated'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
}

interface AnalysisResult {
  summary: string
  coverageScore: number
  gaps: ResumeGap[]
  suggestions: string[]
  strengths: string[]
}

// ─────────────────────────────────────────────────────────────
// Resume Analyzer prompt
// ─────────────────────────────────────────────────────────────

function buildAnalysisPrompt(resumeText: string, memoryContext: string): string {
  return `You are a professional career advisor analyzing a user's resume against their complete professional memory archive.

The user's memories include:
${memoryContext}

Their current resume:
${resumeText}

Analyze the resume against the memories and return ONLY valid JSON:
{
  "summary": "2-3 sentence summary of resume vs memories comparison",
  "coverageScore": 75,
  "gaps": [
    {
      "type": "missing_project",
      "title": "Project Name",
      "description": "Why this should be on the resume",
      "impact": "high"
    }
  ],
  "suggestions": [
    "Specific actionable suggestion 1",
    "Specific actionable suggestion 2"
  ],
  "strengths": [
    "What the resume does well 1",
    "What the resume does well 2"
  ]
}

Rules:
- Only report real gaps based on memories provided
- Coverage score = percentage of important memories reflected in resume (0-100)
- Suggestions must be specific and actionable
- Impact levels: high = major career evidence missing, medium = improvement opportunity, low = minor enhancement
- Maximum 8 gaps, 5 suggestions, 4 strengths`
}

// ─────────────────────────────────────────────────────────────
// Gap Impact Badge
// ─────────────────────────────────────────────────────────────

function ImpactBadge({ impact }: { impact: string }) {
  const config = {
    high: { label: 'High Impact', cls: 'bg-red-500/10 text-red-500 border-red-500/20' },
    medium: { label: 'Medium Impact', cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    low: { label: 'Low Impact', cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  }[impact] || { label: 'Unknown', cls: '' }

  return <Badge className={`text-xs ${config.cls}`}>{config.label}</Badge>
}

// ─────────────────────────────────────────────────────────────
// Coverage Score Ring
// ─────────────────────────────────────────────────────────────

function CoverageRing({ score }: { score: number }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  const textColor = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-red-500'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="38" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
          <circle
            cx="48" cy="48" r="38"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 38 * score / 100} ${2 * Math.PI * 38}`}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${textColor}`}>{score}</span>
          <span className="text-[10px] text-muted-foreground">/ 100</span>
        </div>
      </div>
      <p className="text-sm font-medium">Coverage Score</p>
      <p className="text-xs text-muted-foreground text-center max-w-24">
        {score >= 80 ? 'Excellent coverage' : score >= 60 ? 'Good, gaps remain' : 'Significant gaps found'}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Resume Analyzer
// ─────────────────────────────────────────────────────────────

export default function ResumeAnalyzerPage() {
  const { user } = useAuth()
  const [resumeText, setResumeText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = useCallback(async () => {
    if (!resumeText.trim() || !user?.id) return
    setIsAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      // Fetch user memories for context
      const [docsResult, skillsResult] = await Promise.all([
        supabase
          .from('documents')
          .select('title, category, ai_summary, tags, metadata')
          .eq('user_id', user.id)
          .eq('processing_status', 'completed')
          .limit(40),
        supabase
          .from('skills')
          .select('name, document_count')
          .eq('user_id', user.id)
          .order('document_count', { ascending: false })
          .limit(20),
      ])

      const docs = docsResult.data || []
      const skills = skillsResult.data || []

      const memoryContext = JSON.stringify({
        memories: docs.map((d: {
          title: string; category: string | null;
          ai_summary: string | null; tags: string[];
          metadata: Record<string, unknown> | null
        }) => ({
          title: d.title,
          category: d.category,
          summary: d.ai_summary,
          skills: (d.metadata as Record<string, unknown>)?.skills,
          technologies: (d.metadata as Record<string, unknown>)?.technologies,
          organization: (d.metadata as Record<string, unknown>)?.organization,
        })),
        top_skills: skills.map((s: { name: string; document_count: number }) => s.name),
      }, null, 2)

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey) throw new Error('Gemini API key not configured')

      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      const prompt = buildAnalysisPrompt(resumeText, memoryContext)
      const response = await model.generateContent(prompt)
      const raw = response.response.text().trim()
      const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
      const parsed = JSON.parse(cleaned) as AnalysisResult

      setResult(parsed)
    } catch (err) {
      console.error('[ResumeAnalyzer]', err)
      setError('Failed to analyze resume. Please check your API key and try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }, [resumeText, user?.id])

  const handleExport = () => {
    if (!result) return
    const text = [
      '# Resume Analysis Report',
      '',
      `## Summary\n${result.summary}`,
      '',
      `## Coverage Score: ${result.coverageScore}/100`,
      '',
      '## Gaps Detected',
      ...result.gaps.map((g) => `- [${g.impact.toUpperCase()}] ${g.title}: ${g.description}`),
      '',
      '## Suggestions',
      ...result.suggestions.map((s) => `- ${s}`),
      '',
      '## Strengths',
      ...result.strengths.map((s) => `- ${s}`),
    ].join('\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'resume-analysis.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppShell
      title="Resume Analyzer"
      breadcrumb={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Resume Analyzer' },
      ]}
    >
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-orange-500" />
            Resume Analyzer
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Compare your resume against all memories. Detect gaps, outdated info, and missing achievements.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Paste Your Resume</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume text here — work experience, projects, skills, certifications..."
                  rows={16}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed"
                  id="resume-input"
                />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleAnalyze}
                    disabled={!resumeText.trim() || isAnalyzing}
                    className="flex-1"
                  >
                    {isAnalyzing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing…</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" />Analyze Resume</>
                    )}
                  </Button>
                  {resumeText && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setResumeText(''); setResult(null) }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="border-dashed">
              <CardContent className="p-4">
                <p className="text-xs font-medium mb-2">How it works:</p>
                <ol className="text-xs text-muted-foreground space-y-1">
                  <li>1. Paste your current resume as plain text</li>
                  <li>2. AI compares it against all your memories</li>
                  <li>3. Get a coverage score and specific gaps</li>
                  <li>4. Export the analysis as a report</li>
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {!result && !isAnalyzing && (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium mb-1">Analysis will appear here</p>
                  <p className="text-xs text-muted-foreground">Paste your resume and click Analyze</p>
                </CardContent>
              </Card>
            )}

            {isAnalyzing && (
              <Card>
                <CardContent className="p-12 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 mx-auto mb-4"
                  >
                    <Sparkles className="w-12 h-12 text-violet-500" />
                  </motion.div>
                  <p className="text-sm font-medium">Analyzing your resume…</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Comparing against your memory archive
                  </p>
                </CardContent>
              </Card>
            )}

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Score + Summary */}
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-6">
                        <CoverageRing score={result.coverageScore} />
                        <div className="flex-1">
                          <p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <Button size="sm" variant="outline" onClick={handleExport}>
                              <Download className="w-3.5 h-3.5 mr-1.5" />
                              Export Report
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleAnalyze}>
                              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                              Re-analyze
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Strengths */}
                  {result.strengths.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2 text-emerald-500">
                          <CheckCircle2 className="w-4 h-4" />
                          Resume Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {result.strengths.map((s, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            {s}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Gaps */}
                  {result.gaps.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2 text-orange-500">
                          <AlertCircle className="w-4 h-4" />
                          Gaps Detected ({result.gaps.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {result.gaps.map((gap, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
                            <Plus className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <p className="text-sm font-medium">{gap.title}</p>
                                <ImpactBadge impact={gap.impact} />
                              </div>
                              <p className="text-xs text-muted-foreground">{gap.description}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Suggestions */}
                  {result.suggestions.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2 text-blue-500">
                          <TrendingUp className="w-4 h-4" />
                          Suggestions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {result.suggestions.map((s, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-xs text-blue-500 font-mono font-bold mt-0.5">{i + 1}.</span>
                            {s}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
