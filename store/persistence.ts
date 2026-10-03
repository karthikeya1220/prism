/**
 * Persistence for client-state slices (PLAN.md §3/§7):
 *
 * - A listener middleware whitelists preferences/favorites/layout and
 *   debounces writes to localStorage['pcd:state:v1'] (single versioned payload).
 * - `hydrateFromStorage` rehydrates *after mount* (called from Providers' effect),
 *   so server-rendered markup and the first client render both use slice
 *   defaults — no hydration mismatch. Theme flash is handled separately by the
 *   pre-hydration script (M4).
 * - Every storage touch and payload parse is guarded: SSR, private-mode
 *   browsers, and corrupt/foreign payloads can never crash the app.
 */
import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import {
  DEFAULT_CATEGORIES,
  hydratePreferences,
  markHydrated,
  markOnboarded,
  resetPreferences,
  setDarkMode,
  setLanguage,
  toggleCategory,
  type PersistedPreferences,
  type PreferencesState,
} from '@/features/preferences/preferencesSlice'
import {
  addFavorite,
  clearFavorites,
  hydrateFavorites,
  removeFavorite,
  toggleFavorite,
  type FavoritesState,
} from '@/features/favorites/favoritesSlice'
import {
  hydrateLayout,
  resetSectionOrder,
  setSectionOrder,
  type LayoutState,
} from '@/features/layout/layoutSlice'
import { isCategory, isContentItem, type Category, type ContentItem } from '@/types'
import type { AppDispatch } from './index'

export const STORAGE_KEY = 'pcd:state:v1'
const WRITE_DEBOUNCE_MS = 250
const MAX_PERSISTED_IDS = 200

/** Validated slice payloads recovered from storage (any slice may be absent). */
export interface PersistedState {
  preferences?: PersistedPreferences
  favorites?: FavoritesState
  layout?: LayoutState
}

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

/** Debounced writer — one timer shared across rapid dispatches. */
function createWriter() {
  let timer: ReturnType<typeof setTimeout> | null = null
  let latest: PersistedState | null = null
  return (state: PersistedState) => {
    latest = state
    if (timer) return
    timer = setTimeout(() => {
      timer = null
      if (!latest) return
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...latest }))
      } catch {
        // Quota errors / private mode: persistence is best-effort by design.
      }
    }, WRITE_DEBOUNCE_MS)
  }
}

function sanitizePreferences(value: unknown): PersistedPreferences | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Partial<PreferencesState>
  if (!Array.isArray(v.categories)) return null
  const categories = v.categories.filter(
    (c): c is Category => typeof c === 'string' && isCategory(c),
  )
  return {
    // The feed needs a topic: fall back when the payload ends up empty.
    categories: categories.length > 0 ? categories : [...DEFAULT_CATEGORIES],
    darkMode: typeof v.darkMode === 'boolean' ? v.darkMode : false,
    language: v.language === 'de' ? 'de' : 'en',
    onboarded: v.onboarded === true,
  }
}

function sanitizeFavorites(value: unknown): FavoritesState | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Partial<FavoritesState>
  if (!v.byId || typeof v.byId !== 'object') return null
  const source = v.byId as Record<string, unknown>
  const ids = (Array.isArray(v.ids) ? v.ids : []).filter(
    (id): id is string => typeof id === 'string',
  )

  const byId: Record<string, ContentItem> = {}
  const ordered: string[] = []
  for (const id of ids) {
    const item = source[id]
    if (isContentItem(item) && item.id === id && !(id in byId)) {
      byId[id] = item
      ordered.push(id)
    }
  }
  // Recover snapshots whose id is missing from the ids array (partial writes).
  for (const [id, item] of Object.entries(source)) {
    if (!(id in byId) && isContentItem(item) && item.id === id) {
      byId[id] = item
      ordered.push(id)
    }
  }
  return { byId, ids: ordered.slice(0, MAX_PERSISTED_IDS) }
}

function sanitizeLayout(value: unknown): LayoutState | null {
  if (!value || typeof value !== 'object') return null
  const v = (value as Partial<LayoutState>).manualOrder
  if (!v || typeof v !== 'object') return null
  const pick = (input: unknown): string[] =>
    Array.isArray(input)
      ? input.filter((id): id is string => typeof id === 'string').slice(0, MAX_PERSISTED_IDS)
      : []
  return {
    manualOrder: {
      feed: pick(v.feed),
      favorites: pick(v.favorites),
      trending: pick(v.trending),
    },
  }
}

/** Rehydrate persisted slices; silently ignores corrupt/foreign payloads. */
export function loadPersistedState(): PersistedState | undefined {
  if (!hasLocalStorage()) return undefined
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const parsed: unknown = JSON.parse(raw)
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      (parsed as { version?: unknown }).version !== 1
    ) {
      return undefined
    }
    const payload = parsed as Record<string, unknown>
    const preferences = sanitizePreferences(payload.preferences)
    const favorites = sanitizeFavorites(payload.favorites)
    const layout = sanitizeLayout(payload.layout)
    if (!preferences && !favorites && !layout) return undefined
    return {
      ...(preferences ? { preferences } : {}),
      ...(favorites ? { favorites } : {}),
      ...(layout ? { layout } : {}),
    }
  } catch {
    return undefined
  }
}

/**
 * Apply persisted slices to a freshly created store. Call once on mount from
 * Providers — never during render, so SSR and hydration stay in sync.
 * Hydrate actions are excluded from the write whitelist (they ARE the data).
 * Always finishes by marking the store hydrated — even with empty storage —
 * so gated UI (onboarding, feed queries) releases exactly once.
 */
export function hydrateFromStorage(dispatch: AppDispatch): PersistedState | undefined {
  const persisted = loadPersistedState()
  if (persisted) {
    if (persisted.preferences) dispatch(hydratePreferences(persisted.preferences))
    if (persisted.favorites) dispatch(hydrateFavorites(persisted.favorites))
    if (persisted.layout) dispatch(hydrateLayout(persisted.layout))
  }
  dispatch(markHydrated())
  return persisted
}

/** Listener middleware persisting the whitelisted slices (debounced). */
export function createPersistenceMiddleware() {
  const write = createWriter()
  const listenerMiddleware = createListenerMiddleware()
  listenerMiddleware.startListening({
    predicate: isAnyOf(
      toggleCategory,
      setDarkMode,
      setLanguage,
      markOnboarded,
      resetPreferences,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      clearFavorites,
      setSectionOrder,
      resetSectionOrder,
    ),
    effect: (_action, api) => {
      const state = api.getState() as {
        preferences: PreferencesState
        favorites: FavoritesState
        layout: LayoutState
      }
      write({
        preferences: state.preferences,
        favorites: state.favorites,
        layout: state.layout,
      })
    },
  })
  return listenerMiddleware
}
