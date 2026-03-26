'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/Skeleton'
import { useGarments } from '@/hooks/useGarments'
import type { GarmentCategory } from '@/lib/types'

const CATEGORY_COLOURS: Record<GarmentCategory, string> = {
  Top: '#38bdf8',       // sky-400
  Bottom: '#34d399',    // emerald-400
  Dress: '#f472b6',     // pink-400
  Shoes: '#fbbf24',     // amber-400
  Accessory: '#a78bfa', // violet-400
  Outerwear: '#94a3b8', // slate-400
}

interface ChartEntry {
  category: GarmentCategory
  count: number
  fill: string
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: ChartEntry }>
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.[0]) return null
  const { category, count } = payload[0].payload
  return (
    <div className="bg-surface border border-border rounded-xl px-3 py-2 text-sm shadow-lg">
      <span className="font-medium text-foreground">{category}</span>
      <span className="text-muted ml-2">{count} item{count !== 1 ? 's' : ''}</span>
    </div>
  )
}

export function CategoryChart() {
  const { data, isLoading, isError } = useGarments({ limit: 500 })

  const chartData = useMemo<ChartEntry[]>(() => {
    if (!data?.garments) return []

    const counts: Partial<Record<GarmentCategory, number>> = {}
    for (const g of data.garments) {
      if (!g.is_active) continue
      counts[g.category] = (counts[g.category] ?? 0) + 1
    }

    return (Object.keys(CATEGORY_COLOURS) as GarmentCategory[])
      .map((cat) => ({
        category: cat,
        count: counts[cat] ?? 0,
        fill: CATEGORY_COLOURS[cat],
      }))
      .filter((e) => e.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [data])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-6 rounded" width={`${60 - i * 8}%`} />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-center text-sm text-red-500 py-8">
        Failed to load category data. Please refresh.
      </p>
    )
  }

  if (chartData.length === 0) {
    return (
      <p className="text-center text-muted text-sm py-8">
        Add garments to see your category breakdown.
      </p>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <ResponsiveContainer width="100%" height={chartData.length * 52 + 24}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
        >
          <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="category"
            width={80}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={32}>
            {chartData.map((entry) => (
              <Cell key={entry.category} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
