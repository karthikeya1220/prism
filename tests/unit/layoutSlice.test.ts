import { describe, expect, it } from 'vitest'
import reducer, {
  hydrateLayout,
  resetSectionOrder,
  setSectionOrder,
} from '@/features/layout/layoutSlice'

const initial = reducer(undefined, { type: '@@INIT' })

describe('layoutSlice', () => {
  it('stores manual order per section', () => {
    let state = reducer(initial, setSectionOrder({ section: 'feed', ids: ['social:2', 'news:1'] }))
    state = reducer(state, setSectionOrder({ section: 'favorites', ids: ['movie:9'] }))
    expect(state.manualOrder.feed).toEqual(['social:2', 'news:1'])
    expect(state.manualOrder.favorites).toEqual(['movie:9'])
    expect(state.manualOrder.trending).toEqual([])
  })

  it('replaces (not appends) order on repeated drags', () => {
    let state = reducer(initial, setSectionOrder({ section: 'feed', ids: ['a'] }))
    state = reducer(state, setSectionOrder({ section: 'feed', ids: ['b', 'a'] }))
    expect(state.manualOrder.feed).toEqual(['b', 'a'])
  })

  it('caps manual order length to bound persistence size', () => {
    const ids = Array.from({ length: 500 }, (_, i) => `id:${i}`)
    const state = reducer(initial, setSectionOrder({ section: 'feed', ids }))
    expect(state.manualOrder.feed.length).toBe(200)
  })

  it('resets a single section and rehydrates', () => {
    let state = reducer(initial, setSectionOrder({ section: 'feed', ids: ['a', 'b'] }))
    state = reducer(state, resetSectionOrder('feed'))
    expect(state.manualOrder.feed).toEqual([])

    const persisted = { manualOrder: { feed: ['x'], favorites: ['y'], trending: [] } }
    expect(reducer(initial, hydrateLayout(persisted))).toEqual(persisted)
  })
})
