'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { VTOResult } from '@/lib/types'

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchVTOResults(): Promise<VTOResult[]> {
  const res = await fetch('/api/vto/results')
  if (!res.ok) throw new Error(`Failed to fetch VTO results: ${res.statusText}`)
  const { results } = (await res.json()) as { results: VTOResult[] }
  return results
}

interface GenerateVTOPayload {
  garment_id: string
  source_photo_path: string
}

async function generateVTO(payload: GenerateVTOPayload): Promise<VTOResult> {
  const res = await fetch('/api/vto/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = (await res.json()) as { error?: string }
    throw new Error(body.error ?? `VTO generation failed: ${res.statusText}`)
  }
  const { result } = (await res.json()) as { result: VTOResult }
  return result
}

async function deleteVTOResult(id: string): Promise<void> {
  const res = await fetch(`/api/vto/results/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete VTO result: ${res.statusText}`)
}

// ---------------------------------------------------------------------------
// Query hook
// ---------------------------------------------------------------------------

export function useVTOResults() {
  return useQuery({
    queryKey: ['vto-results'],
    queryFn: fetchVTOResults,
  })
}

// ---------------------------------------------------------------------------
// Generate mutation
// ---------------------------------------------------------------------------

export function useGenerateVTO() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generateVTO,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['vto-results'] })
      const previous = queryClient.getQueryData<VTOResult[]>(['vto-results'])

      // Optimistic skeleton placeholder
      const placeholder: VTOResult = {
        id: `placeholder-${Date.now()}`,
        user_id: '',
        garment_id: payload.garment_id,
        source_photo_path: payload.source_photo_path,
        result_path: '',
        api_provider: 'fashn',
        generation_ms: null,
        created_at: new Date().toISOString(),
      }

      queryClient.setQueryData<VTOResult[]>(['vto-results'], (old) =>
        old ? [placeholder, ...old] : [placeholder]
      )

      return { previous }
    },
    onError: (_err, _payload, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['vto-results'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['vto-results'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Delete mutation
// ---------------------------------------------------------------------------

export function useDeleteVTOResult() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteVTOResult,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['vto-results'] })
      const previous = queryClient.getQueryData<VTOResult[]>(['vto-results'])

      queryClient.setQueryData<VTOResult[]>(['vto-results'], (old) =>
        old ? old.filter((r) => r.id !== id) : []
      )

      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['vto-results'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['vto-results'] })
    },
  })
}
