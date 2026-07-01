// ============================================================
// Keepsake — Recommendation Engine (Phase 3)
// Generates intelligent, contextual career recommendations
// ============================================================

import Groq from 'groq-sdk'
import { supabase } from './supabase'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface RecommendationItem {
  id: string
  user_id: string
  document_id: string | null
  type: string
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  is_dismissed: boolean
  created_at: string
}

interface UserContext {
  documents: Array<{
    id: string
    title: string
    category: string | null
    tags: string[]
    metadata: Record<string, unknown> | null
  }>
  skills: Array<{ name: string; document_count: number; skill_type: string }>
  timeline_events: Array<{ title: string; event_type: string | null; event_date: string }>
}

// ─────────────────────────────────────────────────────────────
// Fetch user context for recommendations
// ─────────────────────────────────────────────────────────────

async function fetchUserContext(userId: string): Promise<UserContext> {
  const [docsResult, skillsResult, timelineResult] = await Promise.all([
    supabase
      .from('documents')
      .select('id, title, category, tags, metadata')
      .eq('user_id', userId)
      .eq('processing_status', 'completed')
      .limit(50),
    supabase
      .from('skills')
      .select('name, document_count, skill_type')
      .eq('user_id', userId)
      .order('document_count', { ascending: false })
      .limit(30),
    supabase
      .from('timeline_events')
      .select('title, event_type, event_date')
      .eq('user_id', userId)
      .order('event_date', { ascending: false })
      .limit(20),
  ])

  return {
    documents: (docsResult.data || []) as UserContext['documents'],
    skills: (skillsResult.data || []) as UserContext['skills'],
    timeline_events: (timelineResult.data || []) as UserContext['timeline_events'],
  }
}

// ─────────────────────────────────────────────────────────────
// AI-powered recommendation generation
// ─────────────────────────────────────────────────────────────

const RECOMMENDATION_PROMPT = `You are an intelligent career advisor for Keepsake. Based on a user's uploaded documents and skills, generate specific, actionable career recommendations.

Return ONLY valid JSON with no markdown:
{
  "recommendations": [
    {
      "type": "one of: resume_update|portfolio_suggestion|career_insight|missing_metadata|skill_gap|relationship_suggestion",
      "title": "Short actionable title",
      "description": "Specific recommendation (2-3 sentences, never generic)",
      "impact": "low|medium|high",
      "document_reference": "title of relevant document or null"
    }
  ]
}

Rules:
- Never give generic advice like 'update your LinkedIn'
- Reference specific documents, skills, and technologies from the user's data
- Maximum 8 recommendations
- Focus on what's missing or under-represented
- Detect skill clusters and cross-reference documents

User Data:
`

interface AIRecommendation {
  type: string
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  document_reference: string | null
}

async function generateAIRecommendations(context: UserContext): Promise<AIRecommendation[]> {
  if (!GROQ_API_KEY || context.documents.length === 0) return []

  try {
    const groq = new Groq({ apiKey: GROQ_API_KEY, dangerouslyAllowBrowser: true })

    const contextStr = JSON.stringify(
      {
        documents: context.documents.map((d) => ({
          title: d.title,
          category: d.category,
          tags: d.tags,
          skills: (d.metadata as Record<string, unknown>)?.skills,
          technologies: (d.metadata as Record<string, unknown>)?.technologies,
          organization: (d.metadata as Record<string, unknown>)?.organization,
        })),
        skills: context.skills,
        timeline: context.timeline_events,
      },
      null,
      2
    )

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: RECOMMENDATION_PROMPT + contextStr }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
    const raw = chatCompletion.choices[0]?.message?.content || '{}'
    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    const parsed = JSON.parse(cleaned) as { recommendations: AIRecommendation[] }

    return Array.isArray(parsed.recommendations) ? parsed.recommendations : []
  } catch (err) {
    console.warn('[RecommendationEngine] AI generation failed:', err)
    return []
  }
}

// ─────────────────────────────────────────────────────────────
// Rule-based recommendations (always runs, no AI needed)
// ─────────────────────────────────────────────────────────────

function generateRuleBasedRecommendations(context: UserContext): AIRecommendation[] {
  const recs: AIRecommendation[] = []
  const categories = new Set(context.documents.map((d) => d.category))
  const docTitles = context.documents.map((d) => d.title.toLowerCase())

  // Check if resume exists
  if (!categories.has('resume')) {
    recs.push({
      type: 'resume_update',
      title: 'Upload your resume',
      description:
        'Your knowledge base has no resume. Uploading one will let Keepsake cross-reference your skills, projects, and experiences to identify gaps.',
      impact: 'high',
      document_reference: null,
    })
  }

  // Check for uncovered skills
  const topSkills = context.skills.slice(0, 5).map((s) => s.name)
  if (topSkills.length > 0 && !categories.has('resume')) {
    recs.push({
      type: 'missing_metadata',
      title: `${topSkills[0]} skills not linked to a resume`,
      description: `You have ${context.skills.length} extracted skills including ${topSkills.slice(0, 3).join(', ')}, but no resume to consolidate them. Upload your resume to see skill coverage.`,
      impact: 'medium',
      document_reference: null,
    })
  }

  // Check for portfolio
  if (!categories.has('portfolio') && context.documents.filter((d) => d.category === 'project').length >= 2) {
    recs.push({
      type: 'portfolio_suggestion',
      title: 'Create a portfolio from your projects',
      description: `You have ${context.documents.filter((d) => d.category === 'project').length} project documents. Consider creating a portfolio document to showcase them collectively.`,
      impact: 'medium',
      document_reference: null,
    })
  }

  // Check for certificates with no related projects
  const certs = context.documents.filter((d) => d.category === 'certificate')
  const projects = context.documents.filter((d) => d.category === 'project')
  if (certs.length > 0 && projects.length === 0) {
    recs.push({
      type: 'career_insight',
      title: 'Apply your certifications in projects',
      description: `You have ${certs.length} certificate(s) but no project documents. Upload projects that demonstrate the skills from your ${certs[0]?.title || 'certificates'}.`,
      impact: 'high',
      document_reference: certs[0]?.title || null,
    })
  }

  // Missing timeline events
  if (context.timeline_events.length === 0 && context.documents.length > 2) {
    recs.push({
      type: 'missing_metadata',
      title: 'Add dates to your documents',
      description:
        'Your timeline is empty. Ensure your documents contain clear dates so Keepsake can automatically build your career timeline.',
      impact: 'medium',
      document_reference: null,
    })
  }

  // Duplicate category detection
  const certsByTitle = certs.map((c) => c.title.toLowerCase())
  const possibleDuplicates = certsByTitle.filter(
    (t, i) => certsByTitle.some((t2, j) => i !== j && (t.includes(t2) || t2.includes(t)))
  )
  if (possibleDuplicates.length > 0) {
    recs.push({
      type: 'relationship_suggestion',
      title: 'Potential duplicate certificates detected',
      description: `Some of your certificates appear to cover similar topics. Review and merge related certificates to improve knowledge graph clarity.`,
      impact: 'low',
      document_reference: null,
    })
  }

  // Hackathon not on resume
  const hasHackathon = categories.has('hackathon')
  const hasResume = categories.has('resume')
  const resumeHasHackathon = hasResume && docTitles.some((t) => t.includes('hackathon'))
  if (hasHackathon && hasResume && !resumeHasHackathon) {
    recs.push({
      type: 'resume_update',
      title: 'Hackathon achievement missing from resume',
      description:
        'Your hackathon participation is not reflected in your resume. Add it to demonstrate practical, collaborative experience.',
      impact: 'high',
      document_reference: null,
    })
  }

  return recs
}

// ─────────────────────────────────────────────────────────────
// Main: Generate and save recommendations
// ─────────────────────────────────────────────────────────────

export async function generateRecommendations(
  userId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const context = await fetchUserContext(userId)

    if (context.documents.length === 0) {
      return { success: true, count: 0 }
    }

    // Run both AI and rule-based in parallel
    const [aiRecs, ruleRecs] = await Promise.all([
      generateAIRecommendations(context),
      Promise.resolve(generateRuleBasedRecommendations(context)),
    ])

    // Merge and deduplicate by title
    const allRecs = [...ruleRecs, ...aiRecs]
    const seenTitles = new Set<string>()
    const uniqueRecs = allRecs.filter((r) => {
      if (seenTitles.has(r.title.toLowerCase())) return false
      seenTitles.add(r.title.toLowerCase())
      return true
    })

    // Clear old undismissed recommendations
    await supabase
      .from('recommendations')
      .delete()
      .eq('user_id', userId)
      .eq('is_dismissed', false)

    // Find document IDs for references
    const docMap = new Map(context.documents.map((d) => [d.title.toLowerCase(), d.id]))

    // Insert new recommendations
    const rows = uniqueRecs.slice(0, 8).map((r) => ({
      user_id: userId,
      document_id: r.document_reference ? (docMap.get(r.document_reference.toLowerCase()) ?? null) : null,
      type: r.type,
      title: r.title,
      description: r.description,
      impact: r.impact || 'medium',
      is_dismissed: false,
    }))

    if (rows.length > 0) {
      const { error } = await supabase.from('recommendations').insert(rows)
      if (error) console.warn('[RecommendationEngine] Insert error:', error.message)
    }

    return { success: true, count: rows.length }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Recommendation generation failed'
    console.error('[RecommendationEngine]', msg)
    return { success: false, count: 0, error: msg }
  }
}

// ─────────────────────────────────────────────────────────────
// Fetch recommendations for display
// ─────────────────────────────────────────────────────────────

export async function fetchRecommendations(userId: string): Promise<RecommendationItem[]> {
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return []
  return (data || []) as RecommendationItem[]
}

// ─────────────────────────────────────────────────────────────
// Dismiss a recommendation
// ─────────────────────────────────────────────────────────────

export async function dismissRecommendation(id: string): Promise<void> {
  await supabase.from('recommendations').update({ is_dismissed: true }).eq('id', id)
}
