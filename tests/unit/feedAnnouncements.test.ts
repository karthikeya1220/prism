/**
 * Announcements + drop-indicator helpers for the feed grid (M8): the pickup
 * message must survive dnd-kit's "over self" collision right after pickup
 * (returns undefined), and the insertion line flips sides depending on
 * whether the lift is moving up or down the list.
 */
import { describe, expect, it } from 'vitest'
import type { Active, Over } from '@dnd-kit/core'
import {
  buildAnnouncements,
  getIndicator,
} from '@/components/feed/feedAnnouncements'
import type { ContentItem } from '@/types'

const items = [
  { id: 'a', title: 'Alpha' },
  { id: 'b', title: 'Beta' },
  { id: 'c', title: 'Gamma' },
] as ContentItem[]

const clientRect: ClientRect = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: 0,
  height: 0,
  x: 0,
  y: 0,
  toJSON: () => ({}),
}
const active = (id: string): Active => ({
  id,
  data: { current: undefined },
  rect: { current: { initial: null, translated: null } },
})
const over = (id: string | null): Over | null =>
  id ? { id, data: { current: undefined }, rect: clientRect, disabled: false } : null

describe('buildAnnouncements', () => {
  const announcements = buildAnnouncements(items)

  it('announces pickup with position and count', () => {
    expect(announcements.onDragStart({ active: active('b') })).toBe(
      'Picked up card Beta, position 2 of 3.',
    )
  })

  it('stays silent when the card hovers over itself (keeps pickup message)', () => {
    expect(
      announcements.onDragOver({ active: active('a'), over: over('a') }),
    ).toBeUndefined()
    expect(announcements.onDragOver({ active: active('a'), over: null })).toBeUndefined()
  })

  it('announces moving over a new position', () => {
    expect(
      announcements.onDragOver({ active: active('a'), over: over('c') }),
    ).toBe('Card Alpha moved over position 3.')
  })

  it('announces the drop position', () => {
    expect(announcements.onDragEnd({ active: active('a'), over: over('c') })).toBe(
      'Card Alpha dropped at position 3 of 3.',
    )
  })

  it('announces a drop back on itself as returned', () => {
    expect(announcements.onDragEnd({ active: active('a'), over: over('a') })).toBe(
      'Card Alpha returned to position 1.',
    )
  })

  it('announces cancellation', () => {
    expect(
      announcements.onDragCancel({ active: active('b'), over: null }),
    ).toBe('Dragging cancelled. Card Beta returned to position 2.')
  })
})

describe('getIndicator', () => {
  it('shows the bottom edge when moving down', () => {
    expect(getIndicator(items, 'a', 'b')).toEqual({ id: 'b', side: 'bottom' })
    expect(getIndicator(items, 'a', 'c')).toEqual({ id: 'c', side: 'bottom' })
  })

  it('shows the top edge when moving up', () => {
    expect(getIndicator(items, 'c', 'a')).toEqual({ id: 'a', side: 'top' })
  })

  it('is hidden without an active drag or when over itself', () => {
    expect(getIndicator(items, null, 'b')).toBeNull()
    expect(getIndicator(items, 'a', null)).toBeNull()
    expect(getIndicator(items, 'a', 'a')).toBeNull()
    expect(getIndicator(items, 'ghost', 'b')).toBeNull()
  })
})
