// ============================================================
// Keepsake — Knowledge Graph Service (Phase 3)
// Builds and maintains the knowledge graph in Supabase
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from './supabase'
import type { NodeType } from '@/types/database'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string
  label: string
  node_type: NodeType
  properties: Record<string, unknown>
  document_ids: string[]
  created_at: string
}

export interface GraphEdge {
  id: string
  source_node_id: string
  target_node_id: string
  relationship: string
  confidence_score: number | null
  document_ids: string[]
  created_at: string
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

// ─────────────────────────────────────────────────────────────
// AI-powered relationship discovery prompt
// ─────────────────────────────────────────────────────────────

const RELATIONSHIP_PROMPT = `You are a knowledge graph builder for Keepsake, a career intelligence system.

Given the following document metadata, extract all knowledge graph entities and their relationships.

Return ONLY valid JSON with no markdown formatting:
{
  "nodes": [
    {
      "label": "Entity name",
      "node_type": "one of: person|skill|technology|project|internship|certificate|achievement|university|company|resume|portfolio|course",
      "properties": {}
    }
  ],
  "relationships": [
    {
      "source": "source entity label",
      "source_type": "node_type",
      "target": "target entity label",
      "target_type": "node_type",
      "predicate": "one of: USES|CREATED|LEARNT|CERTIFIED_BY|WORKED_AT|MENTIONS|DEPENDS_ON|RELATED_TO|COMPLETED_BEFORE|LEADS_TO|CONTRIBUTES_TO|VALIDATES|DEVELOPED|REFERENCES",
      "confidence": 0.9
    }
  ]
}

Rules:
- Extract only entities clearly mentioned in the document
- Return meaningful relationships with high confidence
- Do not invent entities not in the document
- Limit to max 15 nodes and 20 relationships
- Return ONLY the JSON object

Document metadata:
`

// ─────────────────────────────────────────────────────────────
// AI relationship extraction
// ─────────────────────────────────────────────────────────────

interface ExtractedRelationship {
  source: string
  source_type: NodeType
  target: string
  target_type: NodeType
  predicate: string
  confidence: number
}

interface ExtractedNode {
  label: string
  node_type: NodeType
  properties: Record<string, unknown>
}

interface RelationshipResult {
  nodes: ExtractedNode[]
  relationships: ExtractedRelationship[]
}

async function extractRelationshipsWithAI(
  documentMetadata: Record<string, unknown>
): Promise<RelationshipResult> {
  if (!GEMINI_API_KEY) return { nodes: [], relationships: [] }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const metaStr = JSON.stringify(documentMetadata, null, 2)
    const result = await model.generateContent(RELATIONSHIP_PROMPT + metaStr)
    const raw = result.response.text().trim()

    // Strip markdown fences
    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    const parsed = JSON.parse(cleaned) as RelationshipResult

    return {
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
      relationships: Array.isArray(parsed.relationships) ? parsed.relationships : [],
    }
  } catch (err) {
    console.warn('[KnowledgeGraph] AI extraction failed:', err)
    return { nodes: [], relationships: [] }
  }
}

// ─────────────────────────────────────────────────────────────
// Build fallback entities from document metadata (no AI needed)
// ─────────────────────────────────────────────────────────────

function buildEntitiesFromMetadata(
  documentType: string,
  metadata: Record<string, unknown>
): RelationshipResult {
  const nodes: ExtractedNode[] = []
  const relationships: ExtractedRelationship[] = []

  const title = (metadata.title as string) || ''
  const org = (metadata.organization as string) || ''
  const skills = (metadata.skills as string[]) || []
  const technologies = (metadata.technologies as string[]) || []

  // Document node
  const docNodeType = (documentType as NodeType) || 'other'
  if (title) {
    nodes.push({ label: title, node_type: docNodeType, properties: { ...metadata } })
  }

  // Organization node
  if (org) {
    const orgType: NodeType = ['internship', 'resume'].includes(documentType) ? 'company' : 'company'
    nodes.push({ label: org, node_type: orgType, properties: {} })
    if (title) {
      relationships.push({
        source: title,
        source_type: docNodeType,
        target: org,
        target_type: orgType,
        predicate: 'WORKED_AT',
        confidence: 0.9,
      })
    }
  }

  // Skill nodes
  for (const skill of skills.slice(0, 10)) {
    nodes.push({ label: skill, node_type: 'skill', properties: { source: documentType } })
    if (title) {
      relationships.push({
        source: title,
        source_type: docNodeType,
        target: skill,
        target_type: 'skill',
        predicate: 'USES',
        confidence: 0.85,
      })
    }
  }

  // Technology nodes
  for (const tech of technologies.slice(0, 10)) {
    nodes.push({ label: tech, node_type: 'technology', properties: {} })
    if (title) {
      relationships.push({
        source: title,
        source_type: docNodeType,
        target: tech,
        target_type: 'technology',
        predicate: 'USES',
        confidence: 0.85,
      })
    }
  }

  // Deduplicate nodes by label
  const seen = new Set<string>()
  const uniqueNodes = nodes.filter((n) => {
    const key = `${n.label.toLowerCase()}:${n.node_type}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return { nodes: uniqueNodes, relationships }
}

// ─────────────────────────────────────────────────────────────
// Main: Build knowledge graph for a processed document
// ─────────────────────────────────────────────────────────────

export async function buildKnowledgeGraphForDocument(
  documentId: string,
  userId: string
): Promise<{ success: boolean; nodesCreated: number; edgesCreated: number; error?: string }> {
  try {
    // Fetch document
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('id, title, category, metadata, tags, ai_summary')
      .eq('id', documentId)
      .single()

    if (fetchError || !doc) {
      return { success: false, nodesCreated: 0, edgesCreated: 0, error: 'Document not found' }
    }

    const docMeta = (doc.metadata as Record<string, unknown>) || {}
    const documentType = (doc.category as string) || 'other'

    // Try AI-powered extraction first, fall back to metadata-based
    let extracted: RelationshipResult

    try {
      const enrichedMeta = {
        ...docMeta,
        title: doc.title,
        document_type: documentType,
        summary: doc.ai_summary,
        tags: doc.tags,
      }
      extracted = await extractRelationshipsWithAI(enrichedMeta)

      // If AI returned nothing, use fallback
      if (!extracted.nodes.length) {
        extracted = buildEntitiesFromMetadata(documentType, { ...docMeta, title: doc.title })
      }
    } catch {
      extracted = buildEntitiesFromMetadata(documentType, { ...docMeta, title: doc.title })
    }

    // Upsert nodes and collect their IDs
    const nodeIdMap = new Map<string, string>() // label:type -> id

    for (const node of extracted.nodes) {
      const { data, error } = await supabase.rpc('upsert_knowledge_node', {
        p_user_id: userId,
        p_label: node.label,
        p_node_type: node.node_type,
        p_document_id: documentId,
        p_properties: node.properties || {},
      })

      if (!error && data) {
        nodeIdMap.set(`${node.label.toLowerCase()}:${node.node_type}`, data as string)
      }
    }

    // Create edges
    let edgesCreated = 0
    for (const rel of extracted.relationships) {
      const sourceId = nodeIdMap.get(`${rel.source.toLowerCase()}:${rel.source_type}`)
      const targetId = nodeIdMap.get(`${rel.target.toLowerCase()}:${rel.target_type}`)

      if (!sourceId || !targetId || sourceId === targetId) continue

      const { error } = await supabase.rpc('upsert_knowledge_edge', {
        p_user_id: userId,
        p_source_id: sourceId,
        p_target_id: targetId,
        p_relationship: rel.predicate,
        p_confidence: rel.confidence || 0.7,
        p_document_id: documentId,
      })

      if (!error) edgesCreated++
    }

    // Trigger metric recomputation
    await supabase.rpc('compute_graph_metrics', { p_user_id: userId })

    return {
      success: true,
      nodesCreated: nodeIdMap.size,
      edgesCreated,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Knowledge graph build failed'
    console.error('[KnowledgeGraph]', msg)
    return { success: false, nodesCreated: 0, edgesCreated: 0, error: msg }
  }
}

// ─────────────────────────────────────────────────────────────
// Fetch full graph data for a user
// ─────────────────────────────────────────────────────────────

export async function fetchGraphData(userId: string): Promise<GraphData> {
  const [nodesResult, edgesResult] = await Promise.all([
    supabase
      .from('knowledge_nodes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('knowledge_edges')
      .select('*')
      .eq('user_id', userId)
      .order('confidence_score', { ascending: false })
      .limit(500),
  ])

  return {
    nodes: (nodesResult.data || []) as GraphNode[],
    edges: (edgesResult.data || []) as GraphEdge[],
  }
}

// ─────────────────────────────────────────────────────────────
// Fetch graph metrics for a user
// ─────────────────────────────────────────────────────────────

export interface GraphMetrics {
  total_nodes: number
  total_edges: number
  avg_relationships: number
  timeline_completeness: number
  document_coverage: number
  overall_density_score: number
  computed_at: string
}

export async function fetchGraphMetrics(userId: string): Promise<GraphMetrics | null> {
  const { data, error } = await supabase
    .from('graph_metrics')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return data as GraphMetrics
}
