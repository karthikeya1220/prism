import type { Announcements } from '@dnd-kit/core'
import type { ContentItem } from '@/types'

/**
 * Screen-reader announcements for the feed grid (M8). Every step of a drag —
 * pickup, move over a position, drop, cancel — is spoken; the "over self"
 * collision right after pickup returns `undefined` so it never overwrites
 * the pickup message.
 */
export function buildAnnouncements(items: ContentItem[]): Announcements {
  const ids = items.map((item) => item.id)
  const titleOf = (id: unknown) =>
    items.find((item) => item.id === id)?.title ?? 'card'
  const positionOf = (id: unknown) => ids.indexOf(String(id)) + 1

  return {
    onDragStart: ({ active }) =>
      `Picked up card ${titleOf(active.id)}, position ${positionOf(active.id)} of ${ids.length}.`,
    onDragOver: ({ active, over }) =>
      over && over.id !== active.id
        ? `Card ${titleOf(active.id)} moved over position ${positionOf(over.id)}.`
        : undefined,
    onDragEnd: ({ active, over }) =>
      over && active.id !== over.id
        ? `Card ${titleOf(active.id)} dropped at position ${positionOf(over.id)} of ${ids.length}.`
        : `Card ${titleOf(active.id)} returned to position ${positionOf(active.id)}.`,
    onDragCancel: ({ active }) =>
      `Dragging cancelled. Card ${titleOf(active.id)} returned to position ${positionOf(active.id)}.`,
  }
}

export type IndicatorSide = 'top' | 'bottom'

/**
 * The insertion-edge line for the current drop target: which side of `overId`
 * the lifted card would land on (`null` when nothing valid is hovered).
 */
export function getIndicator(
  items: ContentItem[],
  activeId: string | null,
  overId: string | null,
): { id: string; side: IndicatorSide } | null {
  if (!activeId || !overId || activeId === overId) return null
  const ids = items.map((item) => item.id)
  const activeIndex = ids.indexOf(activeId)
  const overIndex = ids.indexOf(overId)
  if (activeIndex === -1 || overIndex === -1) return null
  return { id: overId, side: activeIndex > overIndex ? 'top' : 'bottom' }
}
