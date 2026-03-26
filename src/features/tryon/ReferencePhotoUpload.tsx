'use client'

import { useState, useCallback } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { MAX_UPLOAD_SIZE_MB } from '@/lib/constants'

const ACCEPTED_MIME_TYPES: Record<string, string[]> = {
  'image/jpeg': [],
  'image/png': [],
  'image/webp': [],
}

const MAX_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

type UploadState = 'idle' | 'preview' | 'uploading' | 'done' | 'error'

interface ReferencePhotoUploadProps {
  userId: string
  onUploadComplete: (path: string) => void
}

export function ReferencePhotoUpload({ userId, onUploadComplete }: ReferencePhotoUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [rejectionError, setRejectionError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadedPath, setUploadedPath] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[], rejections: FileRejection[]) => {
      setRejectionError(null)
      setUploadError(null)

      if (rejections.length > 0) {
        const firstError = rejections[0].errors[0]
        if (firstError.code === 'file-too-large') {
          setRejectionError(`Photo must be under ${MAX_UPLOAD_SIZE_MB} MB.`)
        } else if (firstError.code === 'file-invalid-type') {
          setRejectionError('Please select a JPEG, PNG, or WebP photo.')
        } else {
          setRejectionError(firstError.message)
        }
        return
      }

      const file = acceptedFiles[0]
      if (!file) return

      // Revoke previous preview URL to avoid memory leaks
      if (previewUrl) URL.revokeObjectURL(previewUrl)

      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setUploadState('preview')
      setUploadedPath(null)
    },
    [previewUrl]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_MIME_TYPES,
    maxSize: MAX_SIZE_BYTES,
    maxFiles: 1,
    multiple: false,
    disabled: uploadState === 'uploading',
  })

  async function handleUpload() {
    if (!selectedFile) return
    setUploadState('uploading')
    setUploadError(null)

    try {
      const supabase = createClient()
      const uuid = crypto.randomUUID()
      const ext = selectedFile.type === 'image/png' ? 'png' : 'jpg'
      const path = `${userId}/reference/${uuid}.${ext}`

      const { error } = await supabase.storage
        .from('vto-results')
        .upload(path, selectedFile, { upsert: false })

      if (error) throw error

      setUploadedPath(path)
      setUploadState('done')
      onUploadComplete(path)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
      setUploadState('error')
    }
  }

  function handleChangePhoto() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadedPath(null)
    setUploadState('idle')
    setUploadError(null)
    setRejectionError(null)
  }

  // ── Dropzone (idle) ──────────────────────────────────────────────────────────
  if (uploadState === 'idle') {
    return (
      <div className="w-full">
        <motion.div
          animate={isDragActive ? { scale: 1.02 } : { scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          <div
            {...getRootProps()}
            className={[
              'relative flex flex-col items-center justify-center gap-3',
              'w-full rounded-2xl border-2 border-dashed px-6 py-10 cursor-pointer',
              'transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2',
              isDragActive
                ? 'border-brand bg-brand/5'
                : 'border-border bg-surface-raised hover:border-brand/60 hover:bg-brand/5',
            ].join(' ')}
            role="button"
            aria-label="Upload reference photo"
          >
          <input {...getInputProps()} />

          <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center shrink-0">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isDragActive ? 'text-brand' : 'text-muted'}
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {isDragActive ? 'Drop your photo here' : 'Upload a reference photo'}
            </p>
            <p className="text-xs text-muted mt-1">
              JPEG, PNG or WebP · Max {MAX_UPLOAD_SIZE_MB} MB
            </p>
          </div>
          </div>
        </motion.div>

        {rejectionError && (
          <p role="alert" className="mt-2 text-xs text-red-500">
            {rejectionError}
          </p>
        )}
      </div>
    )
  }

  // ── Preview / uploading / done / error ───────────────────────────────────────
  return (
    <div className="w-full flex flex-col gap-4">
      {/* Photo preview */}
      <div className="relative w-full aspect-[3/4] max-w-xs mx-auto rounded-2xl overflow-hidden bg-surface-raised">
        {previewUrl && (
          <Image
            src={previewUrl}
            alt="Reference photo preview"
            fill
            className="object-cover"
            unoptimized
          />
        )}

        {/* Uploading overlay */}
        <AnimatePresence>
          {uploadState === 'uploading' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3"
            >
              <svg
                className="animate-spin h-8 w-8 text-white"
                viewBox="0 0 24 24"
                fill="none"
                aria-label="Uploading"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-white text-sm font-medium">Uploading…</p>
            </motion.div>
          )}

          {uploadState === 'done' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 flex items-center justify-center"
            >
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload error */}
      {uploadError && (
        <p role="alert" className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2 text-center">
          {uploadError}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {uploadState !== 'uploading' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleChangePhoto}
            className="flex-1"
          >
            Change photo
          </Button>
        )}

        {(uploadState === 'preview' || uploadState === 'error') && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleUpload}
            className="flex-1"
          >
            {uploadState === 'error' ? 'Retry upload' : 'Use this photo'}
          </Button>
        )}

        {uploadState === 'done' && uploadedPath && (
          <div className="flex-1 flex items-center justify-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Photo ready
          </div>
        )}
      </div>
    </div>
  )
}
