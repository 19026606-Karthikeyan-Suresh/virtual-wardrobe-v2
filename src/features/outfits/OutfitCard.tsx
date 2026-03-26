'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import type { OutfitWithGarments } from '@/lib/types'

const supabase = createClient()

function getPublicUrl(bucket: string, path: string): string {
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
  return publicUrl
}

function getThumbUrl(thumbPath: string): string {
  return getPublicUrl('garments', thumbPath)
}

interface OutfitCardProps {
  outfit: OutfitWithGarments
  onDelete: (id: string) => void
  onToggleFavourite: (id: string, value: boolean) => void
}

const DELETE_THRESHOLD = -90

export function OutfitCard({ outfit, onDelete, onToggleFavourite }: OutfitCardProps) {
  const x = useMotionValue(0)
  const deleteOpacity = useTransform(x, [-120, -DELETE_THRESHOLD], [1, 0])
  const cardOpacity = useTransform(x, [-120, 0], [0.6, 1])
  const constraintsRef = useRef<HTMLDivElement>(null)

  async function handleDragEnd() {
    if (x.get() < DELETE_THRESHOLD) {
      await animate(x, -400, { duration: 0.25 })
      onDelete(outfit.id)
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 })
    }
  }

  const thumbnails = outfit.garments.slice(0, 4).map((g) => getThumbUrl(g.thumb_path))
  const previewUrl = outfit.preview_path
    ? getPublicUrl('garments', outfit.preview_path)
    : null

  return (
    <div ref={constraintsRef} className="relative break-inside-avoid mb-3 overflow-hidden rounded-xl">
      {/* Delete hint behind card */}
      <motion.div
        style={{ opacity: deleteOpacity }}
        className="absolute inset-y-0 right-0 left-0 flex items-center justify-end pr-5 bg-red-500 rounded-xl"
        aria-hidden="true"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
      </motion.div>

      {/* Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -200, right: 0 }}
        dragElastic={0.1}
        style={{ x, opacity: cardOpacity }}
        onDragEnd={handleDragEnd}
        className="bg-surface border border-border rounded-xl overflow-hidden cursor-grab active:cursor-grabbing select-none touch-pan-y"
        aria-label={`Outfit: ${outfit.name}`}
      >
        {/* Image area */}
        <div className="relative w-full aspect-[3/4] bg-surface-raised">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={outfit.name}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover"
              draggable={false}
            />
          ) : thumbnails.length > 0 ? (
            <div className={`w-full h-full grid ${thumbnails.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-0.5`}>
              {thumbnails.map((url, i) => (
                <div key={i} className="relative bg-surface-raised overflow-hidden">
                  <Image
                    src={url}
                    alt=""
                    fill
                    sizes="100px"
                    className="object-cover"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted" aria-hidden="true">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
            </div>
          )}

          {/* Favourite pin */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavourite(outfit.id, !outfit.is_favourite) }}
            aria-label={outfit.is_favourite ? 'Remove from favourites' : 'Add to favourites'}
            aria-pressed={outfit.is_favourite}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={outfit.is_favourite ? 'currentColor' : 'none'}
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={outfit.is_favourite ? 'text-yellow-400' : 'text-white'}
              aria-hidden="true"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        </div>

        {/* Footer */}
        <div className="px-3 py-2.5 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground truncate">{outfit.name}</p>
          {outfit.occasion && (
            <Badge label={outfit.occasion} variant="outline" className="shrink-0" />
          )}
        </div>
      </motion.div>
    </div>
  )
}
