'use client'

import { useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { RotateCcw } from 'lucide-react'
import { buildAnnouncements, getIndicator } from '@/components/feed/feedAnnouncements'
import { renderCard } from '@/components/feed/renderCard'
import SortableCard from '@/components/feed/SortableCard'
import type { ContentItem } from '@/types'

export interface SortableFeedGridProps {
  /** Display order — the manual order has already been applied. */
  items: ContentItem[]
  /** Accessible name for the list. */
  label: string
  isFavorite: (id: string) => boolean
  onToggleFavorite: (item: ContentItem) => void
  /** Commit a completed drag: the new full id sequence. */
  onReorder: (ids: string[]) => void
  /** Show the "Reset order" control (a manual order exists). */
  showReset?: boolean
  onReset?: () => void
}

/**
 * Drag-and-drop feed grid (M8): pointer, touch, and keyboard sensors —
 * Space picks a card up, arrow keys move it, Space drops it, Escape cancels
 * — with screen-reader announcements for every step, a DragOverlay ghost
 * (drop animation), and an accent insertion line on the drop-target edge.
 * All activators live on each card's grip handle so CTA/favorite clicks
 * are never swallowed.
 */
export function SortableFeedGrid({
  items,
  label,
  isFavorite,
  onToggleFavorite,
  onReorder,
  showReset = false,
  onReset,
}: SortableFeedGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const reduce = useReducedMotion()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const ids = items.map((item) => item.id)
  const announcements = buildAnnouncements(items)

  const handleStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id))
  }
  const handleOver = ({ over }: DragOverEvent) => {
    setOverId(over ? String(over.id) : null)
  }
  const handleEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      const from = ids.indexOf(String(active.id))
      const to = ids.indexOf(String(over.id))
      if (from !== -1 && to !== -1) onReorder(arrayMove(ids, from, to))
    }
    setActiveId(null)
    setOverId(null)
  }
  const handleCancel = () => {
    setActiveId(null)
    setOverId(null)
  }

  const activeItem = items.find((item) => item.id === activeId) ?? null
  const indicator = getIndicator(items, activeId, overId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            'Space to pick up the card. Arrow keys to move it. Space to drop. Escape to cancel.',
        },
      }}
      onDragStart={handleStart}
      onDragOver={handleOver}
      onDragEnd={handleEnd}
      onDragCancel={handleCancel}
    >
      {showReset && onReset && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onReset}
            className="mb-3 inline-flex items-center gap-1.5 rounded-control border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <RotateCcw size={13} aria-hidden="true" />
            Reset order
          </button>
        </div>
      )}
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <ul aria-label={label} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <SortableCard
              key={item.id}
              item={item}
              isFavorite={isFavorite}
              onToggleFavorite={onToggleFavorite}
              indicator={indicator?.id === item.id ? indicator.side : null}
            />
          ))}
        </ul>
      </SortableContext>
      <DragOverlay
        dropAnimation={reduce ? null : { duration: 180, easing: 'ease-out' }}
      >
        {activeItem ? (
          // The overlay wrapper mirrors the lifted card's rect (width/height);
          // the clone inside just fills it.
          <div
            aria-hidden="true"
            className="rotate-[1.5deg] scale-[1.03] shadow-pop"
          >
            {renderCard(activeItem, isFavorite, onToggleFavorite)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default SortableFeedGrid
