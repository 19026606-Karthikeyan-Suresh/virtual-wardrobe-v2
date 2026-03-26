import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { OutfitOccasion, OutfitWithGarments } from '@/lib/types'

interface SaveOutfitPayload {
  name: string
  occasion?: OutfitOccasion | null
  garment_ids: string[]
  positions: number[]
}

async function fetchOutfits(): Promise<OutfitWithGarments[]> {
  const res = await fetch('/api/outfits')
  if (!res.ok) throw new Error(`Failed to fetch outfits: ${res.statusText}`)
  const { outfits } = (await res.json()) as { outfits: OutfitWithGarments[] }
  return outfits
}

async function saveOutfit(payload: SaveOutfitPayload): Promise<OutfitWithGarments> {
  const res = await fetch('/api/outfits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Failed to save outfit: ${res.statusText}`)
  const { outfit } = (await res.json()) as { outfit: OutfitWithGarments }
  return outfit
}

export function useOutfits() {
  return useQuery({
    queryKey: ['outfits'],
    queryFn: fetchOutfits,
  })
}

export function useSaveOutfit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveOutfit,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['outfits'] })
      const previous = queryClient.getQueryData<OutfitWithGarments[]>(['outfits'])

      // Optimistic add — minimal placeholder
      const placeholder: OutfitWithGarments = {
        id: `placeholder-${Date.now()}`,
        user_id: '',
        name: payload.name,
        occasion: payload.occasion ?? null,
        weather_min_temp: null,
        weather_max_temp: null,
        preview_path: null,
        is_favourite: false,
        created_at: new Date().toISOString(),
        garments: [],
      }

      queryClient.setQueryData<OutfitWithGarments[]>(['outfits'], (old) =>
        old ? [placeholder, ...old] : [placeholder]
      )

      return { previous }
    },
    onError: (_err, _payload, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['outfits'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] })
    },
  })
}
