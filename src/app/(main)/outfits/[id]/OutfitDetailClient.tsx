'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { OutfitWithGarments, GarmentCategory } from '@/lib/types'

const supabase = createClient()

interface Props {
  outfit: OutfitWithGarments
}

export function OutfitDetailClient({ outfit }: Props) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDelete() {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/outfits/${outfit.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      router.push('/outfits')
      router.refresh()
    } catch {
      setIsDeleting(false)
      setDeleteError('Failed to delete outfit. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-background pb-safe">
      <div className="px-4 pt-6 pb-32 max-w-lg mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{outfit.name}</h1>
            {outfit.occasion && (
              <p className="text-sm text-muted mt-0.5">{outfit.occasion}</p>
            )}
          </div>
          {outfit.is_favourite && (
            <span className="text-xl" aria-label="Favourite">⭐</span>
          )}
        </div>

        {/* Garment grid */}
        {outfit.garments.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {outfit.garments.map((garment) => {
              const { data: { publicUrl } } = supabase.storage
                .from('garments')
                .getPublicUrl(garment.thumb_path)
              const src = `${publicUrl}?width=200&height=200&resize=cover`

              return (
                <div
                  key={garment.id}
                  className="bg-surface rounded-xl border border-border overflow-hidden"
                >
                  <div className="relative w-full aspect-[3/4] bg-surface-raised">
                    <Image
                      src={src}
                      alt={garment.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 200px"
                      className="object-cover"
                    />
                  </div>
                  <div className="px-2 py-2">
                    <p className="text-xs font-medium text-foreground truncate mb-1">{garment.name}</p>
                    <Badge
                      label={garment.category}
                      category={garment.category as GarmentCategory}
                      variant="solid"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {outfit.garments.length === 0 && (
          <p className="text-sm text-muted text-center py-8">No garments in this outfit.</p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <Button variant="secondary" onClick={() => router.back()} className="w-full">
            Back
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={isDeleting}
            className="w-full"
          >
            Delete outfit
          </Button>
          {deleteError && (
            <p className="text-xs text-red-500 text-center">{deleteError}</p>
          )}
        </div>
      </div>
    </div>
  )
}
