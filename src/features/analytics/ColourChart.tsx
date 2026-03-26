'use client'

import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Skeleton } from '@/components/ui/Skeleton'
import { useGarments } from '@/hooks/useGarments'

// ---------------------------------------------------------------------------
// Colour bucketing — group hex colours into 8 named hue ranges
// ---------------------------------------------------------------------------

interface ColourBucket {
  name: string
  hueMin: number
  hueMax: number
  representative: string // fallback colour if no garments map here
}

const BUCKETS: ColourBucket[] = [
  { name: 'Red', hueMin: 345, hueMax: 360, representative: '#ef4444' },
  { name: 'Red', hueMin: 0, hueMax: 15, representative: '#ef4444' },
  { name: 'Orange', hueMin: 15, hueMax: 45, representative: '#f97316' },
  { name: 'Yellow', hueMin: 45, hueMax: 75, representative: '#eab308' },
  { name: 'Green', hueMin: 75, hueMax: 165, representative: '#22c55e' },
  { name: 'Teal / Cyan', hueMin: 165, hueMax: 210, representative: '#06b6d4' },
  { name: 'Blue', hueMin: 210, hueMax: 270, representative: '#3b82f6' },
  { name: 'Purple', hueMin: 270, hueMax: 345, representative: '#a855f7' },
]

const NEUTRAL_BUCKET = { name: 'Neutral', representative: '#a8a29e' }

/** Parse a hex string to HSL. Returns null if invalid. */
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return null
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return { h: h * 360, s, l }
}

function bucketColour(hex: string): string {
  const hsl = hexToHsl(hex)
  if (!hsl) return NEUTRAL_BUCKET.name
  if (hsl.s < 0.12) return NEUTRAL_BUCKET.name
  const { h } = hsl
  // Special wrap for red (spans 345-360 and 0-15)
  const redBucket = BUCKETS.find((b) => b.name === 'Red' && b.hueMin === 345)
  if (redBucket && (h >= 345 || h < 15)) return 'Red'
  const match = BUCKETS.find(
    (b) => b.name !== 'Red' && h >= b.hueMin && h < b.hueMax
  )
  return match?.name ?? NEUTRAL_BUCKET.name
}

const ALL_BUCKET_NAMES = ['Red', 'Orange', 'Yellow', 'Green', 'Teal / Cyan', 'Blue', 'Purple', 'Neutral']

function representativeHex(name: string, hexSamples: string[]): string {
  if (hexSamples.length > 0) {
    // Use the first actual garment hex colour in this bucket as the segment colour
    return hexSamples[0]
  }
  const b = BUCKETS.find((b) => b.name === name)
  return b?.representative ?? NEUTRAL_BUCKET.representative
}

interface ChartEntry {
  name: string
  count: number
  fill: string
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: ChartEntry }>
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.[0]) return null
  const { name, value } = payload[0]
  return (
    <div className="bg-surface border border-border rounded-xl px-3 py-2 text-sm shadow-lg">
      <span className="font-medium text-foreground">{name}</span>
      <span className="text-muted ml-2">{value} garment{value !== 1 ? 's' : ''}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ColourChart() {
  const { data, isLoading, isError } = useGarments({ limit: 500 })

  const chartData = useMemo<ChartEntry[]>(() => {
    if (!data?.garments) return []

    const active = data.garments.filter((g) => g.is_active)
    const bucketMap: Record<string, string[]> = {}
    ALL_BUCKET_NAMES.forEach((n) => { bucketMap[n] = [] })

    for (const g of active) {
      const bucket = bucketColour(g.color_primary)
      bucketMap[bucket]?.push(g.color_primary)
    }

    return ALL_BUCKET_NAMES
      .map((name) => ({
        name,
        count: bucketMap[name]?.length ?? 0,
        fill: representativeHex(name, bucketMap[name] ?? []),
      }))
      .filter((entry) => entry.count > 0)
  }, [data])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="w-48 h-48 rounded-full" />
        <div className="flex flex-wrap gap-2 justify-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-20 rounded-full" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-center text-sm text-red-500 py-8">
        Failed to load colour data. Please refresh.
      </p>
    )
  }

  if (chartData.length === 0) {
    return (
      <p className="text-center text-muted text-sm py-8">
        Add garments to see your colour breakdown.
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius="45%"
          outerRadius="70%"
          paddingAngle={2}
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value: string) => (
            <span className="text-xs text-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
