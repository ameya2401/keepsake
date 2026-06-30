import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, Image, File, X, CheckCircle2,
  AlertCircle, CloudUpload, Info
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button, Card, CardContent, Progress, Badge } from '@/components/ui'
import { formatFileSize, ACCEPTED_FILE_TYPES, MAX_FILE_SIZE, getFileTypeLabel, cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import { STORAGE_BUCKETS } from '@/constants/app'
import { v4 as uuidv4 } from 'uuid'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface UploadFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
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
// Upload file card
// ─────────────────────────────────────────────────────────────

function UploadFileCard({ uploadFile, onRemove }: { uploadFile: UploadFile; onRemove: () => void }) {
  const { file, status, progress, error } = uploadFile

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-4 p-4 rounded-xl border bg-card"
    >
      {/* Icon */}
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
        status === 'success' ? 'bg-emerald-500/10' :
        status === 'error' ? 'bg-destructive/10' :
        'bg-violet-500/10'
      )}>
        {status === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : status === 'error' ? (
          <AlertCircle className="w-5 h-5 text-destructive" />
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

        {/* Progress */}
        {status === 'uploading' && (
          <Progress value={progress} className="h-1" />
        )}

        {status === 'error' && error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        {status === 'success' && (
          <p className="text-xs text-emerald-500">Uploaded successfully — AI processing queued</p>
        )}
      </div>

      {/* Remove button */}
      {status !== 'uploading' && (
        <button
          onClick={onRemove}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Remove file"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Upload Page
// ─────────────────────────────────────────────────────────────

export default function UploadPage() {
  const { user } = useAuth()
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: unknown[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
      id: uuidv4(),
      file,
      status: 'pending',
      progress: 0,
    }))
    setFiles((prev) => [...prev, ...newFiles])

    if (rejectedFiles.length > 0) {
      // TODO: show rejection toast
    }
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

  const uploadAll = async () => {
    if (!user) return
    const pendingFiles = files.filter((f) => f.status === 'pending')
    if (pendingFiles.length === 0) return

    setIsUploading(true)

    for (const uploadFile of pendingFiles) {
      const docId = uuidv4()
      const ext = uploadFile.file.name.split('.').pop()
      const storagePath = `${user.id}/${docId}/original.${ext}`

      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) => f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 10 } : f)
      )

      // Upload to Supabase Storage
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .upload(storagePath, uploadFile.file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (storageError) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: 'error', error: storageError.message }
              : f
          )
        )
        continue
      }

      // Progress update
      setFiles((prev) =>
        prev.map((f) => f.id === uploadFile.id ? { ...f, progress: 60 } : f)
      )

      // Save document metadata to database
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
        // Clean up the uploaded file
        await supabase.storage.from(STORAGE_BUCKETS.DOCUMENTS).remove([storagePath])
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: 'error', error: dbError.message }
              : f
          )
        )
        continue
      }

      // Success
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: 'success', progress: 100, documentId: docId }
            : f
        )
      )
    }

    setIsUploading(false)
  }

  const pendingCount = files.filter((f) => f.status === 'pending').length
  const successCount = files.filter((f) => f.status === 'success').length

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
            Upload documents and MemoryVerse will extract knowledge, skills, and build your knowledge graph automatically.
          </p>
        </div>

        {/* Accepted formats info */}
        <Card className="border-dashed">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Supported formats</p>
              <p>PDF, DOCX, DOC, TXT, Markdown, PNG, JPEG, PPTX, ZIP — up to 50MB each</p>
              <p className="text-violet-500">
                ✨ After upload, AI will automatically extract skills, technologies, and timeline events
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
                  {files.length} file{files.length !== 1 ? 's' : ''} selected
                  {successCount > 0 && (
                    <span className="ml-2 text-emerald-500">{successCount} uploaded</span>
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
                    Files will be processed by AI after upload
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info card */}
        <Card className="bg-gradient-to-r from-violet-500/5 to-indigo-500/5 border-violet-500/20">
          <CardContent className="p-5">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-violet-500" />
              What happens after upload?
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { step: '1', title: 'Text Extraction', desc: 'AI reads your document content' },
                { step: '2', title: 'Smart Classification', desc: 'Automatically categorized' },
                { step: '3', title: 'Entity Extraction', desc: 'Skills, dates, orgs identified' },
                { step: '4', title: 'Knowledge Graph', desc: 'Connected to your other memories' },
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
