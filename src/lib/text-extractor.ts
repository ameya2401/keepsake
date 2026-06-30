// ============================================================
// MemoryVerse — Text Extraction Service
// Extracts clean plain text from uploaded documents
// Supports: PDF, DOCX, TXT, MD, Images (via base64 for Gemini)
// ============================================================

import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

// Configure PDF.js worker using CDN (avoids build issues)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface ExtractionResult {
  text: string
  isOcr: boolean
  pageCount?: number
  language?: string
  wordCount: number
  error?: string
}

// ─────────────────────────────────────────────────────────────
// PDF Text Extraction
// ─────────────────────────────────────────────────────────────

async function extractFromPdf(file: File): Promise<ExtractionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const pageCount = pdf.numPages
    const textPages: string[] = []

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item) => {
          if ('str' in item) return item.str
          return ''
        })
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (pageText) textPages.push(pageText)
    }

    const fullText = textPages.join('\n\n').trim()

    // Check if PDF is scanned (minimal extractable text)
    const isScanned = fullText.length < 100 && pageCount > 0

    return {
      text: fullText,
      isOcr: isScanned,
      pageCount,
      wordCount: fullText.split(/\s+/).filter(Boolean).length,
    }
  } catch (error) {
    return {
      text: '',
      isOcr: false,
      wordCount: 0,
      error: `PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

// ─────────────────────────────────────────────────────────────
// DOCX Text Extraction
// ─────────────────────────────────────────────────────────────

async function extractFromDocx(file: File): Promise<ExtractionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    const text = result.value.replace(/\s+/g, ' ').trim()
    return {
      text,
      isOcr: false,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    }
  } catch (error) {
    return {
      text: '',
      isOcr: false,
      wordCount: 0,
      error: `DOCX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Plain Text / Markdown
// ─────────────────────────────────────────────────────────────

async function extractFromText(file: File): Promise<ExtractionResult> {
  try {
    const text = await file.text()
    const cleanText = text.replace(/\s+/g, ' ').trim()
    return {
      text: cleanText,
      isOcr: false,
      wordCount: cleanText.split(/\s+/).filter(Boolean).length,
    }
  } catch (error) {
    return {
      text: '',
      isOcr: false,
      wordCount: 0,
      error: `Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Image → base64 (for Gemini Vision)
// ─────────────────────────────────────────────────────────────

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove "data:image/png;base64," prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export function isPdfFile(mimeType: string): boolean {
  return mimeType === 'application/pdf'
}

export function isDocxFile(mimeType: string): boolean {
  return (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  )
}

export function isTextFile(mimeType: string): boolean {
  return mimeType === 'text/plain' || mimeType === 'text/markdown'
}

// ─────────────────────────────────────────────────────────────
// Main Extraction Router
// ─────────────────────────────────────────────────────────────

export async function extractText(file: File): Promise<ExtractionResult> {
  const mimeType = file.type

  if (isPdfFile(mimeType)) {
    return extractFromPdf(file)
  }

  if (isDocxFile(mimeType)) {
    return extractFromDocx(file)
  }

  if (isTextFile(mimeType)) {
    return extractFromText(file)
  }

  if (isImageFile(mimeType)) {
    // Images are handled via Gemini Vision — return empty text for now
    return {
      text: '',
      isOcr: true,
      wordCount: 0,
    }
  }

  // PPTX, ZIP, etc. — not yet supported
  return {
    text: '',
    isOcr: false,
    wordCount: 0,
    error: `Unsupported file type: ${mimeType}`,
  }
}
