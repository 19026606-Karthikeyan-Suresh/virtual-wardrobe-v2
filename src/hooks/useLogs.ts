import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { DailyLog, DailyLogWithOutfit } from '@/lib/types'

interface LogOutfitPayload {
  outfit_id: string
  notes?: string | null
}

async function fetchLogs(startDate: string, endDate: string): Promise<DailyLogWithOutfit[]> {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate })
  const res = await fetch(`/api/logs?${params.toString()}`)
  if (!res.ok) throw new Error(`Failed to fetch logs: ${res.statusText}`)
  const { logs } = (await res.json()) as { logs: DailyLogWithOutfit[] }
  return logs
}

async function logOutfit(payload: LogOutfitPayload): Promise<DailyLog> {
  const res = await fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = (await res.json()) as { error?: string }
    throw new Error(body.error ?? `Failed to log outfit: ${res.statusText}`)
  }
  const { log } = (await res.json()) as { log: DailyLog }
  return log
}

export function useLogs(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['logs', startDate, endDate],
    queryFn: () => fetchLogs(startDate, endDate),
    enabled: Boolean(startDate && endDate),
  })
}

export function useLogOutfit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logOutfit,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['logs'] })
      const allEntries = queryClient.getQueriesData<DailyLogWithOutfit[]>({ queryKey: ['logs'] })
      const snapshot = allEntries.map(([key, data]) => ({ key, data }))

      const today = new Date().toISOString().split('T')[0]
      const placeholder: DailyLogWithOutfit = {
        id: `placeholder-${Date.now()}`,
        user_id: '',
        outfit_id: payload.outfit_id,
        logged_date: today,
        notes: payload.notes ?? null,
        created_at: new Date().toISOString(),
        outfit: null,
      }

      // Optimistically prepend to all cached log queries, replacing any existing today entry
      for (const [key] of allEntries) {
        queryClient.setQueryData<DailyLogWithOutfit[]>(key, (old) =>
          old
            ? [placeholder, ...old.filter((l) => l.logged_date !== today)]
            : [placeholder]
        )
      }

      return { snapshot }
    },
    onError: (_err, _payload, context) => {
      if (context?.snapshot) {
        for (const { key, data } of context.snapshot) {
          queryClient.setQueryData(key, data)
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] })
      queryClient.invalidateQueries({ queryKey: ['garments'] })
    },
  })
}
