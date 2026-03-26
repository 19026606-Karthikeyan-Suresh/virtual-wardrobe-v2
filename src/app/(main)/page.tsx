'use client'

import { useMemo } from 'react'
import { motion, type Variants } from 'framer-motion'
import { TodaysPicks } from '@/features/suggestions/TodaysPicks'
import { WearAgainCarousel } from '@/features/suggestions/WearAgainCarousel'
import { Skeleton } from '@/components/ui/Skeleton'
import { useWeather } from '@/hooks/useWeather'
import { useGarments } from '@/hooks/useGarments'
import { useOutfits } from '@/hooks/useOutfits'
import { useLogs } from '@/hooks/useLogs'
import { useAuthStore } from '@/stores/authStore'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getMonthDateRange(): { start: string; end: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate()
  return {
    start: `${year}-${month}-01`,
    end: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  }
}

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.3, ease: 'easeOut' as const },
  }),
}

export default function HomePage() {
  const user = useAuthStore((s) => s.user)
  const displayName = (user?.user_metadata?.display_name as string | undefined) ?? 'there'

  const { data: weather, isLoading: weatherLoading } = useWeather()

  // Quick stats
  const { data: garmentsData } = useGarments({ limit: 1 })
  const { data: outfits } = useOutfits()
  const { start: logStart, end: logEnd } = useMemo(() => getMonthDateRange(), [])
  const { data: logs } = useLogs(logStart, logEnd)

  const totalGarments = garmentsData?.total ?? 0
  const totalOutfits = outfits?.length ?? 0
  const logsThisMonth = logs?.length ?? 0

  return (
    <div
      className="pb-6"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
    >
      {/* Header: greeting + weather */}
      <motion.div
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="px-4 mb-6"
      >
        <h1 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {displayName}
        </h1>

        <div className="mt-2 h-7">
          {weatherLoading && (
            <Skeleton className="h-6 w-36 rounded-full" />
          )}
          {!weatherLoading && weather && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-raised text-sm text-muted">
              <span aria-hidden="true">🌡️</span>
              {Math.round(weather.temp_c)}°C · {weather.condition}
            </span>
          )}
        </div>
      </motion.div>

      {/* Today's Picks */}
      <motion.div
        custom={1}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="mb-6"
      >
        <TodaysPicks />
      </motion.div>

      {/* Wear Again carousel */}
      <motion.div
        custom={2}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="mb-6"
      >
        <WearAgainCarousel />
      </motion.div>

      {/* Quick stats */}
      <motion.div
        custom={3}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="px-4"
      >
        <h2 className="text-base font-semibold text-foreground mb-3">
          Your wardrobe
        </h2>
        <div className="flex gap-3">
          <StatChip
            value={totalGarments}
            label="garments"
            icon="👕"
          />
          <StatChip
            value={totalOutfits}
            label="outfits"
            icon="✨"
          />
          <StatChip
            value={logsThisMonth}
            label="logs this month"
            icon="📅"
          />
        </div>
      </motion.div>
    </div>
  )
}

interface StatChipProps {
  value: number
  label: string
  icon: string
}

function StatChip({ value, label, icon }: StatChipProps) {
  return (
    <div className="flex-1 bg-surface rounded-2xl border border-border px-3 py-3 flex flex-col items-center gap-1">
      <span className="text-lg" aria-hidden="true">{icon}</span>
      <span className="text-xl font-bold text-foreground leading-none">{value}</span>
      <span className="text-[11px] text-muted text-center leading-tight">{label}</span>
    </div>
  )
}
