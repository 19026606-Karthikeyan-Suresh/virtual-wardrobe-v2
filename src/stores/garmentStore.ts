import { create } from 'zustand'
import type { Garment } from '@/lib/types'
import type { GarmentFilters } from '@/hooks/useGarments'

interface GarmentState {
  garments: Garment[]
  filters: GarmentFilters
  isLoading: boolean
}

interface GarmentActions {
  fetchGarments: (filters?: GarmentFilters) => Promise<void>
  addGarment: (garment: Garment) => void
  updateGarment: (id: string, changes: Partial<Garment>) => Promise<void>
  archiveGarment: (id: string) => Promise<void>
  setFilters: (filters: GarmentFilters) => void
  reset: () => void
}

export const useGarmentStore = create<GarmentState & GarmentActions>((set, get) => ({
  garments: [],
  filters: {},
  isLoading: false,

  fetchGarments: async (filters?: GarmentFilters) => {
    const activeFilters = filters ?? get().filters
    set({ isLoading: true })

    try {
      const params = new URLSearchParams()
      if (activeFilters.category) params.set('category', activeFilters.category)
      if (activeFilters.search) params.set('search', activeFilters.search)
      if (activeFilters.page) params.set('page', String(activeFilters.page))
      if (activeFilters.limit) params.set('limit', String(activeFilters.limit))

      const res = await fetch(`/api/garments?${params.toString()}`)
      if (!res.ok) throw new Error(`Failed to fetch garments: ${res.statusText}`)

      const { garments } = (await res.json()) as { garments: Garment[]; total: number }
      set({ garments, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  addGarment: (garment: Garment) => {
    set((state) => ({ garments: [garment, ...state.garments] }))
  },

  updateGarment: async (id: string, changes: Partial<Garment>) => {
    // Optimistic update
    const previous = get().garments
    set((state) => ({
      garments: state.garments.map((g) => (g.id === id ? { ...g, ...changes } : g)),
    }))

    try {
      const res = await fetch(`/api/garments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      })
      if (!res.ok) throw new Error(`Failed to update garment: ${res.statusText}`)

      const { garment } = (await res.json()) as { garment: Garment }
      set((state) => ({
        garments: state.garments.map((g) => (g.id === id ? garment : g)),
      }))
    } catch (err) {
      // Rollback on error
      set({ garments: previous })
      throw err
    }
  },

  archiveGarment: async (id: string) => {
    // Optimistic removal
    const previous = get().garments
    set((state) => ({ garments: state.garments.filter((g) => g.id !== id) }))

    try {
      const res = await fetch(`/api/garments/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Failed to archive garment: ${res.statusText}`)
    } catch (err) {
      // Rollback on error
      set({ garments: previous })
      throw err
    }
  },

  setFilters: (filters: GarmentFilters) => {
    set({ filters })
  },

  reset: () => {
    set({ garments: [], filters: {}, isLoading: false })
  },
}))
