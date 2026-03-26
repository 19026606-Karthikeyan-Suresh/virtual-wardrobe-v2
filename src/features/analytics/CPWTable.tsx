'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { useGarmentsCPW } from '@/hooks/useAnalytics'
import type { GarmentWithCPW, GarmentCategory } from '@/lib/types'

type SortKey = 'cpw' | 'times_worn' | 'name' | 'category'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 10

const supabase = createClient()

function getCPWColour(cpw: number): string {
  if (cpw < 5) return 'text-emerald-600 dark:text-emerald-400'
  if (cpw <= 20) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function GarmentThumb({ thumbPath, name }: { thumbPath: string; name: string }) {
  const { data: { publicUrl } } = supabase.storage.from('garments').getPublicUrl(thumbPath)
  const src = `${publicUrl}?width=80&height=80&resize=cover`

  return (
    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-surface-raised shrink-0">
      <Image src={src} alt={name} fill sizes="40px" className="object-cover" />
    </div>
  )
}

interface ColHeaderProps {
  label: string
  sortKey: SortKey
  currentKey: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
  className?: string
}

function ColHeader({ label, sortKey, currentKey, dir, onSort, className = '' }: ColHeaderProps) {
  const active = currentKey === sortKey
  return (
    <th
      scope="col"
      className={`px-3 py-2.5 text-left text-xs font-medium text-muted cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap ${className}`}
      onClick={() => onSort(sortKey)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSort(sortKey) } }}
      tabIndex={0}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          <span aria-hidden="true" className="text-brand">
            {dir === 'asc' ? '↑' : '↓'}
          </span>
        ) : (
          <span aria-hidden="true" className="opacity-30">↕</span>
        )}
      </span>
    </th>
  )
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-t border-border">
          <td className="px-3 py-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
          </td>
          <td className="px-3 py-3"><Skeleton className="h-4 w-16 rounded" /></td>
          <td className="px-3 py-3"><Skeleton className="h-4 w-10 rounded" /></td>
          <td className="px-3 py-3"><Skeleton className="h-4 w-12 rounded" /></td>
        </tr>
      ))}
    </>
  )
}

export function CPWTable() {
  const { data: garments, isLoading, isError } = useGarmentsCPW()
  const [sortKey, setSortKey] = useState<SortKey>('cpw')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setVisibleCount(PAGE_SIZE)
  }

  const sorted = useMemo<GarmentWithCPW[]>(() => {
    if (!garments) return []
    return [...garments].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'cpw') cmp = a.cpw - b.cpw
      else if (sortKey === 'times_worn') cmp = a.times_worn - b.times_worn
      else if (sortKey === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortKey === 'category') cmp = a.category.localeCompare(b.category)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [garments, sortKey, sortDir])

  const visible = sorted.slice(0, visibleCount)
  const hasMore = visibleCount < sorted.length

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <ColHeader
              label="Garment"
              sortKey="name"
              currentKey={sortKey}
              dir={sortDir}
              onSort={handleSort}
              className="min-w-[160px]"
            />
            <ColHeader
              label="Category"
              sortKey="category"
              currentKey={sortKey}
              dir={sortDir}
              onSort={handleSort}
            />
            <ColHeader
              label="Worn"
              sortKey="times_worn"
              currentKey={sortKey}
              dir={sortDir}
              onSort={handleSort}
            />
            <ColHeader
              label="CPW"
              sortKey="cpw"
              currentKey={sortKey}
              dir={sortDir}
              onSort={handleSort}
            />
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <SkeletonRows />
          ) : isError ? (
            <tr>
              <td colSpan={4} className="px-3 py-8 text-center text-sm">
                <span className="text-red-500">Failed to load garments. Please refresh.</span>
              </td>
            </tr>
          ) : visible.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-3 py-8 text-center text-muted text-sm">
                No garments yet. Add some items to your wardrobe!
              </td>
            </tr>
          ) : (
            visible.map((g) => (
              <tr key={g.id} className="border-t border-border hover:bg-surface-raised transition-colors">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <GarmentThumb thumbPath={g.thumb_path} name={g.name} />
                    <span className="font-medium text-foreground truncate max-w-[140px]">{g.name}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <Badge
                    label={g.category}
                    category={g.category as GarmentCategory}
                    variant="solid"
                  />
                </td>
                <td className="px-3 py-3 text-muted">{g.times_worn}×</td>
                <td className={`px-3 py-3 font-semibold tabular-nums ${getCPWColour(g.cpw)}`}>
                  {g.times_worn === 0 ? '—' : `$${g.cpw.toFixed(2)}`}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {hasMore && (
        <div className="flex justify-center pt-4 pb-2">
          <button
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            className="px-5 py-2 rounded-xl bg-surface border border-border text-sm font-medium text-foreground hover:bg-surface-raised transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Load more ({sorted.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  )
}
