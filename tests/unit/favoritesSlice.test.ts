import { describe, expect, it } from 'vitest'
import reducer, {
  MAX_FAVORITES,
  addFavorite,
  clearFavorites,
  hydrateFavorites,
  removeFavorite,
  toggleFavorite,
} from '@/features/favorites/favoritesSlice'
import type { MovieItem, NewsItem } from '@/types'

const news: NewsItem = {
  id: 'news:1', type: 'news', title: 'Story', description: '', imageUrl: null,
  url: 'https://x/1', source: 'S', category: 'technology',
  publishedAt: '2026-10-01T00:00:00Z', author: null,
}
const movie: MovieItem = {
  id: 'movie:1', type: 'movie', title: 'Film', description: '', imageUrl: null,
  url: 'https://x/2', source: 'TMDB', category: 'entertainment',
  publishedAt: '2026-10-01T00:00:00Z', rating: 8, releaseDate: '2026-01-01',
  genres: ['Drama'], popularity: 100,
}

const initial = reducer(undefined, { type: '@@INIT' })

describe('favoritesSlice', () => {
  it('adds favorites in insertion order with full snapshots', () => {
    let state = reducer(initial, addFavorite(news))
    state = reducer(state, addFavorite(movie))
    expect(state.ids).toEqual(['news:1', 'movie:1'])
    expect(state.byId['news:1']).toEqual(news) // full ContentItem, not just the id
    expect(state.byId['movie:1']).toEqual(movie)
  })

  it('is idempotent on duplicate adds', () => {
    let state = reducer(initial, addFavorite(news))
    state = reducer(state, addFavorite(news))
    expect(state.ids).toEqual(['news:1'])
  })

  it('toggles on and off', () => {
    let state = reducer(initial, toggleFavorite(news))
    expect(state.ids).toEqual(['news:1'])
    state = reducer(state, toggleFavorite(news))
    expect(state.ids).toEqual([])
    expect(state.byId['news:1']).toBeUndefined()
  })

  it('removes by id and tolerates unknown ids', () => {
    let state = reducer(initial, addFavorite(news))
    state = reducer(state, addFavorite(movie))
    state = reducer(state, removeFavorite('news:1'))
    expect(state.ids).toEqual(['movie:1'])
    state = reducer(state, removeFavorite('news:does-not-exist'))
    expect(state.ids).toEqual(['movie:1'])
  })

  it('updates the snapshot if the same id is added again with new fields', () => {
    const updated: NewsItem = { ...news, title: 'Story (updated)' }
    let state = reducer(initial, addFavorite(news))
    state = reducer(state, addFavorite(updated))
    expect(state.byId['news:1'].title).toBe('Story (updated)')
    expect(state.ids).toEqual(['news:1'])
  })

  it('clears everything and rehydrates', () => {
    let state = reducer(initial, addFavorite(news))
    state = reducer(state, clearFavorites())
    expect(state).toEqual(initial)

    const persisted = { byId: { 'movie:1': movie }, ids: ['movie:1'] }
    expect(reducer(initial, hydrateFavorites(persisted))).toEqual(persisted)
  })

  it('refuses new favorites at the cap while updates still work', () => {
    let state = initial
    for (let i = 0; i < MAX_FAVORITES; i += 1) {
      state = reducer(state, addFavorite({ ...news, id: `news:${i}` }))
    }
    expect(state.ids).toHaveLength(MAX_FAVORITES)

    state = reducer(state, addFavorite({ ...news, id: 'news:overflow' }))
    expect(state.ids).toHaveLength(MAX_FAVORITES)
    expect(state.byId['news:overflow']).toBeUndefined()

    state = reducer(state, addFavorite({ ...news, id: 'news:0', title: 'Refreshed' }))
    expect(state.byId['news:0'].title).toBe('Refreshed')
    expect(state.ids).toHaveLength(MAX_FAVORITES)
  })

  it('caps oversized rehydrated payloads', () => {
    const ids = Array.from({ length: MAX_FAVORITES + 10 }, (_, i) => `n${i}`)
    const byId = Object.fromEntries(ids.map((id) => [id, { ...news, id }]))
    const state = reducer(initial, hydrateFavorites({ byId, ids }))
    expect(state.ids).toHaveLength(MAX_FAVORITES)
    expect(Object.keys(state.byId)).toHaveLength(MAX_FAVORITES)
  })
})
