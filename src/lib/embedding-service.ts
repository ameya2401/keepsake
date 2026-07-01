// ============================================================
// Keepsake — Embedding Service (Phase 3)
// Uses Gemini text-embedding-004 as the primary embedding model
// Falls back gracefully if API is unavailable
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from './supabase'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const EMBEDDING_MODEL = 'text-embedding-004'
const EMBEDDING_DIM = 768

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface EmbeddingResult {
  documentId: string
  vector: number[]
  modelName: string
  embeddingType: 'full_text' | 'summary' | 'metadata' | 'skills'
}

// ─────────────────────────────────────────────────────────────
// Generate a single embedding vector via Gemini
// ─────────────────────────────────────────────────────────────

async function generateEmbedding(text: string): Promise<number[]> {
  if (!GEMINI_API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY is not configured')
  }
  if (!text || text.trim().length === 0) {
    // Return zero vector for empty content
    return new Array(EMBEDDING_DIM).fill(0)
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL })

  // Truncate to safe limit for embedding model
  const truncated = text.trim().slice(0, 8000)

  const result = await model.embedContent(truncated)
  return result.embedding.values
}

// ─────────────────────────────────────────────────────────────
// Build combined text for full-document embedding
// ─────────────────────────────────────────────────────────────

function buildDocumentText(doc: {
  title?: string
  ai_summary?: string | null
  extracted_text?: string | null
  tags?: string[]
  metadata?: Record<string, unknown> | null
}): string {
  const parts: string[] = []

  if (doc.title) parts.push(`Title: ${doc.title}`)
  if (doc.ai_summary) parts.push(`Summary: ${doc.ai_summary}`)
  if (doc.tags?.length) parts.push(`Tags: ${doc.tags.join(', ')}`)

  const meta = doc.metadata as Record<string, unknown> | null
  if (meta) {
    if (meta.organization) parts.push(`Organization: ${meta.organization}`)
    if (meta.skills && Array.isArray(meta.skills)) parts.push(`Skills: ${(meta.skills as string[]).join(', ')}`)
    if (meta.technologies && Array.isArray(meta.technologies)) parts.push(`Technologies: ${(meta.technologies as string[]).join(', ')}`)
    if (meta.projects && Array.isArray(meta.projects)) parts.push(`Projects: ${(meta.projects as string[]).join(', ')}`)
  }

  if (doc.extracted_text) {
    parts.push(doc.extracted_text.slice(0, 4000))
  }

  return parts.join('\n')
}

// ─────────────────────────────────────────────────────────────
// Store embedding vector in Supabase
// ─────────────────────────────────────────────────────────────

async function storeEmbedding(
  documentId: string,
  userId: string,
  vector: number[],
  embeddingType: 'full_text' | 'summary' | 'metadata' | 'skills',
  contentSnippet: string
): Promise<void> {
  // Upsert — replace if same doc+type already exists
  const { error } = await supabase
    .from('embeddings')
    .upsert(
      {
        document_id: documentId,
        user_id: userId,
        embedding_type: embeddingType,
        model_name: EMBEDDING_MODEL,
        dimension: EMBEDDING_DIM,
        vector: `[${vector.join(',')}]`,
        content_snippet: contentSnippet.slice(0, 300),
      },
      { onConflict: 'document_id,embedding_type' }
    )

  if (error) {
    // Not a fatal error — log and continue
    console.warn('[EmbeddingService] Store error:', error.message)
  }
}

// ─────────────────────────────────────────────────────────────
// Main: Generate and store all embeddings for a document
// ─────────────────────────────────────────────────────────────

export async function generateDocumentEmbeddings(
  documentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch document data
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('id, title, ai_summary, extracted_text, tags, metadata')
      .eq('id', documentId)
      .single()

    if (fetchError || !doc) {
      return { success: false, error: 'Document not found' }
    }

    const docData = doc as {
      id: string
      title: string
      ai_summary: string | null
      extracted_text: string | null
      tags: string[]
      metadata: Record<string, unknown> | null
    }

    // 1. Full text embedding
    const fullText = buildDocumentText(docData)
    if (fullText.trim().length > 0) {
      const fullVector = await generateEmbedding(fullText)
      await storeEmbedding(documentId, userId, fullVector, 'full_text', fullText.slice(0, 300))
    }

    // 2. Summary embedding (if AI summary exists)
    if (docData.ai_summary && docData.ai_summary.trim().length > 0) {
      const summaryVector = await generateEmbedding(docData.ai_summary)
      await storeEmbedding(documentId, userId, summaryVector, 'summary', docData.ai_summary.slice(0, 300))
    }

    // 3. Skills/Technologies embedding
    const meta = docData.metadata as Record<string, unknown> | null
    if (meta) {
      const skillsParts: string[] = []
      if (Array.isArray(meta.skills)) skillsParts.push(`Skills: ${(meta.skills as string[]).join(', ')}`)
      if (Array.isArray(meta.technologies)) skillsParts.push(`Technologies: ${(meta.technologies as string[]).join(', ')}`)
      if (Array.isArray(meta.keywords)) skillsParts.push(`Keywords: ${(meta.keywords as string[]).join(', ')}`)

      if (skillsParts.length > 0) {
        const skillsText = skillsParts.join('\n')
        const skillsVector = await generateEmbedding(skillsText)
        await storeEmbedding(documentId, userId, skillsVector, 'skills', skillsText.slice(0, 300))
      }
    }

    return { success: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Embedding generation failed'
    console.error('[EmbeddingService]', msg)
    return { success: false, error: msg }
  }
}

// ─────────────────────────────────────────────────────────────
// Semantic Search: find similar documents by query text
// ─────────────────────────────────────────────────────────────

export interface SemanticSearchResult {
  documentId: string
  similarity: number
  title: string
  category: string
  ai_summary: string | null
  tags: string[]
}

export async function semanticSearch(
  query: string,
  userId: string,
  threshold = 0.4,
  limit = 12
): Promise<SemanticSearchResult[]> {
  try {
    // Generate query embedding
    const queryVector = await generateEmbedding(query)

    // Call Supabase RPC for vector similarity search
    const { data, error } = await supabase.rpc('search_memories_by_vector', {
      query_embedding: `[${queryVector.join(',')}]`,
      match_threshold: threshold,
      match_count: limit,
      p_user_id: userId,
    })

    if (error) {
      console.warn('[SemanticSearch] RPC error:', error.message)
      return []
    }

    return (data || []) as SemanticSearchResult[]
  } catch (err) {
    console.error('[SemanticSearch]', err)
    return []
  }
}

// ─────────────────────────────────────────────────────────────
// Find similar memories for a given document
// ─────────────────────────────────────────────────────────────

export async function findSimilarMemories(
  documentId: string,
  userId: string,
  limit = 5
): Promise<SemanticSearchResult[]> {
  try {
    // Get the document's embedding
    const { data: emb, error: embError } = await supabase
      .from('embeddings')
      .select('vector')
      .eq('document_id', documentId)
      .eq('embedding_type', 'full_text')
      .single()

    if (embError || !emb?.vector) return []

    const { data, error } = await supabase.rpc('search_memories_by_vector', {
      query_embedding: emb.vector,
      match_threshold: 0.5,
      match_count: limit + 1, // +1 to exclude self
      p_user_id: userId,
    })

    if (error) return []

    // Exclude the document itself
    const results = ((data || []) as SemanticSearchResult[]).filter(
      (r) => r.documentId !== documentId
    )

    // Cache to similar_memories table
    for (const r of results.slice(0, limit)) {
      await supabase
        .from('similar_memories')
        .upsert(
          {
            user_id: userId,
            document_id: documentId,
            similar_document_id: r.documentId,
            similarity_score: r.similarity,
          },
          { onConflict: 'document_id,similar_document_id' }
        )
    }

    return results.slice(0, limit)
  } catch (err) {
    console.error('[SimilarMemories]', err)
    return []
  }
}

// ─────────────────────────────────────────────────────────────
// Batch: generate embeddings for all unprocessed documents
// ─────────────────────────────────────────────────────────────

export async function batchGenerateEmbeddings(userId: string): Promise<{
  processed: number
  failed: number
}> {
  // Find documents without embeddings
  const { data: docs } = await supabase
    .from('documents')
    .select('id')
    .eq('user_id', userId)
    .eq('processing_status', 'completed')

  if (!docs || docs.length === 0) return { processed: 0, failed: 0 }

  const { data: existingEmbs } = await supabase
    .from('embeddings')
    .select('document_id')
    .eq('user_id', userId)
    .eq('embedding_type', 'full_text')

  const existingIds = new Set((existingEmbs || []).map((e: { document_id: string }) => e.document_id))
  const pendingDocs = docs.filter((d: { id: string }) => !existingIds.has(d.id))

  let processed = 0
  let failed = 0

  for (const doc of pendingDocs) {
    const result = await generateDocumentEmbeddings(doc.id, userId)
    if (result.success) processed++
    else failed++
    // Small delay to respect rate limits
    await new Promise((r) => setTimeout(r, 500))
  }

  return { processed, failed }
}
