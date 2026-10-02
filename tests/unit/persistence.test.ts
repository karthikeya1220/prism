/**
 * Persistence tests (PLAN.md §3/§7): debounced whitelist writes, payload
 * versioning/sanitization, and post-mount rehydration through a real store —
 * the same wiring Providers uses in the browser.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeStore } from '@/store'
import { STORAGE_KEY, hydrateFromStorage, loadPersistedState } from '@/store/persistence'
import { setDarkMode, toggleCategory } from '@/features/preferences/preferencesSlice'
import { addFavorite } from '@/features/favorites/favoritesSlice'
import { setSectionOrder } from '@/features/layout/layoutSlice'
import type { NewsItem } from '@/types'

const news: NewsItem = {
  id: 'news:1', type: 'news', title: 'S', description: '', imageUrl: null,
  url: 'https://x', source: 'S', category: 'technology',
  publishedAt: '2026-10-01T00:00:00Z', author: null,
}

const validPayload = () => ({
  version: 1,
  preferences: { categories: ['finance'], darkMode: true, language: 'de' },
  favorites: { byId: { 'news:1': news }, ids: ['news:1'] },
  layout: { manualOrder: { feed: ['social:2'], favorites: [], trending: [] } },
})

/** Read the persisted payload; throws when nothing was written. */
function readStored(): Record<string, unknown> {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) throw new Error('expected a persisted payload in localStorage')
  return JSON.parse(raw) as Record<string, unknown>
}

describe('persistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('writes whitelisted slice state debounced to localStorage', async () => {
    const store = makeStore()

    store.dispatch(toggleCategory('sports'))
    store.dispatch(addFavorite(news))
    store.dispatch(setDarkMode(true))
    store.dispatch(setSectionOrder({ section: 'feed', ids: ['news:1'] }))

    // Not written before the debounce window elapses.
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    await vi.advanceTimersByTimeAsync(300)

    const stored = readStored()
    expect(stored.version).toBe(1)
    const prefs = stored.preferences as { categories: string[]; darkMode: boolean }
    expect(prefs.categories).toEqual(['technology', 'entertainment', 'sports'])
    expect(prefs.darkMode).toBe(true)
    expect((stored.favorites as { ids: string[] }).ids).toEqual(['news:1'])
    expect((stored.layout as { manualOrder: { feed: string[] } }).manualOrder.feed).toEqual([
      'news:1',
    ])
  })

  it('coalesces rapid dispatches into a single write', async () => {
    // jsdom's Storage is a Proxy — spy on the prototype so calls are visible.
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const store = makeStore()

    store.dispatch(setDarkMode(true))
    store.dispatch(setDarkMode(false))
    store.dispatch(setDarkMode(true))
    await vi.advanceTimersByTimeAsync(300)

    expect(setItem).toHaveBeenCalledTimes(1)
  })

  it('rehydrates a valid payload and rejects corrupt or foreign ones', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(validPayload()))
    expect(loadPersistedState()?.preferences?.darkMode).toBe(true)

    window.localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadPersistedState()).toBeUndefined()

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99 }))
    expect(loadPersistedState()).toBeUndefined()

    // No slice is salvageable → the whole payload is discarded.
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, preferences: { categories: 'nope' } }),
    )
    expect(loadPersistedState()).toBeUndefined()
  })

  it('keeps valid slices when others are malformed', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        preferences: { categories: 'nope' },
        favorites: { byId: { 'news:1': news }, ids: ['news:1'] },
        layout: { manualOrder: { feed: ['a'], favorites: [], trending: [] } },
      }),
    )
    const persisted = loadPersistedState()
    expect(persisted?.preferences).toBeUndefined()
    expect(persisted?.favorites?.ids).toEqual(['news:1'])
    expect(persisted?.layout?.manualOrder.feed).toEqual(['a'])
  })

  it('dedupes favorite ids, drops orphans, and recovers unreferenced snapshots', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        favorites: {
          byId: {
            'news:1': news,
            'news:orphan': { ...news, id: 'news:orphan' },
            // snapshot id disagrees with its key → inconsistent, dropped
            'news:mismatch': { ...news, id: 'news:other' },
          },
          ids: ['news:1', 'news:1', 'news:missing'],
        },
      }),
    )
    const favorites = loadPersistedState()?.favorites
    expect(favorites?.ids).toEqual(['news:1', 'news:orphan'])
    expect(Object.keys(favorites?.byId ?? {})).toEqual(['news:1', 'news:orphan'])
  })

  it('hydrates a fresh store after creation without writing back', async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(validPayload()))
    const store = makeStore()

    // Defaults first (SSR markup and first client render match)…
    expect(store.getState().preferences.darkMode).toBe(false)
    expect(store.getState().favorites.ids).toEqual([])

    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const persisted = hydrateFromStorage(store.dispatch)

    // …then the persisted state is applied in the mount effect.
    expect(persisted?.preferences?.darkMode).toBe(true)
    expect(store.getState().preferences.darkMode).toBe(true)
    expect(store.getState().preferences.language).toBe('de')
    expect(store.getState().favorites.ids).toEqual(['news:1'])
    expect(store.getState().layout.manualOrder.feed).toEqual(['social:2'])

    await vi.advanceTimersByTimeAsync(300)
    expect(setItem).not.toHaveBeenCalled() // hydrate actions are the storage data
  })

  it('is a no-op when storage is empty', () => {
    const store = makeStore()
    expect(hydrateFromStorage(store.dispatch)).toBeUndefined()
    expect(store.getState().preferences.categories).toEqual(['technology', 'entertainment'])
  })

  it('survives a throwing localStorage (private mode)', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })
    const store = makeStore()
    expect(() => store.dispatch(setDarkMode(true))).not.toThrow()
    await vi.advanceTimersByTimeAsync(300)
  })
})
