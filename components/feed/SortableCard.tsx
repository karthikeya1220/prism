'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { ContentItem } from '@/types'
import { renderCard } from '@/components/feed/renderCard'

export interface SortableCardProps {
  item: ContentItem
  isFavorite: (id: string) => boolean
  onToggleFavorite: (item: ContentItem) => void
  /** Insertion edge shown while this card is the drop target. */
  indicator?: 'top' | 'bottom' | null
}

/**
 * One draggable feed card (M8). All drag activators (pointer, touch,
 * keyboard) live on the dedicated grip handle, so clicking the card's CTA
 * link or favorite button can never start a drag. The lifted card fades to
 * a ghost while the DragOverlay clone flies; a 4px accent line marks the
 * insertion edge when this card is the drop target.
 */
export function SortableCard({
  item,
  isFavorite,
  onToggleFavorite,
  indicator = null,
}: SortableCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  return (
    <li
      ref={setNodeRef}
      data-feed-id={item.id}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`relative flex transition-opacity duration-150 ${isDragging ? 'opacity-40' : ''}`}
    >
      {indicator && (
        <span
          aria-hidden="true"
          className={`absolute left-2 right-2 z-20 h-1 rounded-full bg-accent shadow-card ${
            indicator === 'top' ? '-top-1' : '-bottom-1'
          }`}
        />
      )}
      <div className="relative w-full">
        {renderCard(item, isFavorite, onToggleFavorite)}
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Reorder ${item.title}`}
          {...attributes}
          {...listeners}
          className="absolute right-2 top-2 z-10 cursor-grab touch-none rounded-control border border-line/70 bg-surface/90 p-1.5 text-ink-soft shadow-card backdrop-blur-sm transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing"
        >
          <GripVertical size={14} aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}

export default SortableCard
