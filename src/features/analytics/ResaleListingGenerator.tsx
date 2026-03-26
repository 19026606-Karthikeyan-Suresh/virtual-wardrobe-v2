'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { useResaleListing } from '@/hooks/useAnalytics'
import { createClient } from '@/lib/supabase/client'
import type { Garment } from '@/lib/types'

const supabase = createClient()

interface Props {
  garment: Garment | null
  isOpen: boolean
  onClose: () => void
  onArchive: (id: string) => void
}

export function ResaleListingGenerator({ garment, isOpen, onClose, onArchive }: Props) {
  const { mutate, isPending, isError, reset } = useResaleListing()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [copied, setCopied] = useState<'title' | 'description' | null>(null)

  // Auto-trigger mutation when modal opens or garment changes
  useEffect(() => {
    if (!isOpen || !garment) return
    reset()
    setTitle('')
    setDescription('')
    mutate(
      { garment_id: garment.id },
      {
        onSuccess: (result) => {
          setTitle(result.title)
          setDescription(result.description)
        },
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, garment?.id])

  function handleRegenerate() {
    if (!garment) return
    setTitle('')
    setDescription('')
    mutate(
      { garment_id: garment.id },
      {
        onSuccess: (result) => {
          setTitle(result.title)
          setDescription(result.description)
        },
      },
    )
  }

  async function handleCopy(field: 'title' | 'description') {
    const text = field === 'title' ? title : description
    await navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  function handleArchive() {
    if (!garment) return
    onArchive(garment.id)
    onClose()
  }

  const thumbUrl = (() => {
    if (!garment) return null
    const { data: { publicUrl } } = supabase.storage.from('garments').getPublicUrl(garment.thumb_path)
    return `${publicUrl}?width=96&height=96&resize=cover`
  })()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate resale listing">
      {garment && (
        <div className="flex flex-col gap-5">
          {/* Garment context header */}
          <div className="flex items-center gap-3 p-3 bg-surface-raised rounded-xl">
            {thumbUrl && (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                <Image src={thumbUrl} alt={garment.name} fill sizes="48px" className="object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{garment.name}</p>
              <p className="text-xs text-muted">{garment.category}</p>
            </div>
          </div>

          {isError && (
            <p className="text-sm text-red-500 text-center py-2">
              Failed to generate listing. Please try again.
            </p>
          )}

          {/* Title field */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted uppercase tracking-wide">Title</span>
            {isPending ? (
              <Skeleton className="h-10 w-full rounded-xl" />
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Generated title will appear here…"
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                />
                <button
                  onClick={() => handleCopy('title')}
                  disabled={!title}
                  aria-label="Copy title"
                  className="px-3 py-2 rounded-xl border border-border text-xs font-medium text-muted hover:text-foreground hover:bg-surface-raised transition-colors disabled:opacity-40 shrink-0"
                >
                  {copied === 'title' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          {/* Description field */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted uppercase tracking-wide">Description</span>
            {isPending ? (
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-5/6 rounded" />
                <Skeleton className="h-4 w-4/6 rounded" />
                <Skeleton className="h-4 w-full rounded" />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Generated description will appear here…"
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                />
                <button
                  onClick={() => handleCopy('description')}
                  disabled={!description}
                  aria-label="Copy description"
                  className="self-end px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-muted hover:text-foreground hover:bg-surface-raised transition-colors disabled:opacity-40"
                >
                  {copied === 'description' ? 'Copied!' : 'Copy description'}
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            <div className="flex gap-2">
              <button
                onClick={handleRegenerate}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-surface-raised transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                Regenerate
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted hover:bg-surface-raised transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                Close
              </button>
            </div>
            <button
              onClick={handleArchive}
              className="w-full px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              Archive this item
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
