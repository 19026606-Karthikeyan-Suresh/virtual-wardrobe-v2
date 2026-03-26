'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useOutfitStore, type CanvasItem } from '@/stores/outfitStore'

// ---------------------------------------------------------------------------
// Supabase browser client (module-level singleton)
// ---------------------------------------------------------------------------
const supabase = createClient()

function getThumbUrl(thumbPath: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from('garments')
    .getPublicUrl(thumbPath)
  return `${publicUrl}?width=80&height=80&resize=cover`
}

// ---------------------------------------------------------------------------
// Single sortable row
// ---------------------------------------------------------------------------
interface SortableRowProps {
  item: CanvasItem
  onRemove: (garmentId: string) => void
}

function SortableRow({ item, onRemove }: SortableRowProps) {
  const {
    setNodeRef,
    listeners,
    attributes,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.garment.id })

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  const thumbUrl = getThumbUrl(item.garment.thumb_path)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-xl"
    >
      {/* Drag handle */}
      <button
        className="touch-none p-1 text-muted hover:text-foreground cursor-grab active:cursor-grabbing focus:outline-none focus:ring-1 focus:ring-brand rounded"
        aria-label={`Drag ${item.garment.name} to reorder`}
        {...listeners}
        {...attributes}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
          <circle cx="4" cy="3" r="1.2" />
          <circle cx="10" cy="3" r="1.2" />
          <circle cx="4" cy="7" r="1.2" />
          <circle cx="10" cy="7" r="1.2" />
          <circle cx="4" cy="11" r="1.2" />
          <circle cx="10" cy="11" r="1.2" />
        </svg>
      </button>

      {/* Thumbnail */}
      <div className="relative w-8 h-8 rounded-md overflow-hidden bg-surface-raised shrink-0">
        <Image
          src={thumbUrl}
          alt={item.garment.name}
          fill
          sizes="32px"
          className="object-cover"
        />
      </div>

      {/* Name */}
      <p className="flex-1 text-xs font-medium text-foreground truncate">
        {item.garment.name}
      </p>

      {/* Layer badge */}
      <span className="text-[10px] text-muted shrink-0">
        L{item.position + 1}
      </span>

      {/* Remove */}
      <button
        onClick={() => onRemove(item.garment.id)}
        aria-label={`Remove ${item.garment.name} from canvas`}
        className="p-1 rounded-md text-muted hover:text-red-500 hover:bg-surface-raised transition-colors focus:outline-none focus:ring-1 focus:ring-brand"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M2 2l8 8M10 2l-8 8" />
        </svg>
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// LayerPanel — exported component
// ---------------------------------------------------------------------------
export function LayerPanel() {
  const canvasItems = useOutfitStore((s) => s.canvasItems)
  const removeFromCanvas = useOutfitStore((s) => s.removeFromCanvas)
  const reorderLayers = useOutfitStore((s) => s.reorderLayers)

  // Sort bottom-to-top so the list reads "layer 1 at top = topmost visually"
  const sorted = [...canvasItems].sort((a, b) => b.position - a.position)
  const ids = sorted.map((item) => item.garment.id)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      reorderLayers(String(active.id), String(over.id))
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-muted uppercase tracking-wide px-1">
        Layers
      </p>

      {sorted.length === 0 ? (
        <div className="flex items-center justify-center h-20 border border-dashed border-border rounded-xl">
          <p className="text-xs text-muted">No garments yet</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-1.5">
              <AnimatePresence initial={false}>
                {sorted.map((item) => (
                  <motion.div
                    key={item.garment.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <SortableRow item={item} onRemove={removeFromCanvas} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
