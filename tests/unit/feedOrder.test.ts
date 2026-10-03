/**
 * Manual feed-order logic (M8): the pure reconciliation the hook shares —
 * saved ids keep their slots, new arrivals append, stale ids vanish, and
 * nothing is ever duplicated. Complements the reducer tests in
 * layoutSlice.test.ts (setSectionOrder / resetSectionOrder / cap).
 */
import { describe, expect, it } from 'vitest'
import { applyFeedOrder, sameIds } from '@/features/feed/feedOrder'

const item = (id: string) => ({ id })

describe('applyFeedOrder', () => {
  const natural = [item('a'), item('b'), item('c')]

  it('returns natural order when nothing was saved', () => {
    expect(applyFeedOrder(natural, [])).toEqual(natural)
  })

  it('applies the saved order for ids that are still loaded', () => {
    expect(applyFeedOrder(natural, ['c', 'a', 'b']).map((i) => i.id)).toEqual([
      'c', 'a', 'b',
    ])
  })

  it('appends items loaded later (infinite scroll) after the saved ids', () => {
    const more = [item('a'), item('b'), item('c'), item('d'), item('e')]
    // User dragged c first; d and e arrive on the next page.
    expect(applyFeedOrder(more, ['c', 'a', 'b']).map((i) => i.id)).toEqual([
      'c', 'a', 'b', 'd', 'e',
    ])
  })

  it('drops saved ids that no longer load (topic switch)', () => {
    const changed = [item('x'), item('y')]
    expect(applyFeedOrder(changed, ['a', 'b']).map((i) => i.id)).toEqual(['x', 'y'])
  })

  it('never duplicates an item when saved order repeats ids', () => {
    expect(applyFeedOrder(natural, ['b', 'b', 'a']).map((i) => i.id)).toEqual([
      'b', 'a', 'c',
    ])
  })

  it('leaves an empty item list untouched', () => {
    expect(applyFeedOrder([], ['a'])).toEqual([])
  })
})

describe('sameIds', () => {
  it('compares length and order', () => {
    expect(sameIds(['a', 'b'], ['a', 'b'])).toBe(true)
    expect(sameIds(['a', 'b'], ['b', 'a'])).toBe(false)
    expect(sameIds(['a'], ['a', 'b'])).toBe(false)
  })
})
