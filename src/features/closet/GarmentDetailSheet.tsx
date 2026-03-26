'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TagEditForm } from '@/features/closet/TagEditForm'
import { useGarmentStore } from '@/stores/garmentStore'
import { WARMTH_LEVELS } from '@/lib/constants'
import type { Garment } from '@/lib/types'

// Module-level singleton — safe because this file carries 'use client'
const supabase = createClient()

interface GarmentDetailSheetProps {
  garment: Garment
  isOpen: boolean
  onClose: () => void
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Never worn'
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function computeCPW(garment: Garment): string {
  if (garment.times_worn === 0) return 'N/A (never worn)'
  const cpw = (garment.purchase_price + (garment.maintenance_cost ?? 0)) / garment.times_worn
  return `$${cpw.toFixed(2)}`
}

export function GarmentDetailSheet({ garment: initialGarment, isOpen, onClose }: GarmentDetailSheetProps) {
  const [garment, setGarment] = useState(initialGarment)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const { archiveGarment: storeArchive, updateGarment: storeUpdate } = useGarmentStore()

  const { data: { publicUrl } } = supabase.storage
    .from('garments')
    .getPublicUrl(garment.image_path)

  const warmthLabel = WARMTH_LEVELS.find((w) => w.value === garment.warmth_level)?.label ?? String(garment.warmth_level)

  async function handleArchive() {
    setIsArchiving(true)
    setArchiveError(null)
    try {
      await storeArchive(garment.id)
      onClose()
    } catch {
      setIsArchiving(false)
      setArchiveError('Failed to archive. Please try again.')
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/garments/${garment.id}?hard=true`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setShowDeleteModal(false)
      onClose()
    } catch {
      setIsDeleting(false)
      setDeleteError('Failed to delete. Please try again.')
    }
  }

  function handleSave(updated: Garment) {
    setGarment(updated)
    storeUpdate(garment.id, updated)
    setIsEditing(false)
  }

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose}>
        {isEditing ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-foreground">Edit Tags</h2>
            <TagEditForm
              garment={garment}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Image */}
            <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-surface-raised">
              <Image
                src={publicUrl}
                alt={garment.name}
                fill
                sizes="(max-width: 640px) 100vw, 480px"
                className="object-contain"
              />
            </div>

            {/* Name + category */}
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground leading-tight">
                {garment.name}
              </h2>
              <Badge label={garment.category} category={garment.category} variant="solid" className="shrink-0" />
            </div>

            {/* Metadata grid */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {/* Colors */}
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium text-muted uppercase tracking-wide">Primary colour</dt>
                <dd className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded-full border border-border shrink-0"
                    style={{ backgroundColor: garment.color_primary }}
                    aria-label={garment.color_primary}
                  />
                  <span className="text-foreground font-mono text-xs">{garment.color_primary}</span>
                </dd>
              </div>

              {garment.color_secondary && (
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-medium text-muted uppercase tracking-wide">Secondary colour</dt>
                  <dd className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-full border border-border shrink-0"
                      style={{ backgroundColor: garment.color_secondary }}
                      aria-label={garment.color_secondary}
                    />
                    <span className="text-foreground font-mono text-xs">{garment.color_secondary}</span>
                  </dd>
                </div>
              )}

              {garment.fabric && (
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-medium text-muted uppercase tracking-wide">Fabric</dt>
                  <dd className="text-foreground">{garment.fabric}</dd>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium text-muted uppercase tracking-wide">Warmth</dt>
                <dd className="text-foreground">{warmthLabel}</dd>
              </div>

              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium text-muted uppercase tracking-wide">Worn</dt>
                <dd className="text-foreground">{garment.times_worn} times</dd>
              </div>

              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium text-muted uppercase tracking-wide">Last worn</dt>
                <dd className="text-foreground">{formatDate(garment.last_worn_at)}</dd>
              </div>

              <div className="flex flex-col gap-1 col-span-2">
                <dt className="text-xs font-medium text-muted uppercase tracking-wide">Cost per wear</dt>
                <dd className="text-foreground font-semibold">{computeCPW(garment)}</dd>
              </div>
            </dl>

            {/* Vibe badges */}
            {garment.vibe.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted uppercase tracking-wide">Vibe</p>
                <div className="flex flex-wrap gap-2">
                  {garment.vibe.map((v) => (
                    <Badge key={v} label={v} variant="outline" />
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsEditing(true)} className="w-full">
                Edit Tags
              </Button>
              <Button
                variant="secondary"
                onClick={handleArchive}
                loading={isArchiving}
                className="w-full"
              >
                Archive
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
                className="w-full"
              >
                Delete
              </Button>
              {archiveError && (
                <p className="text-xs text-red-500 text-center">{archiveError}</p>
              )}
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete garment"
      >
        <div className="flex flex-col gap-5">
          <p className="text-sm text-muted">
            This will permanently delete <strong className="text-foreground">{garment.name}</strong> and remove its image from storage. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={isDeleting}
              className="flex-1"
            >
              Delete permanently
            </Button>
          </div>
          {deleteError && (
            <p className="text-xs text-red-500 text-center mt-1">{deleteError}</p>
          )}
        </div>
      </Modal>
    </>
  )
}
