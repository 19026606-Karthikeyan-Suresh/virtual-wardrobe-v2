'use client'

import { useState } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/layout/PageHeader'
import { FilterChips } from '@/features/closet/FilterChips'
import { GarmentGrid } from '@/features/closet/GarmentGrid'
import { useDebounce } from '@/hooks/useDebounce'
import type { GarmentCategory } from '@/lib/types'

export default function ClosetPage() {
  const [searchRaw, setSearchRaw] = useState('')
  const [category, setCategory] = useState<GarmentCategory | null>(null)

  const search = useDebounce(searchRaw, 300)

  const filters = {
    ...(category ? { category } : {}),
    ...(search   ? { search }   : {}),
  }

  return (
    <>
      <PageHeader title="My Closet" />

      {/* Search bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
            placeholder="Search garments…"
            aria-label="Search garments"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Category filter chips */}
      <FilterChips selected={category} onChange={setCategory} />

      <div className="h-3" />

      {/* Masonry garment grid */}
      <GarmentGrid filters={filters} />

      {/* Floating upload FAB — positioned above BottomNav with safe area support */}
      <Link
        href="/closet/upload"
        aria-label="Upload new garment"
        className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+16px)] right-4 z-40 w-14 h-14 rounded-full bg-brand text-white shadow-lg flex items-center justify-center hover:bg-brand-hover active:scale-95 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Link>
    </>
  )
}
