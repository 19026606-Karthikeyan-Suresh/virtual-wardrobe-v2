'use client'

import { useRef, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  type DragEndEvent,
} from '@dnd-kit/core'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { LayerPanel } from './LayerPanel'
import { GarmentPickerModal } from './GarmentPickerModal'
import { SaveOutfitModal } from './SaveOutfitModal'
import { useOutfitStore, type CanvasItem } from '@/stores/outfitStore'
import { colourDistance, getComplementary, getAnalogous } from '@/lib/colour-theory'

const supabase = createClient()

function getThumbUrl(thumbPath: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from('garments')
    .getPublicUrl(thumbPath)
  return `${publicUrl}?width=240&height=320&resize=cover`
}

// ---------------------------------------------------------------------------
// Individual draggable garment on the canvas
// ---------------------------------------------------------------------------
interface DraggableGarmentProps {
  item: CanvasItem
}

function DraggableGarment({ item }: DraggableGarmentProps) {
  const { setNodeRef, listeners, attributes, transform, isDragging } = useDraggable({
    id: item.garment.id,
  })

  const thumbUrl = getThumbUrl(item.garment.thumb_path)

  // Combine dnd-kit's live drag transform with the stored percentage position.
  // Using a plain div avoids type conflicts between dnd-kit listeners and
  // Framer Motion's onDrag prop.
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${item.x}%`,
    top: `${item.y}%`,
    zIndex: item.position + 1,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.8 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
    transition: isDragging ? undefined : 'opacity 0.15s',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="select-none"
    >
      <div className="relative w-24 h-32 rounded-xl overflow-hidden shadow-lg ring-1 ring-black/10">
        <Image
          src={thumbUrl}
          alt={item.garment.name}
          fill
          sizes="96px"
          className="object-cover"
          draggable={false}
        />
      </div>
      <p className="mt-1 text-[10px] text-center text-foreground/70 truncate w-24 leading-tight">
        {item.garment.name}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Outfit completeness helpers
// ---------------------------------------------------------------------------

function isOutfitComplete(items: CanvasItem[]): boolean {
  const cats = new Set(items.map((i) => i.garment.category))
  return cats.has('Shoes') && (cats.has('Dress') || (cats.has('Top') && cats.has('Bottom')))
}

function getHarmonyScore(items: CanvasItem[]): number {
  if (items.length < 2) return 0
  let total = 0
  let pairs = 0
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const hex1 = items[i].garment.color_primary
      const hex2 = items[j].garment.color_primary
      const comp = getComplementary(hex1)
      if (colourDistance(comp, hex2) < 30) { total += 3; pairs++; continue }
      const ana = getAnalogous(hex1)
      if (ana.some((c) => colourDistance(c, hex2) < 30)) { total += 2; pairs++; continue }
      pairs++
    }
  }
  return pairs > 0 ? total / pairs : 0
}

// ---------------------------------------------------------------------------
// Main LookbookCanvas component
// ---------------------------------------------------------------------------
export function LookbookCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [showSave, setShowSave] = useState(false)

  const canvasItems = useOutfitStore((s) => s.canvasItems)
  const moveItem = useOutfitStore((s) => s.moveItem)
  const clearCanvas = useOutfitStore((s) => s.clearCanvas)

  const complete = isOutfitComplete(canvasItems)
  const harmonyScore = getHarmonyScore(canvasItems)
  const isPerfect = complete && harmonyScore >= 1.5

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor)
  )

  function handleCanvasDragEnd(event: DragEndEvent) {
    const { active, delta } = event
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const item = canvasItems.find((c) => c.garment.id === String(active.id))
    if (!item) return

    const deltaXPct = (delta.x / rect.width) * 100
    const deltaYPct = (delta.y / rect.height) * 100

    moveItem(String(active.id), item.x + deltaXPct, item.y + deltaYPct)
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowPicker(true)}
          aria-label="Add garment to canvas"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add garment
        </Button>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCanvas}
            disabled={canvasItems.length === 0}
            aria-label="Clear all garments from canvas"
          >
            Clear
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowSave(true)}
            disabled={canvasItems.length === 0}
            aria-label="Save outfit"
          >
            Save outfit
          </Button>
        </div>
      </div>

      {/* Outfit status banner */}
      {canvasItems.length > 0 && (
        isPerfect ? (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400 shrink-0" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              Perfect outfit! Great colour harmony.
            </p>
          </div>
        ) : !complete ? (
          <div className="flex items-center gap-2 p-2.5 mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
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
        ) : null
      )}

      {/* Canvas + Layer panel */}
      <div className="flex gap-4 items-start">
        {/* Canvas area */}
        <DndContext sensors={sensors} onDragEnd={handleCanvasDragEnd}>
          <div
            ref={canvasRef}
            className="flex-1 relative bg-surface-raised rounded-2xl border-2 border-dashed border-border overflow-hidden"
            style={{ aspectRatio: '4/5', minHeight: 400 }}
            aria-label="Outfit canvas — drag garments to position them"
          >
            {canvasItems.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none select-none">
                <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="9" rx="1" />
                    <rect x="14" y="3" width="7" height="5" rx="1" />
                    <rect x="14" y="12" width="7" height="9" rx="1" />
                    <rect x="3" y="16" width="7" height="5" rx="1" />
                  </svg>
                </div>
                <p className="text-sm text-muted">Add garments to get started</p>
              </div>
            )}

            {canvasItems.map((item) => (
              <DraggableGarment key={item.garment.id} item={item} />
            ))}
          </div>
        </DndContext>

        {/* Layer panel sidebar */}
        <div className="w-56 shrink-0">
          <LayerPanel />
        </div>
      </div>

      {/* Modals */}
      <GarmentPickerModal isOpen={showPicker} onClose={() => setShowPicker(false)} />
      <SaveOutfitModal isOpen={showSave} onClose={() => setShowSave(false)} />
    </>
  )
}
