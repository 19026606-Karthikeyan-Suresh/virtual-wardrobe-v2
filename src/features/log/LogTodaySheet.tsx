'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { BottomSheet } from '@/components/ui'
import { useOutfits } from '@/hooks/useOutfits'
import { useLogOutfit } from '@/hooks/useLogs'
import type { DailyLogWithOutfit, Garment, OutfitWithGarments } from '@/lib/types'

const supabase = createClient()

function getThumbUrl(path: string): string {
  const { data } = supabase.storage.from('garments').getPublicUrl(path)
  return data.publicUrl
}

// ---------------------------------------------------------------------------
// Today's outfit card (shown when already logged)
// ---------------------------------------------------------------------------

interface TodayCardProps {
  log: DailyLogWithOutfit
}

function TodayCard({ log }: TodayCardProps) {
  const garments = (log.outfit?.garments ?? []) as Garment[]

  return (
    <div className="mx-4 mb-4 rounded-2xl bg-surface border border-border p-4">
      <p className="text-xs text-muted mb-1">Today&apos;s outfit</p>
      <p className="text-sm font-semibold text-foreground mb-3">
        {log.outfit?.name ?? 'Unnamed outfit'}
      </p>
      {garments.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {garments.map((g) => (
            <div key={g.id} className="w-12 h-12 rounded-lg overflow-hidden bg-surface-raised">
              <Image
                src={getThumbUrl(g.thumb_path)}
                alt={g.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Outfit row inside the BottomSheet picker
// ---------------------------------------------------------------------------

interface OutfitRowProps {
  outfit: OutfitWithGarments
  isLoading: boolean
  onSelect: () => void
}

function OutfitRow({ outfit, isLoading, onSelect }: OutfitRowProps) {
  const garments = (outfit.garments ?? []) as Garment[]

  return (
    <li>
      <button
        onClick={onSelect}
        disabled={isLoading}
        className="w-full flex items-center gap-3 rounded-xl p-3 hover:bg-surface-raised transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {/* Garment thumbnail grid (up to 4) */}
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-raised shrink-0 grid grid-cols-2 grid-rows-2 gap-px">
          {garments.slice(0, 4).map((g) => (
            <Image
              key={g.id}
              src={getThumbUrl(g.thumb_path)}
              alt=""
              aria-hidden="true"
              width={24}
              height={24}
              className="w-full h-full object-cover"
            />
          ))}
          {garments.length === 0 && (
            <div className="col-span-2 row-span-2 bg-surface-raised" aria-hidden="true" />
          )}
        </div>

        <span className="flex-1 text-sm font-medium text-foreground truncate">
          {outfit.name}
        </span>

        {isLoading && (
          <svg
            className="animate-spin h-4 w-4 text-brand shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
      </button>
    </li>
  )
}

// ---------------------------------------------------------------------------
// LogTodaySheet
// ---------------------------------------------------------------------------

interface LogTodaySheetProps {
  todayLog: DailyLogWithOutfit | null
}

export default function LogTodaySheet({ todayLog: initialTodayLog }: LogTodaySheetProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [pendingOutfitId, setPendingOutfitId] = useState<string | null>(null)
  // Client-side logged state (updated after successful mutation)
  const [loggedToday, setLoggedToday] = useState<DailyLogWithOutfit | null>(initialTodayLog)

  const { data: outfits = [] } = useOutfits()
  const { mutate, isPending } = useLogOutfit()

  function handleSelectOutfit(outfit: OutfitWithGarments) {
    if (isPending) return
    setPendingOutfitId(outfit.id)
    mutate(
      { outfit_id: outfit.id },
      {
        onSuccess: (log) => {
          setLoggedToday({
            ...log,
            outfit: { ...outfit },
          } as DailyLogWithOutfit)
          setSheetOpen(false)
        },
        onSettled: () => {
          setPendingOutfitId(null)
        },
      }
    )
  }

  if (loggedToday) {
    return <TodayCard log={loggedToday} />
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-24 right-4 z-30 flex items-center gap-2 px-4 py-3 rounded-2xl bg-brand text-brand-foreground shadow-lg hover:bg-brand-hover active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        aria-label="Log today's outfit"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span className="text-sm font-medium">Log Today</span>
      </button>

      {/* Outfit picker sheet */}
      <BottomSheet isOpen={sheetOpen} onClose={() => !isPending && setSheetOpen(false)}>
        <h2 className="text-base font-semibold text-foreground mb-4">
          What did you wear today?
        </h2>

        {outfits.length === 0 ? (
          <p className="text-sm text-muted py-8 text-center">
            No outfits yet. Build one in the Outfits tab.
          </p>
        ) : (
          <ul className="flex flex-col gap-1" role="list">
            {outfits.map((outfit) => (
              <OutfitRow
                key={outfit.id}
                outfit={outfit}
                isLoading={isPending && pendingOutfitId === outfit.id}
                onSelect={() => handleSelectOutfit(outfit)}
              />
            ))}
          </ul>
        )}
      </BottomSheet>
    </>
  )
}
