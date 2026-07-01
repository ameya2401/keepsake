// ============================================================
// Keepsake — Reasoning API (Phase 3)
// Cross-memory reasoning using Gemini — no conversational UI
// ============================================================

import Groq from 'groq-sdk'
import { supabase } from './supabase'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface ReasoningAnswer {
  question: string
  answer: string
  confidence: number
  supporting_documents: string[]
  reasoning_chain: string[]
}

export interface MemoryScore {
  documentId: string
  healthScore: number
  issues: string[]
  metadataCompleteness: number
  relationshipCount: number
  hasEmbedding: boolean
  hasTimelineEvent: boolean
}

// ─────────────────────────────────────────────────────────────
// Cross-memory reasoning prompt
// ─────────────────────────────────────────────────────────────

const REASONING_PROMPT = `You are a career intelligence reasoning engine for Keepsake.

Answer the question by reasoning across the user's memory objects (documents, skills, projects, etc.).

Return ONLY valid JSON:
{
  "answer": "Direct, specific answer based on the evidence",
  "confidence": 0.9,
  "supporting_documents": ["document title 1", "document title 2"],
  "reasoning_chain": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ..."
  ]
}

Rules:
- Base your answer ONLY on the provided context
- If evidence is insufficient, say so explicitly
- Reference specific document titles
- Confidence should reflect evidence strength (0.0-1.0)

Question: {QUESTION}

User Context:
{CONTEXT}
`

// ─────────────────────────────────────────────────────────────
// Fetch reasoning context
// ─────────────────────────────────────────────────────────────

async function fetchReasoningContext(userId: string): Promise<string> {
  const [docsResult, skillsResult, graphResult] = await Promise.all([
    supabase
      .from('documents')
      .select('title, category, ai_summary, tags, metadata')
      .eq('user_id', userId)
      .eq('processing_status', 'completed')
      .limit(30),
    supabase
      .from('skills')
      .select('name, document_count, skill_type')
      .eq('user_id', userId)
      .order('document_count', { ascending: false })
      .limit(20),
    supabase
      .from('knowledge_edges')
      .select('relationship, source_node_id, target_node_id')
      .eq('user_id', userId)
      .limit(50),
  ])

  const docs = docsResult.data || []
  const skills = skillsResult.data || []
  const edges = graphResult.data || []

  const context = {
    documents: docs.map((d: {
      title: string
      category: string | null
      ai_summary: string | null
      tags: string[]
      metadata: Record<string, unknown> | null
    }) => ({
      title: d.title,
      category: d.category,
      summary: d.ai_summary,
      tags: d.tags,
      skills: (d.metadata as Record<string, unknown>)?.skills,
      technologies: (d.metadata as Record<string, unknown>)?.technologies,
      organization: (d.metadata as Record<string, unknown>)?.organization,
    })),
    skills: skills,
    graph_relationships: edges.length,
  }

  return JSON.stringify(context, null, 2)
}

// ─────────────────────────────────────────────────────────────
// Main reasoning function
// ─────────────────────────────────────────────────────────────

export async function reasonAcrossMemories(
  question: string,
  userId: string
): Promise<ReasoningAnswer> {
  const fallback: ReasoningAnswer = {
    question,
    answer: 'Unable to reason across memories at this time. Please try again.',
    confidence: 0,
    supporting_documents: [],
    reasoning_chain: [],
  }

  if (!GROQ_API_KEY) return fallback

  try {
    const context = await fetchReasoningContext(userId)
    const groq = new Groq({ apiKey: GROQ_API_KEY, dangerouslyAllowBrowser: true })

    const prompt = REASONING_PROMPT.replace('{QUESTION}', question).replace('{CONTEXT}', context)

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
    const raw = chatCompletion.choices[0]?.message?.content || '{}'
    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    const parsed = JSON.parse(cleaned) as Omit<ReasoningAnswer, 'question'>

    return {
      question,
      answer: parsed.answer || 'No clear answer found.',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      supporting_documents: Array.isArray(parsed.supporting_documents) ? parsed.supporting_documents : [],
      reasoning_chain: Array.isArray(parsed.reasoning_chain) ? parsed.reasoning_chain : [],
    }
  } catch (err) {
    console.error('[ReasoningAPI]', err)
    return fallback
  }
}

// ─────────────────────────────────────────────────────────────
// Compute Memory Health Score for a document
// ─────────────────────────────────────────────────────────────

export async function computeMemoryScore(
  documentId: string,
  userId: string
): Promise<MemoryScore> {
  // Fetch document
  const { data: doc } = await supabase
    .from('documents')
    .select('id, title, category, ai_summary, metadata, tags, extracted_text')
    .eq('id', documentId)
    .single()

  if (!doc) {
    return {
      documentId,
      healthScore: 0,
      issues: ['Document not found'],
      metadataCompleteness: 0,
      relationshipCount: 0,
      hasEmbedding: false,
      hasTimelineEvent: false,
    }
  }

  const issues: string[] = []
  let score = 100

  // Check metadata completeness
  const meta = (doc.metadata as Record<string, unknown>) || {}
  let metaScore = 0
  const metaFields = ['organization', 'skills', 'technologies', 'issue_date', 'title']
  for (const field of metaFields) {
    if (meta[field] && (Array.isArray(meta[field]) ? (meta[field] as unknown[]).length > 0 : true)) {
      metaScore += 20
    }
  }
  if (metaScore < 60) {
    issues.push('Missing key metadata fields')
    score -= (60 - metaScore) / 2
  }

  // Check AI summary
  if (!doc.ai_summary) {
    issues.push('No AI summary generated')
    score -= 10
  }

  // Check category
  if (!doc.category || doc.category === 'other') {
    issues.push('Document not properly categorized')
    score -= 5
  }

  // Check tags
  if (!doc.tags || doc.tags.length === 0) {
    issues.push('No tags extracted')
    score -= 5
  }

  // Check embedding
  const { data: emb } = await supabase
    .from('embeddings')
    .select('id')
    .eq('document_id', documentId)
    .limit(1)
  const hasEmbedding = !!emb && emb.length > 0
  if (!hasEmbedding) {
    issues.push('No vector embedding generated')
    score -= 15
  }

  // Check timeline event
  const { data: tl } = await supabase
    .from('timeline_events')
    .select('id')
    .eq('document_id', documentId)
    .limit(1)
  const hasTimelineEvent = !!tl && tl.length > 0
  if (!hasTimelineEvent) {
    issues.push('Not connected to timeline')
    score -= 10
  }

  // Check relationships
  const { data: edges } = await supabase
    .from('knowledge_edges')
    .select('id')
    .or(`source_node_id.eq.${documentId},target_node_id.eq.${documentId}`)
    .eq('user_id', userId)
    .limit(20)
  const relationshipCount = edges?.length || 0

  if (relationshipCount === 0) {
    issues.push('No relationships in knowledge graph')
    score -= 10
  }

  const healthScore = Math.max(0, Math.min(100, Math.round(score)))

  // Upsert memory score
  await supabase.from('memory_scores').upsert(
    {
      user_id: userId,
      document_id: documentId,
      health_score: healthScore,
      metadata_completeness: metaScore,
      relationship_count: relationshipCount,
      has_embedding: hasEmbedding,
      has_timeline_event: hasTimelineEvent,
      issues,
    },
    { onConflict: 'document_id' }
  )

  return {
    documentId,
    healthScore,
    issues,
    metadataCompleteness: metaScore,
    relationshipCount,
    hasEmbedding,
    hasTimelineEvent,
  }
}

// ─────────────────────────────────────────────────────────────
// Timeline intelligence: detect patterns in events
// ─────────────────────────────────────────────────────────────

export interface TimelinePattern {
  type: 'learning_streak' | 'skill_growth' | 'career_gap' | 'technology_transition' | 'domain_change'
  title: string
  description: string
  period?: string
  items?: string[]
}

export async function detectTimelinePatterns(userId: string): Promise<TimelinePattern[]> {
  const { data: events } = await supabase
    .from('timeline_events')
    .select('title, event_type, event_date, organization, description')
    .eq('user_id', userId)
    .order('event_date', { ascending: true })

  if (!events || events.length < 2) return []

  const patterns: TimelinePattern[] = []
  const eventData = events as Array<{
    title: string
    event_type: string | null
    event_date: string
    organization: string | null
    description: string | null
  }>

  // Detect learning streaks (multiple certs/courses in same period)
  const certs = eventData.filter((e) => ['certificate', 'course_completion', 'workshop'].includes(e.event_type || ''))
  if (certs.length >= 3) {
    patterns.push({
      type: 'learning_streak',
      title: 'Active Learning Period',
      description: `You completed ${certs.length} certifications and courses, showing a strong learning trajectory.`,
      items: certs.map((c) => c.title).slice(0, 5),
    })
  }

  // Detect career gaps
  for (let i = 1; i < eventData.length; i++) {
    const prev = new Date(eventData[i - 1].event_date)
    const curr = new Date(eventData[i].event_date)
    const diffMonths = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24 * 30)
    if (diffMonths > 6 && diffMonths < 36) {
      patterns.push({
        type: 'career_gap',
        title: `${Math.round(diffMonths)}-month gap detected`,
        description: `There's a ${Math.round(diffMonths)}-month gap between "${eventData[i - 1].title}" and "${eventData[i].title}". Consider documenting activities during this period.`,
        period: `${eventData[i - 1].event_date} – ${eventData[i].event_date}`,
      })
      break // Report first gap only
    }
  }

  // Detect technology transitions
  const techEvents = eventData.filter((e) => e.event_type === 'project' || e.event_type === 'internship')
  if (techEvents.length >= 2) {
    patterns.push({
      type: 'technology_transition',
      title: 'Technology Evolution',
      description: `Your projects show a progression across ${techEvents.length} different roles/projects, indicating growing technical depth.`,
      items: techEvents.map((e) => e.title).slice(0, 4),
    })
  }

  return patterns
}
