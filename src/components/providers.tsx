'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useGarmentStore } from '@/stores/garmentStore'
import { useOutfitStore } from '@/stores/outfitStore'

export function Providers({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    const unsubscribe = initialize()
    return unsubscribe
  }, [initialize])

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
          },
        },
      })
  )

  // Track user changes to clear stale data on account switch
  const prevUserIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    const currentUserId = user?.id
    const prevUserId = prevUserIdRef.current

    // First mount — just record the ID
    if (prevUserId === undefined) {
      prevUserIdRef.current = currentUserId ?? null as unknown as string | undefined
      return
    }

    // User changed (switch account or sign-out)
    if (prevUserId !== currentUserId) {
      prevUserIdRef.current = currentUserId

      // Clear React Query cache
      queryClient.clear()

      // Reset Zustand data stores
      useGarmentStore.getState().reset()
      useOutfitStore.getState().reset()

      // Clear all VTO localStorage keys
      if (typeof window !== 'undefined') {
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith('vto_reference_photo_path')) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k))
      }
    }
  }, [user, queryClient])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
