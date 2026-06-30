// ============================================================
// MemoryVerse — Application Constants
// ============================================================

export const APP_NAME = 'MemoryVerse'
export const APP_DESCRIPTION = 'AI-powered Memory Operating System'
export const APP_VERSION = '0.1.0'

// ─────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  AUTH_CALLBACK: '/auth/callback',
  DASHBOARD: '/dashboard',
  UPLOAD: '/upload',
  MEMORIES: '/memories',
  MEMORY: '/memories/:id',
  TIMELINE: '/timeline',
  KNOWLEDGE_GRAPH: '/knowledge-graph',
  SEARCH: '/search',
  ASSISTANT: '/assistant',
  ANALYTICS: '/analytics',
  RECOMMENDATIONS: '/recommendations',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  NOT_FOUND: '*',
} as const

// ─────────────────────────────────────────────────────────────
// Navigation items
// ─────────────────────────────────────────────────────────────

import {
  LayoutDashboard,
  Upload,
  BookOpen,
  GitBranch,
  Search,
  MessageSquare,
  BarChart3,
  Lightbulb,
  Settings,
  User,
  Clock,
  Cpu,
} from 'lucide-react'

export const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Your memory overview',
  },
  {
    label: 'Upload',
    href: '/upload',
    icon: Upload,
    description: 'Add new memories',
  },
  {
    label: 'Processing',
    href: '/processing',
    icon: Cpu,
    description: 'AI processing jobs',
  },
  {
    label: 'Memories',
    href: '/memories',
    icon: BookOpen,
    description: 'Browse all documents',
  },
  {
    label: 'Timeline',
    href: '/timeline',
    icon: Clock,
    description: 'Your journey over time',
  },
  {
    label: 'Knowledge Graph',
    href: '/knowledge-graph',
    icon: GitBranch,
    description: 'Explore connections',
  },
  {
    label: 'Search',
    href: '/search',
    icon: Search,
    description: 'Find anything',
  },
  {
    label: 'AI Assistant',
    href: '/assistant',
    icon: MessageSquare,
    description: 'Chat with your memories',
    badge: 'Soon' as const,
  },
  {
    label: 'Insights',
    href: '/recommendations',
    icon: Lightbulb,
    description: 'AI recommendations',
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Your growth metrics',
  },
] as const

export const BOTTOM_NAV_ITEMS = [
  {
    label: 'Profile',
    href: '/profile',
    icon: User,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
] as const

// ─────────────────────────────────────────────────────────────
// Supabase Storage Buckets
// ─────────────────────────────────────────────────────────────

export const STORAGE_BUCKETS = {
  DOCUMENTS: 'documents',
  PROFILE_IMAGES: 'profile-images',
  GENERATED_ASSETS: 'generated-assets',
  FUTURE_EXPORTS: 'future-exports',
} as const

// ─────────────────────────────────────────────────────────────
// Document categories display config
// ─────────────────────────────────────────────────────────────

export const DOCUMENT_CATEGORIES = [
  { value: 'resume', label: 'Resume', emoji: '📄' },
  { value: 'certificate', label: 'Certificate', emoji: '🏆' },
  { value: 'internship', label: 'Internship', emoji: '💼' },
  { value: 'project', label: 'Project', emoji: '🚀' },
  { value: 'research', label: 'Research', emoji: '🔬' },
  { value: 'academic_transcript', label: 'Academic Transcript', emoji: '🎓' },
  { value: 'achievement', label: 'Achievement', emoji: '⭐' },
  { value: 'portfolio', label: 'Portfolio', emoji: '🎨' },
  { value: 'recommendation_letter', label: 'Recommendation Letter', emoji: '✉️' },
  { value: 'cover_letter', label: 'Cover Letter', emoji: '📝' },
  { value: 'course_completion', label: 'Course Completion', emoji: '📚' },
  { value: 'workshop', label: 'Workshop', emoji: '🛠️' },
  { value: 'hackathon', label: 'Hackathon', emoji: '⚡' },
  { value: 'volunteer_work', label: 'Volunteer Work', emoji: '🤝' },
  { value: 'other', label: 'Other', emoji: '📁' },
] as const

// ─────────────────────────────────────────────────────────────
// Query keys for TanStack Query
// ─────────────────────────────────────────────────────────────

export const QUERY_KEYS = {
  PROFILE: ['profile'] as const,
  DOCUMENTS: ['documents'] as const,
  DOCUMENT: (id: string) => ['documents', id] as const,
  SKILLS: ['skills'] as const,
  TIMELINE: ['timeline'] as const,
  KNOWLEDGE_GRAPH: ['knowledge-graph'] as const,
  RECOMMENDATIONS: ['recommendations'] as const,
  ANALYTICS: ['analytics'] as const,
  DASHBOARD_STATS: ['dashboard-stats'] as const,
  SEARCH: (query: string) => ['search', query] as const,
  AI_JOBS: ['ai-jobs'] as const,
} as const

// ─────────────────────────────────────────────────────────────
// Processing status display
// ─────────────────────────────────────────────────────────────

export const PROCESSING_STATUS_CONFIG = {
  uploaded: {
    label: 'Uploaded',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    description: 'File uploaded successfully',
  },
  queued: {
    label: 'Queued',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    description: 'Waiting for AI processing',
  },
  processing: {
    label: 'Processing',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    description: 'AI is analyzing your document',
  },
  completed: {
    label: 'Complete',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    description: 'Memory created successfully',
  },
  failed: {
    label: 'Failed',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    description: 'Processing failed — click to retry',
  },
} as const
