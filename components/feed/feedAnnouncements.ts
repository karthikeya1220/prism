import type { Announcements } from '@dnd-kit/core'
import type { ContentItem } from '@/types'
import i18n from '@/lib/i18n'

/** Signature shared by `t` and the module-level default translator. */
export type Translator = (
  key: string,
  vars?: Record<string, string | number>,
) => string

/** Speaks in the current interface language (English until initialized). */
const defaultTr: Translator = (key, vars) =>
  i18n.t(key, vars as never) as unknown as string

/**
 * Screen-reader announcements for the feed grid (M8), localized through the
 * `common:dnd` table. Every step of a drag — pickup, move over a position,
 * drop, cancel — is spoken; the "over self" collision right after pickup
 * returns `undefined` so it never overwrites the pickup message.
 */
export function buildAnnouncements(
  items: ContentItem[],
  tr: Translator = defaultTr,
): Announcements {
  const ids = items.map((item) => item.id)
  const titleOf = (id: unknown) =>
    items.find((item) => item.id === id)?.title ?? tr('dnd.card')
  const positionOf = (id: unknown) => ids.indexOf(String(id)) + 1

  return {
    onDragStart: ({ active }) =>
      tr('dnd.pickedUp', {
        title: titleOf(active.id),
        n: positionOf(active.id),
        total: ids.length,
      }),
    onDragOver: ({ active, over }) =>
      over && over.id !== active.id
        ? tr('dnd.movedOver', {
            title: titleOf(active.id),
            n: positionOf(over.id),
          })
        : undefined,
    onDragEnd: ({ active, over }) =>
      over && active.id !== over.id
        ? tr('dnd.dropped', {
            title: titleOf(active.id),
            n: positionOf(over.id),
            total: ids.length,
          })
        : tr('dnd.returned', {
            title: titleOf(active.id),
            n: positionOf(active.id),
          }),
    onDragCancel: ({ active }) =>
      tr('dnd.cancelled', {
        title: titleOf(active.id),
        n: positionOf(active.id),
      }),
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
