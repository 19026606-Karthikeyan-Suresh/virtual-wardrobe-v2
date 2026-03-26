import { useQuery } from '@tanstack/react-query'
import type { Garment, GarmentCategory } from '@/lib/types'

export interface GarmentFilters {
  category?: GarmentCategory
  search?: string
  page?: number
  limit?: number
}

interface GarmentsResponse {
  garments: Garment[]
  total: number
}

async function fetchGarments(filters: GarmentFilters): Promise<GarmentsResponse> {
  const params = new URLSearchParams()

  if (filters.category) params.set('category', filters.category)
  if (filters.search) params.set('search', filters.search)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))

  const res = await fetch(`/api/garments?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch garments: ${res.statusText}`)
  }

  return res.json() as Promise<GarmentsResponse>
}

export function useGarments(filters: GarmentFilters = {}) {
  return useQuery({
    queryKey: ['garments', filters.category, filters.search, filters.page, filters.limit],
    queryFn: () => fetchGarments(filters),
  })
}
