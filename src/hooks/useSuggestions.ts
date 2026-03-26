'use client'

import { useQuery } from '@tanstack/react-query'
import type { SuggestedOutfit } from '@/lib/types'

async function fetchSuggestions(): Promise<{ outfits: SuggestedOutfit[] }> {
  const res = await fetch('/api/suggestions')
  if (!res.ok) {
    throw new Error('Failed to fetch suggestions')
  }
  return res.json() as Promise<{ outfits: SuggestedOutfit[] }>
}

export function useSuggestions() {
  return useQuery({
    queryKey: ['suggestions'],
    queryFn: fetchSuggestions,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}
