'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import type { Garment, GarmentWithCPW } from '@/lib/types'

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchGarmentsCPW(): Promise<GarmentWithCPW[]> {
  const res = await fetch('/api/analytics/cpw')
  if (!res.ok) throw new Error(`Failed to fetch CPW data: ${res.statusText}`)
  const { garments } = (await res.json()) as { garments: GarmentWithCPW[] }
  return garments
}

async function fetchSleepingItems(): Promise<Garment[]> {
  const res = await fetch('/api/analytics/sleeping')
  if (!res.ok) throw new Error(`Failed to fetch sleeping items: ${res.statusText}`)
  const { garments } = (await res.json()) as { garments: Garment[] }
  return garments
}

interface ResaleListingPayload {
  garment_id: string
}

interface ResaleListingResult {
  title: string
  description: string
}

async function generateResaleListing(payload: ResaleListingPayload): Promise<ResaleListingResult> {
  const res = await fetch('/api/analytics/resale-listing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = (await res.json()) as { error?: string }
    throw new Error(body.error ?? `Resale listing generation failed: ${res.statusText}`)
  }
  return (await res.json()) as ResaleListingResult
}

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export function useGarmentsCPW() {
  return useQuery({
    queryKey: ['analytics', 'cpw'],
    queryFn: fetchGarmentsCPW,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSleepingItems() {
  return useQuery({
    queryKey: ['analytics', 'sleeping'],
    queryFn: fetchSleepingItems,
    staleTime: 5 * 60 * 1000,
  })
}

// ---------------------------------------------------------------------------
// Mutation hook
// ---------------------------------------------------------------------------

export function useResaleListing() {
  return useMutation({
    mutationFn: generateResaleListing,
  })
}
