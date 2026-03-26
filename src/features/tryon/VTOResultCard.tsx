'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { useDeleteVTOResult } from '@/hooks/useVTO'
import { useGarments } from '@/hooks/useGarments'
import type { VTOResult } from '@/lib/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const supabase = createClient()

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function useSignedUrl(path: string | null) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!path) return
    supabase.storage
      .from('vto-results')
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setUrl(data.signedUrl)
      })
  }, [path])

  return url
}

// ---------------------------------------------------------------------------
// VTOResultCard
// ---------------------------------------------------------------------------

interface VTOResultCardProps {
  result: VTOResult
  /** Garment name lookup — pass the garment name if already resolved, or leave
   *  undefined to let the card fetch it via useGarments */
  garmentName?: string
  garmentThumbPath?: string
}

export function VTOResultCard({ result, garmentName, garmentThumbPath }: VTOResultCardProps) {
  const resultUrl = useSignedUrl(result.result_path)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const deleteMutation = useDeleteVTOResult()

  // Garment name / thumb via hook when not provided by parent
  const { data } = useGarments({ limit: 200 })
  const garments = data?.garments ?? []
  const garment = garments.find((g) => g.id === result.garment_id)
  const resolvedName = garmentName ?? garment?.name ?? 'Unknown garment'
  const resolvedThumbPath = garmentThumbPath ?? garment?.thumb_path ?? null

  const { data: { publicUrl: thumbPublicUrl } } = resolvedThumbPath
    ? supabase.storage.from('garments').getPublicUrl(resolvedThumbPath)
    : { data: { publicUrl: '' } }
  const thumbUrl = thumbPublicUrl
    ? `${thumbPublicUrl}?width=80&height=80&resize=cover`
    : null

  async function handleDelete() {
    await deleteMutation.mutateAsync(result.id)
    setConfirmDeleteOpen(false)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className="bg-surface rounded-2xl border border-border overflow-hidden"
      >
        {/* Result image */}
        <button
          onClick={() => setLightboxOpen(true)}
          className="relative w-full aspect-[3/4] block bg-surface-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
          aria-label="View full size try-on"
        >
          {resultUrl ? (
            <Image
              src={resultUrl}
              alt={`Try-on result for ${resolvedName}`}
              fill
              sizes="(max-width: 640px) 100vw, 480px"
              className="object-contain"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 animate-pulse bg-surface-raised" />
          )}

          {/* Tap to expand hint */}
          <div className="absolute bottom-2 right-2 bg-black/40 rounded-lg px-2 py-1">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </div>
        </button>

        {/* Bottom overlay / info */}
        <div className="px-3 py-3 flex items-center gap-3">
          {/* Garment thumbnail */}
          {thumbUrl && (
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-surface-raised shrink-0">
              <Image
                src={thumbUrl}
                alt={resolvedName}
                fill
                sizes="40px"
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Name + date */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{resolvedName}</p>
            <p className="text-xs text-muted">{formatDate(result.created_at)}</p>
          </div>

          {/* Delete button */}
          <button
            onClick={() => setConfirmDeleteOpen(true)}
            aria-label="Delete try-on result"
            className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </motion.div>

      {/* Lightbox modal */}
      <Modal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={resolvedName}
        className="max-w-lg"
      >
        <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-surface-raised -mx-5 w-[calc(100%+2.5rem)]">
          {resultUrl && (
            <Image
              src={resultUrl}
              alt={`Try-on result for ${resolvedName}`}
              fill
              sizes="480px"
              className="object-contain"
              unoptimized
            />
          )}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted">{formatDate(result.created_at)}</p>
          <Button
            variant="danger"
            size="sm"
            onClick={() => { setLightboxOpen(false); setConfirmDeleteOpen(true) }}
          >
            Delete
          </Button>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Delete try-on?"
      >
        <div className="flex flex-col gap-5">
          <p className="text-sm text-foreground/80">
            This will permanently delete the try-on result and your reference photo. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setConfirmDeleteOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={deleteMutation.isPending}
              onClick={handleDelete}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
