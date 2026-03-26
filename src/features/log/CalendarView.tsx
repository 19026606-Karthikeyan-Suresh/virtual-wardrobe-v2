'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useLogs } from '@/hooks/useLogs'
import { Skeleton } from '@/components/ui'
import type { DailyLogWithOutfit, Garment } from '@/lib/types'

const supabase = createClient()

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getMonthRange(date: Date): { startDate: string; endDate: string } {
  const y = date.getFullYear()
  const m = date.getMonth()
  const start = new Date(y, m, 1).toISOString().split('T')[0]
  const end = new Date(y, m + 1, 0).toISOString().split('T')[0]
  return { startDate: start, endDate: end }
}

function getThumbUrl(path: string): string {
  const { data } = supabase.storage.from('garments').getPublicUrl(path)
  return data.publicUrl
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function getDayDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// DayPopover
// ---------------------------------------------------------------------------

interface DayPopoverProps {
  log: DailyLogWithOutfit
  onClose: () => void
}

function DayPopover({ log, onClose }: DayPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const garments = (log.outfit?.garments ?? []) as Garment[]

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={`Log for ${log.logged_date}`}
      className="absolute inset-x-4 z-20 rounded-2xl bg-surface shadow-xl border border-border p-4 mt-2"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground truncate pr-2">
          {log.outfit?.name ?? 'Unnamed outfit'}
        </p>
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded-md text-muted hover:text-foreground hover:bg-surface-raised transition-colors"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {garments.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {garments.map((g) => (
            <div key={g.id} className="flex items-center gap-1.5 rounded-lg bg-surface-raised px-2 py-1.5">
              <div className="w-6 h-6 rounded overflow-hidden shrink-0">
                <Image
                  src={getThumbUrl(g.thumb_path)}
                  alt={g.name}
                  width={24}
                  height={24}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs text-foreground">{g.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted">No garments recorded</p>
      )}

      {log.notes && (
        <p className="text-xs text-muted mt-2 italic">&ldquo;{log.notes}&rdquo;</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// DayCell
// ---------------------------------------------------------------------------

interface DayCellProps {
  day: number | null
  log: DailyLogWithOutfit | undefined
  isToday: boolean
  onClick: () => void
}

function DayCell({ day, log, isToday, onClick }: DayCellProps) {
  if (day === null) return <div aria-hidden="true" />

  const firstGarment = (log?.outfit?.garments?.[0] ?? null) as Garment | null

  return (
    <button
      onClick={log ? onClick : undefined}
      disabled={!log}
      aria-label={
        log
          ? `${day}, logged outfit: ${log.outfit?.name ?? 'outfit'}`
          : `${day}, no log`
      }
      className={[
        'flex flex-col items-center gap-1 rounded-xl p-1.5 text-xs transition-colors',
        log ? 'cursor-pointer hover:bg-surface-raised' : 'cursor-default',
        isToday ? 'ring-2 ring-brand' : '',
      ].join(' ')}
    >
      <span className={['font-medium tabular-nums', isToday ? 'text-brand' : 'text-foreground'].join(' ')}>
        {day}
      </span>
      {firstGarment ? (
        <div className="w-8 h-8 rounded-md overflow-hidden bg-surface-raised">
          <Image
            src={getThumbUrl(firstGarment.thumb_path)}
            alt=""
            aria-hidden="true"
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-8 h-8" aria-hidden="true" />
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// CalendarView
// ---------------------------------------------------------------------------

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedLog, setSelectedLog] = useState<DailyLogWithOutfit | null>(null)

  const { startDate, endDate } = useMemo(() => getMonthRange(currentMonth), [currentMonth])
  const { data: logs, isLoading } = useLogs(startDate, endDate)

  const logMap = useMemo<Map<string, DailyLogWithOutfit>>(() => {
    const map = new Map<string, DailyLogWithOutfit>()
    for (const log of logs ?? []) {
      map.set(log.logged_date, log)
    }
    return map
  }, [logs])

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  const { year, month, daysInMonth, firstWeekday } = useMemo(() => {
    const y = currentMonth.getFullYear()
    const m = currentMonth.getMonth()
    return {
      year: y,
      month: m,
      daysInMonth: new Date(y, m + 1, 0).getDate(),
      firstWeekday: new Date(y, m, 1).getDay(),
    }
  }, [currentMonth])

  // Cells: null = padding, number = day
  const cells = useMemo<(number | null)[]>(() => [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ], [firstWeekday, daysInMonth])

  function prevMonth() {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
    setSelectedLog(null)
  }

  function nextMonth() {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
    setSelectedLog(null)
  }

  return (
    <div className="px-4 py-4 relative">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-foreground hover:bg-surface-raised transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-label="Previous month"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <h2 className="text-sm font-semibold text-foreground" aria-live="polite">
          {formatMonthYear(currentMonth)}
        </h2>

        <button
          onClick={nextMonth}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-foreground hover:bg-surface-raised transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-label="Next month"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1" aria-hidden="true">
        {DAY_LABELS.map((label) => (
          <div key={label} className="text-center text-xs text-muted font-medium py-1">
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-1" aria-label="Loading calendar">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} height={56} className="rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Monthly log calendar">
          {cells.map((day, i) => {
            const dateStr = day !== null ? getDayDateStr(year, month, day) : null
            const log = dateStr ? logMap.get(dateStr) : undefined
            return (
              <DayCell
                key={i}
                day={day}
                log={log}
                isToday={dateStr === today}
                onClick={() => {
                  if (log) setSelectedLog((prev) => (prev?.id === log.id ? null : log))
                }}
              />
            )
          })}
        </div>
      )}

      {/* Popover for selected day */}
      {selectedLog && (
        <DayPopover
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  )
}
