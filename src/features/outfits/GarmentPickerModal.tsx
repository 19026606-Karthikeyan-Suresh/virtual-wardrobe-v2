'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { useGarments } from '@/hooks/useGarments'
import { useOutfitStore, type CanvasItem } from '@/stores/outfitStore'
import { CATEGORIES } from '@/lib/constants'
import { colourDistance, getComplementary, getAnalogous } from '@/lib/colour-theory'
import type { Garment, GarmentCategory } from '@/lib/types'

const supabase = createClient()

function getThumbUrl(thumbPath: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from('garments')
    .getPublicUrl(thumbPath)
  return `${publicUrl}?width=160&height=160&resize=cover`
}

// ---------------------------------------------------------------------------
// Recommendation logic
// ---------------------------------------------------------------------------

function isOutfitComplete(canvasItems: CanvasItem[]): boolean {
  const categories = new Set(canvasItems.map((item) => item.garment.category))
  const hasDress = categories.has('Dress')
  const hasTop = categories.has('Top')
  const hasBottom = categories.has('Bottom')
  const hasShoes = categories.has('Shoes')
  return hasShoes && (hasDress || (hasTop && hasBottom))
}

function getOutfitHarmonyScore(canvasItems: CanvasItem[]): number {
  if (canvasItems.length < 2) return 0
  let totalScore = 0
  let pairs = 0
  for (let i = 0; i < canvasItems.length; i++) {
    for (let j = i + 1; j < canvasItems.length; j++) {
      const hex1 = canvasItems[i].garment.color_primary
      const hex2 = canvasItems[j].garment.color_primary
      const comp = getComplementary(hex1)
      if (colourDistance(comp, hex2) < 30) { totalScore += 3; pairs++; continue }
      const analogous = getAnalogous(hex1)
      if (analogous.some((c) => colourDistance(c, hex2) < 30)) { totalScore += 2; pairs++; continue }
      pairs++
    }
  }
  return pairs > 0 ? totalScore / pairs : 0
}

function getRecommendations(
  canvasItems: CanvasItem[],
  allGarments: Garment[],
): Garment[] {
  if (canvasItems.length === 0) return []

  const onCanvasIds = new Set(canvasItems.map((item) => item.garment.id))
  const canvasGarments = canvasItems.map((item) => item.garment)
  const canvasCategories = new Set(canvasGarments.map((g) => g.category))
  const available = allGarments.filter((g) => !onCanvasIds.has(g.id))

  if (available.length === 0) return []

  // Determine what categories are needed
  const hasDress = canvasCategories.has('Dress')
  const hasTop = canvasCategories.has('Top')
  const hasBottom = canvasCategories.has('Bottom')
  const hasShoes = canvasCategories.has('Shoes')

  const neededCategories: GarmentCategory[] = []
  if (!hasDress && !hasTop) neededCategories.push('Top')
  if (!hasDress && !hasBottom) neededCategories.push('Bottom')
  if (!hasShoes) neededCategories.push('Shoes')
  // Always suggest accessories and outerwear as optional
  if (!canvasCategories.has('Accessory')) neededCategories.push('Accessory')
  if (!canvasCategories.has('Outerwear')) neededCategories.push('Outerwear')

  const scored = available.map((garment) => {
    let score = 0

    // Bonus for being in a needed category
    if (neededCategories.includes(garment.category)) score += 5

    // Extra bonus for required (non-optional) categories
    const requiredMissing: GarmentCategory[] = []
    if (!hasDress && !hasTop) requiredMissing.push('Top')
    if (!hasDress && !hasBottom) requiredMissing.push('Bottom')
    if (!hasShoes) requiredMissing.push('Shoes')
    if (requiredMissing.includes(garment.category)) score += 3

    // Colour harmony with canvas items
    for (const canvasGarment of canvasGarments) {
      const comp = getComplementary(canvasGarment.color_primary)
      if (colourDistance(comp, garment.color_primary) < 30) {
        score += 3
        continue
      }
      const analogous = getAnalogous(canvasGarment.color_primary)
      if (analogous.some((c) => colourDistance(c, garment.color_primary) < 30)) {
        score += 2
      }
    }

    return { garment, score }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((s) => s.garment)
}

// ---------------------------------------------------------------------------
// GarmentPickerItem
// ---------------------------------------------------------------------------

interface GarmentPickerItemProps {
  garment: Garment
  alreadyOnCanvas: boolean
  isRecommended?: boolean
  onSelect: () => void
}

function GarmentPickerItem({ garment, alreadyOnCanvas, isRecommended, onSelect }: GarmentPickerItemProps) {
  return (
    <button
      role="option"
      aria-selected={alreadyOnCanvas}
      disabled={alreadyOnCanvas}
      onClick={onSelect}
      className={[
        'relative flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-brand',
        alreadyOnCanvas
          ? 'border-brand/30 opacity-40 cursor-not-allowed bg-surface'
          : isRecommended
            ? 'border-brand/50 hover:border-brand hover:bg-brand/5 cursor-pointer bg-surface'
            : 'border-border hover:border-brand hover:bg-surface-raised cursor-pointer bg-surface',
      ].join(' ')}
      title={alreadyOnCanvas ? 'Already on canvas' : garment.name}
    >
      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-surface-raised">
        <Image
          src={getThumbUrl(garment.thumb_path)}
          alt={garment.name}
          fill
          sizes="80px"
          className="object-cover"
        />
        {alreadyOnCanvas && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
        {isRecommended && !alreadyOnCanvas && (
          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand flex items-center justify-center">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        )}
      </div>
      <p className="text-[10px] text-foreground truncate w-full text-center leading-tight">
        {garment.name}
      </p>
    </button>
  )
}

// ---------------------------------------------------------------------------
// GarmentPickerModal
// ---------------------------------------------------------------------------

interface GarmentPickerModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GarmentPickerModal({ isOpen, onClose }: GarmentPickerModalProps) {
  const [search, setSearch] = useState('')

  const addToCanvas = useOutfitStore((s) => s.addToCanvas)
  const canvasItems = useOutfitStore((s) => s.canvasItems)

  const { data, isLoading } = useGarments({})
  const garments = useMemo(() => data?.garments ?? [], [data?.garments])

  const filtered = garments.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  )

  const onCanvasIds = new Set(canvasItems.map((item) => item.garment.id))

  // Group by category
  const grouped = useMemo(() => {
    const groups: Partial<Record<GarmentCategory, Garment[]>> = {}
    for (const cat of CATEGORIES) {
      const items = filtered.filter((g) => g.category === cat)
      if (items.length > 0) groups[cat] = items
    }
    return groups
  }, [filtered])

  // Recommendations
  const recommendations = useMemo(
    () => getRecommendations(canvasItems, garments),
    [canvasItems, garments]
  )
  const recommendedIds = new Set(recommendations.map((g) => g.id))

  // Perfect outfit check
  const outfitComplete = isOutfitComplete(canvasItems)
  const harmonyScore = getOutfitHarmonyScore(canvasItems)
  const isPerfect = outfitComplete && harmonyScore >= 1.5

  function handleSelect(garment: Garment) {
    if (onCanvasIds.has(garment.id)) return
    addToCanvas(garment)
    onClose()
    setSearch('')
  }

  function handleClose() {
    onClose()
    setSearch('')
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Garment" className="max-w-sm">
      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search garments..."
          className="w-full px-3 py-2 text-sm bg-surface-raised border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand"
          aria-label="Search garments"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center h-24">
          <p className="text-sm text-muted">
            {search ? 'No garments match your search' : 'Your closet is empty'}
          </p>
        </div>
      ) : (
        <div
          className="max-h-[60vh] overflow-y-auto space-y-4 pr-1"
          role="listbox"
          aria-label="Garment picker"
        >
          {/* Perfect outfit banner */}
          {isPerfect && canvasItems.length > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400 shrink-0" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                Perfect outfit! Add accessories or outerwear to elevate it further.
              </p>
            </div>
          )}

          {/* Outfit incomplete hint */}
          {!outfitComplete && canvasItems.length > 0 && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {(() => {
                  const cats = new Set(canvasItems.map((i) => i.garment.category))
                  const missing: string[] = []
                  if (!cats.has('Dress') && !cats.has('Top')) missing.push('a top')
                  if (!cats.has('Dress') && !cats.has('Bottom')) missing.push('a bottom')
                  if (!cats.has('Shoes')) missing.push('shoes')
                  return missing.length > 0
                    ? `Add ${missing.join(' and ')} to complete your outfit`
                    : 'Keep building your outfit!'
                })()}
              </p>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && !search && !isPerfect && (
            <div>
              <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-2">
                Recommended for you
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {recommendations.map((garment) => (
                  <GarmentPickerItem
                    key={garment.id}
                    garment={garment}
                    alreadyOnCanvas={onCanvasIds.has(garment.id)}
                    isRecommended
                    onSelect={() => handleSelect(garment)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Category sections */}
          {(Object.entries(grouped) as [GarmentCategory, Garment[]][]).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                {category} ({items.length})
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {items.map((garment) => (
                  <GarmentPickerItem
                    key={garment.id}
                    garment={garment}
                    alreadyOnCanvas={onCanvasIds.has(garment.id)}
                    isRecommended={recommendedIds.has(garment.id)}
                    onSelect={() => handleSelect(garment)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
