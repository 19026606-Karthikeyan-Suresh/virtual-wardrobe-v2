import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import CalendarView from '@/features/log/CalendarView'
import LogTodaySheet from '@/features/log/LogTodaySheet'
import { Skeleton } from '@/components/ui'
import type { DailyLogWithOutfit, Garment } from '@/lib/types'

type OutfitGarmentJoin = { position: number; garments: unknown }
type RawOutfit = { outfit_garments: OutfitGarmentJoin[] } & Record<string, unknown>
type RawLog = { outfit: RawOutfit | null } & Record<string, unknown>

function reshapeLog(raw: RawLog): DailyLogWithOutfit {
  const { outfit: rawOutfit, ...logFields } = raw
  if (!rawOutfit) {
    return { ...logFields, outfit: null } as unknown as DailyLogWithOutfit
  }
  const { outfit_garments, ...outfitFields } = rawOutfit
  return {
    ...logFields,
    outfit: {
      ...outfitFields,
      garments: (outfit_garments ?? [])
        .sort((a: OutfitGarmentJoin, b: OutfitGarmentJoin) => a.position - b.position)
        .map((og: OutfitGarmentJoin) => og.garments) as Garment[],
    },
  } as unknown as DailyLogWithOutfit
}

function CalendarSkeleton() {
  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={32} height={32} className="rounded-lg" />
        <Skeleton width={140} height={20} className="rounded-md" />
        <Skeleton width={32} height={32} className="rounded-lg" />
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} height={56} className="rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default async function LogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let todayLog: DailyLogWithOutfit | null = null

  if (user) {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('daily_logs')
      .select(`
        *,
        outfit:outfits (
          *,
          outfit_garments (
            position,
            garments (*)
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('logged_date', today)
      .maybeSingle()

    if (data) {
      todayLog = reshapeLog(data as unknown as RawLog)
    }
  }

  return (
    <>
      <PageHeader title="Daily Log" />
      <div className="relative">
        <Suspense fallback={<CalendarSkeleton />}>
          <CalendarView />
        </Suspense>
        <LogTodaySheet todayLog={todayLog} />
      </div>
    </>
  )
}
