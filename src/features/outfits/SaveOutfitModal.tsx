'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useOutfitStore } from '@/stores/outfitStore'
import { useSaveOutfit } from '@/hooks/useOutfits'
import { OCCASIONS } from '@/lib/constants'
import type { OutfitOccasion } from '@/lib/types'

interface SaveOutfitModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SaveOutfitModal({ isOpen, onClose }: SaveOutfitModalProps) {
  const router = useRouter()
  const canvasItems = useOutfitStore((s) => s.canvasItems)
  const clearCanvas = useOutfitStore((s) => s.clearCanvas)
  const { mutateAsync: saveOutfit, isPending } = useSaveOutfit()

  const [name, setName] = useState('')
  const [occasion, setOccasion] = useState<OutfitOccasion | ''>('')
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    if (isPending) return
    setName('')
    setOccasion('')
    setError(null)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Outfit name is required')
      return
    }

    setError(null)

    const sorted = [...canvasItems].sort((a, b) => a.position - b.position)

    try {
      await saveOutfit({
        name: name.trim(),
        occasion: occasion || null,
        garment_ids: sorted.map((item) => item.garment.id),
        positions: sorted.map((item) => item.position),
      })
      clearCanvas()
      handleClose()
      router.push('/outfits')
    } catch {
      setError('Failed to save outfit. Please try again.')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Save Outfit">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Outfit name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Summer Brunch Look"
          error={error && !name.trim() ? error : undefined}
          disabled={isPending}
          autoFocus
        />

        {/* Occasion selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground" htmlFor="occasion-select">
            Occasion <span className="text-muted font-normal">(optional)</span>
          </label>
          <select
            id="occasion-select"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value as OutfitOccasion | '')}
            disabled={isPending}
            className="w-full px-3 py-2 text-sm bg-surface-raised border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-60"
          >
            <option value="">No occasion</option>
            {OCCASIONS.map((occ) => (
              <option key={occ} value={occ}>{occ}</option>
            ))}
          </select>
        </div>

        {/* General error */}
        {error && name.trim() && (
          <p className="text-xs text-red-500" role="alert">{error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            loading={isPending}
            disabled={!name.trim()}
          >
            Save outfit
          </Button>
        </div>
      </form>
    </Modal>
  )
}
