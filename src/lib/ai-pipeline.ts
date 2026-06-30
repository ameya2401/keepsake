// ============================================================
// MemoryVerse — AI Processing Pipeline
// Uses Gemini API for document intelligence
// Phase 2: text extraction → metadata → classification → entities → tags → timeline
// Phase 3: embeddings → knowledge graph → recommendations → memory score
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai'
import { extractText, fileToBase64, isImageFile } from './text-extractor'
import { supabase } from './supabase'
import type { DocumentCategory } from '@/types/database'
import { generateDocumentEmbeddings, findSimilarMemories } from './embedding-service'
import { buildKnowledgeGraphForDocument } from './knowledge-graph-service'
import { generateRecommendations } from './recommendation-engine'
import { computeMemoryScore } from './reasoning-api'

// ─────────────────────────────────────────────────────────────
// Gemini Client
// ─────────────────────────────────────────────────────────────

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''

function getGeminiClient() {
  if (!GEMINI_API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY is not configured. Please add it to your .env.local file.')
  }
  return new GoogleGenerativeAI(GEMINI_API_KEY)
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface AIExtractionResult {
  title: string
  document_type: DocumentCategory
  issuer: string
  organization: string
  location: string
  issue_date: string
  completion_date: string
  start_date: string
  end_date: string
  skills: SkillEntry[]
  technologies: string[]
  projects: string[]
  internships: string[]
  achievements: string[]
  education: string[]
  people: string[]
  keywords: string[]
  summary: string
  tags: string[]
  timeline_candidate: TimelineCandidate | null
  confidence: number
  language: string
}

export interface SkillEntry {
  name: string
  type: 'technical' | 'soft' | 'domain'
}

export interface TimelineCandidate {
  date: string
  title: string
  description: string
  confidence: number
}

export type PipelineStep =
  | 'queued'
  | 'extracting_text'
  | 'analyzing'
  | 'classifying'
  | 'extracting_entities'
  | 'generating_tags'
  | 'building_timeline'
  | 'saving'
  | 'generating_embeddings'
  | 'building_knowledge_graph'
  | 'generating_recommendations'
  | 'completed'
  | 'failed'

export interface PipelineProgress {
  step: PipelineStep
  percent: number
  message: string
  error?: string
}

export type ProgressCallback = (progress: PipelineProgress) => void

// ─────────────────────────────────────────────────────────────
// JSON Parser helper — handles markdown-wrapped JSON
// ─────────────────────────────────────────────────────────────

function parseJsonResponse(raw: string): unknown {
  let cleaned = raw.trim()
  // Remove markdown fences
  cleaned = cleaned.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
  return JSON.parse(cleaned)
}

// ─────────────────────────────────────────────────────────────
// AI Analysis Prompt
// ─────────────────────────────────────────────────────────────

const EXTRACTION_PROMPT = `You are a document intelligence engine for MemoryVerse, an AI-powered career memory system.

Analyze this document and extract structured information. Return ONLY valid JSON with no markdown formatting.

JSON Schema:
{
  "title": "Document title or inferred title",
  "document_type": "One of: resume|certificate|internship|project|research|academic_transcript|achievement|portfolio|recommendation_letter|cover_letter|course_completion|workshop|hackathon|volunteer_work|other",
  "issuer": "Who issued this document (organization/company/platform)",
  "organization": "Primary organization mentioned",
  "location": "Location if mentioned",
  "issue_date": "ISO date YYYY-MM-DD or empty string",
  "completion_date": "ISO date YYYY-MM-DD or empty string",
  "start_date": "ISO date YYYY-MM-DD or empty string",
  "end_date": "ISO date YYYY-MM-DD or empty string",
  "skills": [{"name": "skill name", "type": "technical|soft|domain"}],
  "technologies": ["technology names"],
  "projects": ["project names"],
  "internships": ["internship/job role names"],
  "achievements": ["achievement descriptions"],
  "education": ["education entries"],
  "people": ["person names mentioned"],
  "keywords": ["important keywords"],
  "summary": "Concise 2-3 sentence summary of what this document represents. Max 100 words.",
  "tags": ["5-10 relevant tags for categorization"],
  "timeline_candidate": {
    "date": "ISO date YYYY-MM-DD",
    "title": "Event title for timeline",
    "description": "Brief event description",
    "confidence": 0.9
  },
  "confidence": 0.95,
  "language": "en"
}

Rules:
- document_type must be one of the exact enum values
- Return timeline_candidate only if there's a clear dated event
- Return timeline_candidate as null if no clear date exists
- All date fields should be ISO format YYYY-MM-DD or empty string
- confidence should reflect how certain you are about the extraction (0.0-1.0)
- tags should be concise, single or hyphenated words
- Return ONLY the JSON object, no explanations

Document content:
`

// ─────────────────────────────────────────────────────────────
// Retry helper
// ─────────────────────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2, delay = 1500): Promise<T> {
  let lastError: unknown
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (i < maxRetries) {
        await new Promise((r) => setTimeout(r, delay * (i + 1)))
      }
    }
  }
  throw lastError
}

// ─────────────────────────────────────────────────────────────
// Core AI Analysis
// ─────────────────────────────────────────────────────────────

async function analyzeWithGemini(
  text: string,
  file: File | null
): Promise<AIExtractionResult> {
  const genAI = getGeminiClient()

  return withRetry(async () => {
    let result: { response: { text: () => string } }

    if (file && isImageFile(file.type)) {
      // Use Gemini Vision for images
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const base64 = await fileToBase64(file)
      const imagePart = {
        inlineData: {
          data: base64,
          mimeType: file.type,
        },
      }
      result = await model.generateContent([
        EXTRACTION_PROMPT + '\n[Document is an image — analyze the visual content directly]',
        imagePart,
      ])
    } else {
      // Text-based analysis
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const truncatedText = text.slice(0, 12000) // Gemini context window safe limit
      result = await model.generateContent(EXTRACTION_PROMPT + truncatedText)
    }

    const rawResponse = result.response.text()
    const parsed = parseJsonResponse(rawResponse) as Partial<AIExtractionResult>

    // Validate and sanitize
    return {
      title: parsed.title || 'Untitled Document',
      document_type: parsed.document_type || 'other',
      issuer: parsed.issuer || '',
      organization: parsed.organization || '',
      location: parsed.location || '',
      issue_date: parsed.issue_date || '',
      completion_date: parsed.completion_date || '',
      start_date: parsed.start_date || '',
      end_date: parsed.end_date || '',
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      technologies: Array.isArray(parsed.technologies) ? parsed.technologies : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      internships: Array.isArray(parsed.internships) ? parsed.internships : [],
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
      people: Array.isArray(parsed.people) ? parsed.people : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      summary: parsed.summary || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      timeline_candidate: parsed.timeline_candidate || null,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
      language: parsed.language || 'en',
    }
  })
}

// ─────────────────────────────────────────────────────────────
// Update processing status in Supabase
// ─────────────────────────────────────────────────────────────

async function updateDocumentStatus(
  documentId: string,
  status: string,
  extraFields?: Record<string, unknown>
) {
  await supabase
    .from('documents')
    .update({ processing_status: status, ...extraFields })
    .eq('id', documentId)
}

async function updateJobStatus(
  jobId: string,
  status: string,
  progress: number,
  extraFields?: Record<string, unknown>
) {
  await supabase
    .from('ai_jobs')
    .update({
      status,
      progress,
      ...extraFields,
      ...(status === 'processing' && !extraFields?.started_at
        ? { started_at: new Date().toISOString() }
        : {}),
      ...(status === 'completed' || status === 'failed'
        ? { completed_at: new Date().toISOString() }
        : {}),
    })
    .eq('id', jobId)
}

// ─────────────────────────────────────────────────────────────
// Save extracted entities to Supabase
// ─────────────────────────────────────────────────────────────

async function saveExtractedEntities(
  documentId: string,
  userId: string,
  extracted: AIExtractionResult
) {
  // 1. Save skills
  for (const skill of extracted.skills) {
    // Upsert skill (deduplicate by name + user)
    const { data: existing } = await supabase
      .from('skills')
      .select('id, document_count')
      .eq('user_id', userId)
      .eq('name', skill.name)
      .single()

    if (existing) {
      await supabase
        .from('skills')
        .update({ document_count: (existing.document_count || 0) + 1 })
        .eq('id', existing.id)
    } else {
      await supabase.from('skills').insert({
        user_id: userId,
        name: skill.name,
        skill_type: skill.type,
        document_count: 1,
        first_seen_at: new Date().toISOString(),
      })
    }
  }

  // 2. Save timeline candidate (as timeline_events with source_type='ai_generated')
  if (extracted.timeline_candidate && extracted.timeline_candidate.date) {
    const tc = extracted.timeline_candidate
    await supabase.from('timeline_events').insert({
      user_id: userId,
      document_id: documentId,
      title: tc.title,
      description: tc.description,
      event_date: tc.date,
      event_type: extracted.document_type,
      organization: extracted.organization || null,
      is_milestone: extracted.confidence > 0.8,
      confidence_score: tc.confidence,
      source_type: 'ai_generated',
    })
  }

  // 3. Log activity
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'document_processed',
    entity_type: 'document',
    entity_id: documentId,
    metadata: {
      category: extracted.document_type,
      skills_extracted: extracted.skills.length,
      technologies_extracted: extracted.technologies.length,
      confidence: extracted.confidence,
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Main Pipeline Orchestrator
// ─────────────────────────────────────────────────────────────

export async function runAIPipeline(
  documentId: string,
  userId: string,
  file: File,
  jobId: string,
  onProgress?: ProgressCallback
): Promise<{ success: boolean; error?: string }> {
  const report = (step: PipelineStep, percent: number, message: string) => {
    onProgress?.({ step, percent, message })
  }

  try {
    // ── Step 1: Mark as queued ──────────────────────────────
    report('queued', 5, 'Document queued for AI processing...')
    await updateDocumentStatus(documentId, 'queued')
    await updateJobStatus(jobId, 'processing', 5, { started_at: new Date().toISOString() })

    // ── Step 2: Extract Text ────────────────────────────────
    report('extracting_text', 15, 'Extracting text from document...')
    await updateJobStatus(jobId, 'processing', 15)

    const extractionResult = await extractText(file)

    // If text extraction completely failed and it's not an image
    if (extractionResult.error && !isImageFile(file.type) && extractionResult.text.length === 0) {
      throw new Error(extractionResult.error)
    }

    // ── Step 3: AI Analysis ─────────────────────────────────
    report('analyzing', 35, 'AI is analyzing document content...')
    await updateDocumentStatus(documentId, 'processing')
    await updateJobStatus(jobId, 'processing', 35)

    const aiResult = await analyzeWithGemini(extractionResult.text, file)

    // ── Step 4: Classification ──────────────────────────────
    report('classifying', 60, `Classified as: ${aiResult.document_type}`)
    await updateJobStatus(jobId, 'processing', 60)

    // ── Step 5: Entity Extraction ───────────────────────────
    report('extracting_entities', 75, `Found ${aiResult.skills.length} skills, ${aiResult.technologies.length} technologies`)
    await updateJobStatus(jobId, 'processing', 75)

    // ── Step 6: Tags & Timeline ─────────────────────────────
    report('generating_tags', 85, 'Generating tags and timeline events...')
    await updateJobStatus(jobId, 'processing', 85)

    // ── Step 7: Save to Database ────────────────────────────
    report('saving', 92, 'Saving memory to database...')
    await updateJobStatus(jobId, 'processing', 92)

    // Build metadata object
    const metadata = {
      title: aiResult.title,
      document_type: aiResult.document_type,
      issuer: aiResult.issuer,
      organization: aiResult.organization,
      location: aiResult.location,
      issue_date: aiResult.issue_date,
      completion_date: aiResult.completion_date,
      start_date: aiResult.start_date,
      end_date: aiResult.end_date,
      skills: aiResult.skills.map((s) => s.name),
      technologies: aiResult.technologies,
      projects: aiResult.projects,
      achievements: aiResult.achievements,
      education: aiResult.education,
      keywords: aiResult.keywords,
      confidence: aiResult.confidence,
    }

    // Update document with AI results
    await supabase
      .from('documents')
      .update({
        title: aiResult.title || file.name.replace(/\.[^.]+$/, ''),
        category: aiResult.document_type,
        processing_status: 'completed',
        extracted_text: extractionResult.text || null,
        ai_summary: aiResult.summary,
        confidence_score: aiResult.confidence,
        metadata,
        tags: aiResult.tags,
      })
      .eq('id', documentId)

    // Save extracted entities
    await saveExtractedEntities(documentId, userId, aiResult)

    // ── Phase 3: Intelligence Pipeline ─────────────────────

    // ── Step 8: Generate Embeddings ─────────────────────────
    report('generating_embeddings', 94, 'Generating semantic embeddings...')
    await updateJobStatus(jobId, 'processing', 94)
    try {
      await generateDocumentEmbeddings(documentId, userId)
    } catch (embErr) {
      console.warn('[Pipeline] Embedding generation failed (non-fatal):', embErr)
    }

    // ── Step 9: Build Knowledge Graph ───────────────────────
    report('building_knowledge_graph', 96, 'Building knowledge graph...')
    await updateJobStatus(jobId, 'processing', 96)
    try {
      await buildKnowledgeGraphForDocument(documentId, userId)
    } catch (graphErr) {
      console.warn('[Pipeline] Knowledge graph build failed (non-fatal):', graphErr)
    }

    // ── Step 10: Find Similar Memories ──────────────────────
    try {
      await findSimilarMemories(documentId, userId, 5)
    } catch (simErr) {
      console.warn('[Pipeline] Similar memory detection failed (non-fatal):', simErr)
    }

    // ── Step 11: Compute Memory Score ───────────────────────
    try {
      await computeMemoryScore(documentId, userId)
    } catch (scoreErr) {
      console.warn('[Pipeline] Memory score computation failed (non-fatal):', scoreErr)
    }

    // ── Step 12: Generate Recommendations ───────────────────
    report('generating_recommendations', 98, 'Generating smart recommendations...')
    await updateJobStatus(jobId, 'processing', 98)
    try {
      await generateRecommendations(userId)
    } catch (recErr) {
      console.warn('[Pipeline] Recommendation generation failed (non-fatal):', recErr)
    }

    // Mark job complete
    await updateJobStatus(jobId, 'completed', 100)

    // ── Step 13: Done ────────────────────────────────────────
    report('completed', 100, 'Memory created and intelligence updated!')

    return { success: true }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'AI processing failed'

    report('failed', 0, errMsg, )

    // Mark as failed in DB
    await updateDocumentStatus(documentId, 'failed')
    await updateJobStatus(jobId, 'failed', 0, { error_message: errMsg })

    return { success: false, error: errMsg }
  }
}

// ─────────────────────────────────────────────────────────────
// Create a processing job record in Supabase
// ─────────────────────────────────────────────────────────────

export async function createProcessingJob(
  documentId: string,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('ai_jobs')
    .insert({
      document_id: documentId,
      user_id: userId,
      job_type: 'metadata_extraction',
      status: 'queued',
      progress: 0,
      retry_count: 0,
    })
    .select('id')
    .single()

  if (error || !data) return null
  return data.id
}

// ─────────────────────────────────────────────────────────────
// Retry a failed job
// ─────────────────────────────────────────────────────────────

export async function retryJob(jobId: string): Promise<void> {
  await supabase
    .from('ai_jobs')
    .update({
      status: 'queued',
      progress: 0,
      error_message: null,
      retry_count: supabase.rpc as unknown as number, // handled via DB
    })
    .eq('id', jobId)

  // Simple increment
  await supabase.rpc('increment_retry_count', { job_id: jobId })
}
