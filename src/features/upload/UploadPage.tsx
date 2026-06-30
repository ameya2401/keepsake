import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, Image, File, X, CheckCircle2,
  AlertCircle, CloudUpload, Info, Zap, Brain, Cpu, Tag
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button, Card, CardContent, Progress, Badge } from '@/components/ui'
import { formatFileSize, ACCEPTED_FILE_TYPES, MAX_FILE_SIZE, getFileTypeLabel, cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import { STORAGE_BUCKETS } from '@/constants/app'
import { v4 as uuidv4 } from 'uuid'
import { runAIPipeline, createProcessingJob, type PipelineProgress, type PipelineStep } from '@/lib/ai-pipeline'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface UploadFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error'
  uploadProgress: number
  aiProgress: PipelineProgress | null
  error?: string
  documentId?: string
}

// ─────────────────────────────────────────────────────────────
// File type icon
// ─────────────────────────────────────────────────────────────


function FileTypeIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith('image/')) return <Image className={className} />
  if (mimeType === 'application/pdf') return <FileText className={className} />
  return <File className={className} />
}

// ─────────────────────────────────────────────────────────────
// AI Progress Display
// ─────────────────────────────────────────────────────────────

function AIProgressBar({ progress }: { progress: PipelineProgress }) {
  const stepIcons: Partial<Record<PipelineStep, React.ReactNode>> = {
    extracting_text: <FileText className="w-3 h-3" />,
    analyzing: <Brain className="w-3 h-3" />,
    classifying: <Cpu className="w-3 h-3" />,
    extracting_entities: <Zap className="w-3 h-3" />,
    generating_tags: <Tag className="w-3 h-3" />,
  }

  const isComplete = progress.step === 'completed'
  const isFailed = progress.step === 'failed'

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex items-center gap-1.5">
        {stepIcons[progress.step] && (
          <span className={cn(
            'transition-colors',
            isComplete ? 'text-emerald-500' : isFailed ? 'text-red-500' : 'text-violet-500'
          )}>
            {stepIcons[progress.step]}
          </span>
        )}
        <p className={cn(
          'text-xs transition-colors',
          isComplete ? 'text-emerald-500' : isFailed ? 'text-red-500' : 'text-violet-400'
        )}>
          {progress.message}
        </p>
      </div>
      {!isComplete && !isFailed && (
        <div className="relative h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress.percent}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Upload file card
// ─────────────────────────────────────────────────────────────

function UploadFileCard({ uploadFile, onRemove }: { uploadFile: UploadFile; onRemove: () => void }) {
  const { file, status, uploadProgress, aiProgress, error } = uploadFile

  const isComplete = status === 'success'
  const isFailed = status === 'error'
  const isProcessing = status === 'processing'
  const isUploading = status === 'uploading'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-start gap-4 p-4 rounded-xl border transition-colors',
        isComplete ? 'bg-emerald-500/5 border-emerald-500/20' :
        isFailed ? 'bg-red-500/5 border-red-500/20' :
        isProcessing ? 'bg-violet-500/5 border-violet-500/20' :
        'bg-card'
      )}
    >
      {/* Icon */}
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
        isComplete ? 'bg-emerald-500/10' :
        isFailed ? 'bg-destructive/10' :
        isProcessing ? 'bg-violet-500/10' :
        'bg-violet-500/10'
      )}>
        {isComplete ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : isFailed ? (
          <AlertCircle className="w-5 h-5 text-destructive" />
        ) : isProcessing ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Brain className="w-5 h-5 text-violet-500" />
          </motion.div>
        ) : (
          <FileTypeIcon mimeType={file.type} className="w-5 h-5 text-violet-500" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <Badge variant="secondary" className="text-[10px] shrink-0">
            {getFileTypeLabel(file.type)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-1">
            <p className="text-xs text-blue-400">Uploading to cloud storage...</p>
            <Progress value={uploadProgress} className="h-1" />
          </div>
        )}

        {/* AI Processing Progress */}
        {isProcessing && aiProgress && (
          <AIProgressBar progress={aiProgress} />
        )}

        {isFailed && error && (
          <p className="text-xs text-destructive mt-1">{error}</p>
        )}

        {isComplete && (
          <p className="text-xs text-emerald-500">
            ✨ Memory created — AI extraction complete
          </p>
        )}
      </div>

      {/* Remove button */}
      {status !== 'uploading' && status !== 'processing' && (
        <button
          onClick={onRemove}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Remove file"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Gemini API Key Check
// ─────────────────────────────────────────────────────────────

function ApiKeyMissing() {
  const hasKey = !!import.meta.env.VITE_GEMINI_API_KEY

  if (hasKey) return null

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <div className="text-xs space-y-1">
          <p className="font-medium text-amber-500">Gemini API Key Missing</p>
          <p className="text-muted-foreground">
            Add <code className="bg-muted px-1 py-0.5 rounded text-amber-400">VITE_GEMINI_API_KEY</code> to your <code className="bg-muted px-1 py-0.5 rounded">.env.local</code> file to enable AI processing.
            Files will still be uploaded and stored safely.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────
// Upload Page
// ─────────────────────────────────────────────────────────────

export default function UploadPage() {
  const { user } = useAuth()
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
      id: uuidv4(),
      file,
      status: 'pending',
      uploadProgress: 0,
      aiProgress: null,
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  })

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const updateFile = (id: string, updates: Partial<UploadFile>) => {
    setFiles((prev) => prev.map((f) => f.id === id ? { ...f, ...updates } : f))
  }

  const uploadAll = async () => {
    if (!user) return
    const pendingFiles = files.filter((f) => f.status === 'pending')
    if (pendingFiles.length === 0) return

    setIsUploading(true)

    for (const uploadFile of pendingFiles) {
      const docId = uuidv4()
      const ext = uploadFile.file.name.split('.').pop()
      const storagePath = `${user.id}/${docId}/original.${ext}`

      // ── 1. Upload to Storage ──────────────────────────────
      updateFile(uploadFile.id, { status: 'uploading', uploadProgress: 10 })

      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .upload(storagePath, uploadFile.file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (storageError) {
        updateFile(uploadFile.id, {
          status: 'error',
          error: storageError.message,
        })
        continue
      }

      updateFile(uploadFile.id, { uploadProgress: 60 })

      // ── 2. Save document record ───────────────────────────
      const { error: dbError } = await supabase.from('documents').insert({
        id: docId,
        user_id: user.id,
        title: uploadFile.file.name.replace(/\.[^.]+$/, ''),
        original_filename: uploadFile.file.name,
        file_path: storagePath,
        file_type: uploadFile.file.type,
        file_size: uploadFile.file.size,
        processing_status: 'uploaded',
        category: null,
        tags: [],
      })

      if (dbError) {
        await supabase.storage.from(STORAGE_BUCKETS.DOCUMENTS).remove([storagePath])
        updateFile(uploadFile.id, {
          status: 'error',
          error: dbError.message,
        })
        continue
      }

      updateFile(uploadFile.id, {
        uploadProgress: 100,
        documentId: docId,
        status: 'processing',
        aiProgress: {
          step: 'queued',
          percent: 0,
          message: 'Queued for AI processing...',
        },
      })

      // ── 3. Create AI Job record ───────────────────────────
      const jobId = await createProcessingJob(docId, user.id)

      if (!jobId) {
        updateFile(uploadFile.id, {
          status: 'error',
          error: 'Could not create processing job',
        })
        continue
      }

      // ── 4. Run AI Pipeline (async, non-blocking) ──────────
      runAIPipeline(
        docId,
        user.id,
        uploadFile.file,
        jobId,
        (progress) => {
          updateFile(uploadFile.id, { aiProgress: progress })
          if (progress.step === 'completed') {
            updateFile(uploadFile.id, { status: 'success' })
          } else if (progress.step === 'failed') {
            updateFile(uploadFile.id, {
              status: 'error',
              error: progress.error || 'AI processing failed',
            })
          }
        }
      )
    }

    setIsUploading(false)
  }

  const pendingCount = files.filter((f) => f.status === 'pending').length
  const successCount = files.filter((f) => f.status === 'success').length
  const processingCount = files.filter((f) => f.status === 'processing').length

  return (
    <AppShell
      title="Upload Memories"
      breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Upload' }]}
    >
      <div className="p-6 max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Upload Memories</h1>
          <p className="text-muted-foreground text-sm">
            Upload documents and MemoryVerse will extract knowledge, skills, and create intelligent Memory Objects automatically.
          </p>
        </div>

        {/* API Key warning */}
        <ApiKeyMissing />

        {/* Accepted formats info */}
        <Card className="border-dashed">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Supported formats</p>
              <p>PDF, DOCX, DOC, TXT, Markdown, PNG, JPEG, PPTX — up to 50MB each</p>
              <p className="text-violet-500">
                ✨ After upload, AI will automatically extract skills, technologies, timeline events, and create a rich Memory Object
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            'relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isDragActive && !isDragReject
              ? 'border-primary bg-primary/5'
              : isDragReject
              ? 'border-destructive bg-destructive/5'
              : 'border-border hover:border-primary/50 hover:bg-accent/30'
          )}
        >
          <input {...getInputProps()} />

          <motion.div
            animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-4"
          >
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
              isDragActive ? 'bg-primary/20' : 'bg-muted'
            )}>
              <CloudUpload className={cn(
                'w-8 h-8 transition-colors',
                isDragActive ? 'text-primary' : 'text-muted-foreground'
              )} />
            </div>

            {isDragActive ? (
              <div>
                <p className="font-semibold text-primary">Drop your files here</p>
                <p className="text-sm text-muted-foreground mt-1">Release to add them</p>
              </div>
            ) : (
              <div>
                <p className="font-semibold">
                  Drag & drop files here, or <span className="text-primary">browse</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Select multiple files to upload at once
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* File list */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">
                  {files.length} file{files.length !== 1 ? 's' : ''}
                  {successCount > 0 && (
                    <span className="ml-2 text-emerald-500">{successCount} complete</span>
                  )}
                  {processingCount > 0 && (
                    <span className="ml-2 text-violet-400">{processingCount} processing</span>
                  )}
                </h3>
                <button
                  onClick={() => setFiles([])}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-2">
                <AnimatePresence>
                  {files.map((uploadFile) => (
                    <UploadFileCard
                      key={uploadFile.id}
                      uploadFile={uploadFile}
                      onRemove={() => removeFile(uploadFile.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* Upload button */}
              {pendingCount > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 pt-2"
                >
                  <Button
                    onClick={uploadAll}
                    isLoading={isUploading}
                    className="gap-2"
                    id="btn-upload-all"
                  >
                    <Upload className="w-4 h-4" />
                    Upload {pendingCount} file{pendingCount !== 1 ? 's' : ''}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    AI processing starts automatically after upload
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pipeline explanation */}
        <Card className="bg-gradient-to-r from-violet-500/5 to-indigo-500/5 border-violet-500/20">
          <CardContent className="p-5">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-violet-500" />
              AI Processing Pipeline
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { step: '1', title: 'Text Extraction', desc: 'PDF, DOCX, images parsed automatically', icon: FileText },
                { step: '2', title: 'Smart Classification', desc: 'Certificate, Resume, Project... auto-detected', icon: Cpu },
                { step: '3', title: 'Entity Extraction', desc: 'Skills, technologies, organizations, dates', icon: Zap },
                { step: '4', title: 'Memory Creation', desc: 'Tags, timeline, summary stored in your vault', icon: Brain },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-xs font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </AppShell>
  )
}
