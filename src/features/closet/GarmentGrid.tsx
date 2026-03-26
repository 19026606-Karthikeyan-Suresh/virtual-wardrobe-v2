'use client'

import Link from 'next/link'
import { Skeleton } from '@/components/ui'
import { GarmentCard } from './GarmentCard'
import { useGarments } from '@/hooks/useGarments'
import type { GarmentFilters } from '@/hooks/useGarments'

interface GarmentGridProps {
  filters: GarmentFilters
}

const SKELETON_COUNT = 8
const skeletonAspects = ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-[3/4]', 'aspect-square']

export function GarmentGrid({ filters }: GarmentGridProps) {
  const { data, isLoading, isError, error } = useGarments(filters)

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] px-6 text-center gap-2">
        <p className="text-sm font-medium text-foreground">
          Something went wrong loading your closet
        </p>
        <p className="text-xs text-muted">
          Check your connection and try refreshing
        </p>
        {process.env.NODE_ENV !== 'production' && (
          <p className="text-xs font-mono text-red-500 mt-2 max-w-xs break-all">
            {error instanceof Error ? error.message : String(error)}
          </p>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 px-4">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div key={i} className="break-inside-avoid mb-3">
            <Skeleton
              className={`w-full rounded-xl ${skeletonAspects[i % skeletonAspects.length]}`}
            />
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <Skeleton width="60%" height={14} />
              <Skeleton width="28%" height={18} rounded />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const garments = data?.garments ?? []
  const hasActiveFilters = !!(filters.category ?? filters.search)

  if (garments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-raised flex items-center justify-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted"
            aria-hidden="true"
          >
            <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
          </svg>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">
            {hasActiveFilters ? 'No garments match your filters' : 'Your closet is empty'}
          </p>
          <p className="text-xs text-muted mt-1">
            {hasActiveFilters
              ? 'Try clearing your filters'
              : 'Upload your first garment to get started'}
          </p>
        </div>

        {!hasActiveFilters && (
          <Link
            href="/closet/upload"
            className="mt-2 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors"
          >
            Upload garment
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 px-4">
      {garments.map((garment) => (
        <GarmentCard key={garment.id} garment={garment} />
      ))}
    </div>
  )
}
