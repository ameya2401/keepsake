// ============================================================
// MemoryVerse — Core Database Types
// Mirrors the Supabase PostgreSQL schema exactly
// ============================================================

export type UUID = string

// ─────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────

export type DocumentCategory =
  | 'resume'
  | 'certificate'
  | 'internship'
  | 'project'
  | 'research'
  | 'academic_transcript'
  | 'achievement'
  | 'portfolio'
  | 'recommendation_letter'
  | 'cover_letter'
  | 'course_completion'
  | 'workshop'
  | 'hackathon'
  | 'volunteer_work'
  | 'other'

export type ProcessingStatus = 'uploaded' | 'queued' | 'processing' | 'completed' | 'failed'

export type NodeType =
  | 'person'
  | 'skill'
  | 'technology'
  | 'project'
  | 'internship'
  | 'certificate'
  | 'achievement'
  | 'university'
  | 'company'
  | 'resume'
  | 'portfolio'
  | 'course'

export type SkillType = 'technical' | 'soft' | 'domain'

export type ThemePreference = 'light' | 'dark' | 'system'

export type NotificationStatus = 'unread' | 'read' | 'archived'

// ─────────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────────

export interface Profile {
  id: UUID
  full_name: string | null
  email: string
  avatar_url: string | null
  bio: string | null
  timezone: string
  theme_preference: ThemePreference
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────────────────────
// Documents
// ─────────────────────────────────────────────────────────────

export interface Document {
  id: UUID
  user_id: UUID
  title: string
  original_filename: string
  file_path: string
  file_type: string
  file_size: number
  category: DocumentCategory | null
  processing_status: ProcessingStatus
  extracted_text: string | null
  ai_summary: string | null
  ai_narrative: string | null
  confidence_score: number | null
  metadata: DocumentMetadata | null
  tags: string[]
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface DocumentMetadata {
  title?: string
  document_type?: string
  issuer?: string
  organization?: string
  location?: string
  issue_date?: string
  completion_date?: string
  start_date?: string
  end_date?: string
  skills?: string[]
  technologies?: string[]
  projects?: string[]
  achievements?: string[]
  education?: string[]
  keywords?: string[]
  confidence?: number
}

// ─────────────────────────────────────────────────────────────
// Skills
// ─────────────────────────────────────────────────────────────

export interface Skill {
  id: UUID
  user_id: UUID
  name: string
  skill_type: SkillType
  proficiency_level: number | null // 1–10
  first_seen_at: string | null
  document_count: number
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────────────────────
// Projects
// ─────────────────────────────────────────────────────────────

export interface Project {
  id: UUID
  user_id: UUID
  document_id: UUID | null
  name: string
  description: string | null
  technologies: string[]
  github_url: string | null
  demo_url: string | null
  start_date: string | null
  end_date: string | null
  is_featured: boolean
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────────────────────
// Internships
// ─────────────────────────────────────────────────────────────

export interface Internship {
  id: UUID
  user_id: UUID
  document_id: UUID | null
  company: string
  role: string
  description: string | null
  technologies: string[]
  start_date: string | null
  end_date: string | null
  is_current: boolean
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────────────────────
// Certifications
// ─────────────────────────────────────────────────────────────

export interface Certification {
  id: UUID
  user_id: UUID
  document_id: UUID | null
  name: string
  issuer: string
  issue_date: string | null
  expiry_date: string | null
  credential_id: string | null
  credential_url: string | null
  skills: string[]
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────────────────────
// Achievements
// ─────────────────────────────────────────────────────────────

export interface Achievement {
  id: UUID
  user_id: UUID
  document_id: UUID | null
  title: string
  description: string | null
  organization: string | null
  achievement_date: string | null
  category: string | null
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────────────────────
// Timeline
// ─────────────────────────────────────────────────────────────

export interface TimelineEvent {
  id: UUID
  user_id: UUID
  document_id: UUID | null
  title: string
  description: string | null
  event_date: string
  event_type: DocumentCategory | null
  organization: string | null
  is_milestone: boolean
  confidence_score: number | null
  source_type: 'ai_generated' | 'manual' | 'inferred'
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────────────────────
// Knowledge Graph
// ─────────────────────────────────────────────────────────────

export interface KnowledgeNode {
  id: UUID
  user_id: UUID
  label: string
  node_type: NodeType
  properties: Record<string, unknown>
  document_ids: UUID[]
  created_at: string
  updated_at: string
}

export interface KnowledgeEdge {
  id: UUID
  user_id: UUID
  source_node_id: UUID
  target_node_id: UUID
  relationship: string // e.g. USES, CREATED, CERTIFIED_BY
  confidence_score: number | null
  document_ids: UUID[]
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────────────────────
// Embeddings
// ─────────────────────────────────────────────────────────────

export interface Embedding {
  id: UUID
  document_id: UUID
  user_id: UUID
  embedding_type: 'full_text' | 'summary' | 'metadata' | 'skills'
  model_name: string
  dimension: number
  created_at: string
}

// ─────────────────────────────────────────────────────────────
// AI Jobs
// ─────────────────────────────────────────────────────────────

export interface AIJob {
  id: UUID
  document_id: UUID
  user_id: UUID
  job_type: 'text_extraction' | 'metadata_extraction' | 'classification' | 'embedding' | 'relationship_discovery'
  status: ProcessingStatus
  progress: number // 0–100
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  retry_count: number
  created_at: string
}

// ─────────────────────────────────────────────────────────────
// Recommendations
// ─────────────────────────────────────────────────────────────

export interface Recommendation {
  id: UUID
  user_id: UUID
  document_id: UUID | null
  type: 'resume_update' | 'portfolio_suggestion' | 'career_insight' | 'missing_metadata' | 'skill_gap' | 'relationship_suggestion'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  is_dismissed: boolean
  created_at: string
}

// ─────────────────────────────────────────────────────────────
// Activity Logs
// ─────────────────────────────────────────────────────────────

export interface ActivityLog {
  id: UUID
  user_id: UUID
  action: string
  entity_type: string
  entity_id: UUID | null
  metadata: Record<string, unknown>
  created_at: string
}

// ─────────────────────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────────────────────

export interface SearchHistory {
  id: UUID
  user_id: UUID
  query: string
  result_count: number
  search_type: 'semantic' | 'keyword' | 'filter'
  created_at: string
}

// ─────────────────────────────────────────────────────────────
// User Settings
// ─────────────────────────────────────────────────────────────

export interface UserSettings {
  id: UUID
  user_id: UUID
  theme: ThemePreference
  notification_email: boolean
  notification_processing: boolean
  notification_recommendations: boolean
  auto_categorize: boolean
  auto_timeline: boolean
  auto_relationships: boolean
  knowledge_graph_visible: boolean
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────────────────────
// Dashboard Stats
// ─────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_memories: number
  total_projects: number
  total_certificates: number
  total_internships: number
  total_achievements: number
  total_skills: number
  total_connections: number
  total_timeline_events: number
  memory_health_score: number
  knowledge_density: number
  recent_uploads: Document[]
  processing_queue: AIJob[]
}
