'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSuggestions } from '@/hooks/useSuggestions'
import { useOutfitStore } from '@/stores/outfitStore'
import type { SuggestedOutfit, Garment } from '@/lib/types'

// Module-level singleton — safe because this file carries 'use client'
const supabase = createClient()

function getThumbUrl(thumbPath: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from('garments')
    .getPublicUrl(thumbPath)
  return `${publicUrl}?width=200&height=200&resize=cover`
}

const harmonyColour: Record<SuggestedOutfit['colour_harmony'], string> = {
  complementary: '#3B82F6',
  analogous:     '#22C55E',
  monochromatic: '#A855F7',
  neutral:       '#6B7280',
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

interface SuggestionCardProps {
  suggestion: SuggestedOutfit
  index: number
  onPress: (garments: Garment[]) => void
}

function SuggestionCard({ suggestion, index, onPress }: SuggestionCardProps) {
  const thumbnails = suggestion.garments.slice(0, 4)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.25, ease: 'easeOut' }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onPress(suggestion.garments)}
      role="button"
      tabIndex={0}
      aria-label={`${capitalize(suggestion.colour_harmony)} outfit suggestion`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPress(suggestion.garments)
        }
      }}
      className="flex-shrink-0 w-52 cursor-pointer snap-start"
    >
      <div className="bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow duration-200">
        {/* Thumbnail collage */}
        <div className="grid grid-cols-2 gap-0.5 bg-surface-raised aspect-square">
          {thumbnails.map((garment) => (
            <div key={garment.id} className="relative overflow-hidden bg-surface-raised">
              <Image
                src={getThumbUrl(garment.thumb_path)}
                alt={garment.name}
                fill
                sizes="104px"
                className="object-cover"
              />
            </div>
          ))}
          {/* Fill empty cells for visual balance */}
          {Array.from({ length: Math.max(0, 4 - thumbnails.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-surface-raised" />
          ))}
        </div>

        {/* Card footer */}
        <div className="px-3 py-2.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Badge
              label={capitalize(suggestion.colour_harmony)}
              color={harmonyColour[suggestion.colour_harmony]}
              variant="solid"
            />
            {suggestion.weather_suitable && (
              <span
                className="text-xs text-muted flex items-center gap-1"
                aria-label="Weather suitable"
              >
                <span aria-hidden="true">☀️</span>
                <span className="text-[11px]">Suitable</span>
              </span>
            )}
          </div>
          <p className="text-xs text-muted">
            {suggestion.garments.length} piece{suggestion.garments.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export function TodaysPicks() {
  const { data, isLoading, isError } = useSuggestions()
  const router = useRouter()
  const clearCanvas = useOutfitStore((s) => s.clearCanvas)
  const addToCanvas = useOutfitStore((s) => s.addToCanvas)

  function handleCardPress(garments: Garment[]) {
    clearCanvas()
    garments.forEach((g) => addToCanvas(g))
    router.push('/outfits/new')
  }

  return (
    <section aria-labelledby="todays-picks-heading">
      <h2
        id="todays-picks-heading"
        className="px-4 text-base font-semibold text-foreground mb-3"
      >
        Today&apos;s Picks
      </h2>

      {isLoading && (
        <div className="flex gap-3 px-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-52">
              <Skeleton className="w-52 aspect-square rounded-2xl" />
              <Skeleton className="mt-2 h-4 w-24 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <p className="mx-4 text-sm text-red-500">Failed to load suggestions. Please refresh.</p>
      )}

      {!isLoading && (!data?.outfits || data.outfits.length === 0) && (
        <div className="mx-4 py-8 px-4 rounded-2xl border border-dashed border-border flex flex-col items-center gap-2 text-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted"
            aria-hidden="true"
          >
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
          <p className="text-sm text-muted">
            No suggestions yet — add more garments to your closet
          </p>
        </div>
      )}

      {!isLoading && data?.outfits && data.outfits.length > 0 && (
        <div
          className="flex gap-3 px-4 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {data.outfits.map((suggestion, index) => (
            <SuggestionCard
              key={index}
              suggestion={suggestion}
              index={index}
              onPress={handleCardPress}
            />
          ))}
        </div>
      )}
    </section>
  )
}
