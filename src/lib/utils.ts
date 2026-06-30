import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ─────────────────────────────────────────────────────────────
// Tailwind class merger
// ─────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─────────────────────────────────────────────────────────────
// Date utilities
// ─────────────────────────────────────────────────────────────

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Unknown date'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeAgo(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateString)
}

// ─────────────────────────────────────────────────────────────
// File utilities
// ─────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

export function getFileTypeLabel(mimeType: string): string {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/msword': 'DOC',
    'text/plain': 'TXT',
    'text/markdown': 'Markdown',
    'image/png': 'PNG',
    'image/jpeg': 'JPEG',
    'image/jpg': 'JPG',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'application/zip': 'ZIP',
  }
  return typeMap[mimeType] ?? mimeType.split('/').pop()?.toUpperCase() ?? 'File'
}

export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/zip': ['.zip'],
}

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

// ─────────────────────────────────────────────────────────────
// String utilities
// ─────────────────────────────────────────────────────────────

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '…'
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function formatCategoryLabel(category: string): string {
  return category
    .split('_')
    .map(word => capitalize(word))
    .join(' ')
}

// ─────────────────────────────────────────────────────────────
// Color utilities for categories / node types
// ─────────────────────────────────────────────────────────────

export const CATEGORY_COLORS: Record<string, string> = {
  resume: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  certificate: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  internship: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  project: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  research: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  academic_transcript: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  achievement: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  portfolio: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  recommendation_letter: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  cover_letter: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  course_completion: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  workshop: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400',
  hackathon: 'bg-red-500/10 text-red-600 dark:text-red-400',
  volunteer_work: 'bg-lime-500/10 text-lime-600 dark:text-lime-400',
  other: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
}

export const NODE_TYPE_COLORS: Record<string, string> = {
  skill: '#8b5cf6',
  technology: '#6366f1',
  project: '#3b82f6',
  internship: '#10b981',
  certificate: '#06b6d4',
  achievement: '#f59e0b',
  person: '#ec4899',
  organization: '#0ea5e9',
  university: '#8b5cf6',
  company: '#0ea5e9',
  resume: '#f97316',
  portfolio: '#14b8a6',
  course: '#a855f7',
}

// ─────────────────────────────────────────────────────────────
// Validation utilities
// ─────────────────────────────────────────────────────────────

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ─────────────────────────────────────────────────────────────
// Error handling
// ─────────────────────────────────────────────────────────────

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unexpected error occurred'
}

// ─────────────────────────────────────────────────────────────
// Storage path utilities
// ─────────────────────────────────────────────────────────────

export function getDocumentStoragePath(userId: string, documentId: string, filename: string): string {
  return `${userId}/${documentId}/${filename}`
}

export function getProfileImagePath(userId: string, filename: string): string {
  return `${userId}/${filename}`
}
