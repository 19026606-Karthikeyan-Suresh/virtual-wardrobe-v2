'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useGarments } from '@/hooks/useGarments'
import { WEAR_AGAIN_THRESHOLD_DAYS } from '@/lib/constants'
import type { Garment } from '@/lib/types'

// Module-level singleton — safe because this file carries 'use client'
const supabase = createClient()

function getThumbUrl(thumbPath: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from('garments')
    .getPublicUrl(thumbPath)
  return `${publicUrl}?width=200&height=200&resize=cover`
}

function isWearAgainCandidate(garment: Garment): boolean {
  if (!garment.is_active) return false
  if (garment.last_worn_at === null) return true

  const threshold = new Date()
  threshold.setDate(threshold.getDate() - WEAR_AGAIN_THRESHOLD_DAYS)
  return new Date(garment.last_worn_at) < threshold
}

interface GarmentChipProps {
  garment: Garment
  index: number
}

function GarmentChip({ garment, index }: GarmentChipProps) {
  const router = useRouter()
  const thumbUrl = getThumbUrl(garment.thumb_path)

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2, ease: 'easeOut' }}
      whileTap={{ scale: 0.97 }}
      onClick={() => router.push(`/closet/${garment.id}`)}
      role="button"
      tabIndex={0}
      aria-label={`View ${garment.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(`/closet/${garment.id}`)
        }
      }}
      className="flex-shrink-0 w-32 cursor-pointer snap-start"
    >
      <div className="bg-surface rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="relative w-full aspect-[3/4] bg-surface-raised">
          <Image
            src={thumbUrl}
            alt={garment.name}
            fill
            sizes="128px"
            className="object-cover"
          />
        </div>
        <div className="px-2 py-2">
          <p className="text-xs font-medium text-foreground truncate mb-1">
            {garment.name}
          </p>
          <Badge
            label={garment.category}
            category={garment.category}
            variant="solid"
          />
        </div>
      </div>
    </motion.div>
  )
}

export function WearAgainCarousel() {
  const { data, isLoading, isError } = useGarments({ limit: 100 })

  const candidates = (data?.garments ?? [])
    .filter(isWearAgainCandidate)
    .slice(0, 10)

  if (isError) {
    return (
      <section aria-labelledby="wear-again-heading">
        <h2 id="wear-again-heading" className="px-4 text-base font-semibold text-foreground mb-3">
          Time to revisit
        </h2>
        <p className="px-4 text-sm text-red-500">Failed to load items. Please refresh.</p>
      </section>
    )
  }

  // Hidden if no qualifying garments (and not loading)
  if (!isLoading && candidates.length === 0) {
    return null
  }

  return (
    <section aria-labelledby="wear-again-heading">
      <h2
        id="wear-again-heading"
        className="px-4 text-base font-semibold text-foreground mb-3"
      >
        Time to revisit
      </h2>

      {isLoading && (
        <div className="flex gap-3 px-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-32">
              <Skeleton className="w-32 aspect-[3/4] rounded-xl" />
              <Skeleton className="mt-2 h-3 w-20 rounded" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && candidates.length > 0 && (
        <div
          className="flex gap-3 px-4 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {candidates.map((garment, index) => (
            <GarmentChip key={garment.id} garment={garment} index={index} />
          ))}
        </div>
      )}
    </section>
  )
}
