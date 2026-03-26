'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { useSleepingItems } from '@/hooks/useAnalytics'
import { useGarmentStore } from '@/stores/garmentStore'
import { ResaleListingGenerator } from './ResaleListingGenerator'
import type { Garment, GarmentCategory } from '@/lib/types'

const supabase = createClient()

function daysSinceLabel(dateStr: string | null): string {
  if (!dateStr) return 'Never worn'
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  return `Last worn: ${days} day${days === 1 ? '' : 's'} ago`
}

function GarmentThumb({ thumbPath, name }: { thumbPath: string; name: string }) {
  const {
    data: { publicUrl },
  } = supabase.storage.from('garments').getPublicUrl(thumbPath)
  const src = `${publicUrl}?width=80&height=80&resize=cover`
  return (
    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-surface-raised shrink-0">
      <Image src={src} alt={name} fill sizes="40px" className="object-cover" />
    </div>
  )
}

function SkeletonRows() {
  return (
    <div className="flex flex-col divide-y divide-border">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3 px-4">
          <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          <Skeleton className="h-8 w-28 rounded-xl shrink-0" />
          <Skeleton className="h-8 w-16 rounded-xl shrink-0" />
        </div>
      ))}
    </div>
  )
}

export function SleepingItems() {
  const { data: garments, isLoading } = useSleepingItems()
  const archiveGarment = useGarmentStore((s) => s.archiveGarment)
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set())
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [archiveError, setArchiveError] = useState<string | null>(null)

  const visible = garments?.filter((g) => !archivedIds.has(g.id)) ?? []

  async function handleArchive(id: string) {
    setArchivedIds((prev) => new Set(prev).add(id))
    setArchiveError(null)
    try {
      await archiveGarment(id)
    } catch {
      setArchivedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      setArchiveError('Failed to archive item. Please try again.')
    }
  }

  function handleGenerateListing(garment: Garment) {
    setSelectedGarment(garment)
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Sleeping in your wardrobe</h2>
          <p className="text-xs text-muted mt-0.5">Items you haven&apos;t worn in 90+ days</p>
        </div>
        {archiveError && (
          <p className="px-4 py-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/20">
            {archiveError}
          </p>
        )}

        {isLoading ? (
          <SkeletonRows />
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-2">
            <svg
              className="w-10 h-10 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm font-medium text-foreground">
              Nothing sleeping — great wardrobe usage!
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {visible.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-3 py-3 px-4 hover:bg-surface-raised transition-colors"
              >
                <GarmentThumb thumbPath={g.thumb_path} name={g.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground truncate">{g.name}</span>
                    <Badge
                      label={g.category}
                      category={g.category as GarmentCategory}
                      variant="solid"
                    />
                  </div>
                  <p className="text-xs text-muted mt-0.5">{daysSinceLabel(g.last_worn_at)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleGenerateListing(g)}
                    className="px-3 py-1.5 rounded-xl bg-brand text-white text-xs font-medium hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  >
                    Generate listing
                  </button>
                  <button
                    onClick={() => handleArchive(g.id)}
                    className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-muted hover:text-foreground hover:bg-surface-raised transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    Archive
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ResaleListingGenerator
        garment={selectedGarment}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onArchive={handleArchive}
      />
    </>
  )
}
