'use client'

import { useMemo } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { useGarmentsCPW } from '@/hooks/useAnalytics'
import { useOutfits } from '@/hooks/useOutfits'

interface StatTileProps {
  label: string
  value: string
  icon: string
  loading?: boolean
}

function StatTile({ label, value, icon, loading }: StatTileProps) {
  if (loading) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-2">
        <Skeleton className="h-6 w-6 rounded-md" />
        <Skeleton className="h-7 w-24 rounded-md" />
        <Skeleton className="h-4 w-20 rounded-md" />
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-1">
      <span className="text-xl" aria-hidden="true">{icon}</span>
      <span className="text-2xl font-bold text-foreground leading-tight">{value}</span>
      <span className="text-xs text-muted leading-tight">{label}</span>
    </div>
  )
}

export function StatsHeader() {
  const { data: cpwGarments, isLoading, isError } = useGarmentsCPW()
  const { data: outfits, isLoading: outfitsLoading, isError: outfitsError } = useOutfits()

  const stats = useMemo(() => {
    if (!cpwGarments) return null

    const activeGarments = cpwGarments.filter((g) => g.is_active)
    const totalGarments = activeGarments.length
    const totalOutfits = outfits?.length ?? 0

    // Most worn item
    const mostWorn = activeGarments.reduce<typeof cpwGarments[0] | null>(
      (best, g) => (!best || g.times_worn > best.times_worn ? g : best),
      null
    )

    // Average CPW (exclude items never worn to avoid Infinity)
    const wornGarments = activeGarments.filter((g) => g.times_worn > 0)
    const avgCPW =
      wornGarments.length > 0
        ? wornGarments.reduce((sum, g) => sum + g.cpw, 0) / wornGarments.length
        : 0

    return { totalGarments, totalOutfits, mostWorn, avgCPW }
  }, [cpwGarments, outfits])

  const loading = isLoading || outfitsLoading
  const error = isError || outfitsError

  if (error) {
    return (
      <p className="text-sm text-red-500 px-1">Failed to load stats. Please refresh.</p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatTile
        icon="👗"
        label="Total garments"
        value={stats ? String(stats.totalGarments) : '—'}
        loading={loading}
      />
      <StatTile
        icon="✨"
        label="Outfits built"
        value={stats ? String(stats.totalOutfits) : '—'}
        loading={loading}
      />
      <StatTile
        icon="🏆"
        label={
          stats?.mostWorn
            ? `Most worn · ${stats.mostWorn.times_worn}×`
            : 'Most worn'
        }
        value={stats?.mostWorn?.name ?? '—'}
        loading={loading}
      />
      <StatTile
        icon="💰"
        label="Avg cost-per-wear"
        value={stats ? `$${stats.avgCPW.toFixed(2)}` : '—'}
        loading={loading}
      />
    </div>
  )
}
