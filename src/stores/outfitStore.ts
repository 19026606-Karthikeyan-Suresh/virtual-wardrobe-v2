import { create } from 'zustand'
import { arrayMove } from '@dnd-kit/sortable'
import type { Garment, Outfit, OutfitOccasion } from '@/lib/types'

export interface CanvasItem {
  garment: Garment
  position: number // z-index / layer order (0 = bottom)
  x: number       // % offset within canvas (0–100)
  y: number       // % offset within canvas (0–100)
}

interface OutfitState {
  outfits: Outfit[]
  canvasItems: CanvasItem[]
  isLoading: boolean
}

interface OutfitActions {
  fetchOutfits: () => Promise<void>
  addToCanvas: (garment: Garment) => void
  removeFromCanvas: (garmentId: string) => void
  moveItem: (garmentId: string, newX: number, newY: number) => void
  reorderLayers: (activeId: string, overId: string) => void
  saveOutfit: (name: string, occasion?: OutfitOccasion) => Promise<void>
  clearCanvas: () => void
  reset: () => void
}

export const useOutfitStore = create<OutfitState & OutfitActions>((set, get) => ({
  outfits: [],
  canvasItems: [],
  isLoading: false,

  fetchOutfits: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/outfits')
      if (!res.ok) throw new Error(`Failed to fetch outfits: ${res.statusText}`)
      const { outfits } = (await res.json()) as { outfits: Outfit[] }
      set({ outfits, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  addToCanvas: (garment: Garment) => {
    const { canvasItems } = get()
    // Prevent duplicates
    if (canvasItems.some((item) => item.garment.id === garment.id)) return
    const n = canvasItems.length
    // Stagger initial placement so garments don't fully overlap
    const x = Math.min(10 + n * 6, 60)
    const y = Math.min(10 + n * 6, 60)
    set({
      canvasItems: [
        ...canvasItems,
        { garment, position: n, x, y },
      ],
    })
  },

  removeFromCanvas: (garmentId: string) => {
    const updated = get()
      .canvasItems.filter((item) => item.garment.id !== garmentId)
      .map((item, index) => ({ ...item, position: index }))
    set({ canvasItems: updated })
  },

  moveItem: (garmentId: string, newX: number, newY: number) => {
    set((state) => ({
      canvasItems: state.canvasItems.map((item) =>
        item.garment.id === garmentId
          ? { ...item, x: Math.max(0, Math.min(85, newX)), y: Math.max(0, Math.min(85, newY)) }
          : item
      ),
    }))
  },

  reorderLayers: (activeId: string, overId: string) => {
    const sorted = [...get().canvasItems].sort((a, b) => a.position - b.position)
    const oldIndex = sorted.findIndex((item) => item.garment.id === activeId)
    const newIndex = sorted.findIndex((item) => item.garment.id === overId)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(sorted, oldIndex, newIndex)
    set({ canvasItems: reordered.map((item, index) => ({ ...item, position: index })) })
  },

  saveOutfit: async (name: string, occasion?: OutfitOccasion) => {
    const { canvasItems } = get()
    const sorted = [...canvasItems].sort((a, b) => a.position - b.position)

    set({ isLoading: true })
    try {
      const res = await fetch('/api/outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          occasion: occasion ?? null,
          garment_ids: sorted.map((item) => item.garment.id),
          positions: sorted.map((item) => item.position),
        }),
      })
      if (!res.ok) throw new Error(`Failed to save outfit: ${res.statusText}`)
      const { outfit } = (await res.json()) as { outfit: Outfit }
      set((state) => ({
        outfits: [outfit, ...state.outfits],
        isLoading: false,
      }))
      get().clearCanvas()
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  clearCanvas: () => {
    set({ canvasItems: [] })
  },

  reset: () => {
    set({ outfits: [], canvasItems: [], isLoading: false })
  },
}))
