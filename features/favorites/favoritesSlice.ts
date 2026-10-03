/**
 * Favorites: full ContentItem snapshots keyed by id, so the Favorites section
 * renders instantly without refetching (and works offline). Persisted.
 */
import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ContentItem } from '@/types'
import type { RootState } from '@/store'

export interface FavoritesState {
  byId: Record<string, ContentItem>
  /** Insertion order for stable, drag-free display before reordering exists. */
  ids: string[]
}

const initialState: FavoritesState = {
  byId: {},
  ids: [],
}

/**
 * Hard cap: favorites persist to localStorage as full snapshots, so bound
 * the payload. At the cap, new adds are refused (the heart simply stays
 * off) and updates to existing favorites still work.
 */
export const MAX_FAVORITES = 100

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    /** Add (or update) a favorite. Idempotent on id — no duplicates. */
    addFavorite(state, action: PayloadAction<ContentItem>) {
      const item = action.payload
      const exists = item.id in state.byId
      if (!exists && state.ids.length >= MAX_FAVORITES) return
      if (!exists) state.ids.push(item.id)
      state.byId[item.id] = item
    },
    removeFavorite(state, action: PayloadAction<string>) {
      delete state.byId[action.payload]
      state.ids = state.ids.filter((id) => id !== action.payload)
    },
    /** Toggle: returns the item's new favorite status. */
    toggleFavorite(state, action: PayloadAction<ContentItem>) {
      const item = action.payload
      if (item.id in state.byId) {
        delete state.byId[item.id]
        state.ids = state.ids.filter((id) => id !== item.id)
      } else {
        if (state.ids.length >= MAX_FAVORITES) return
        state.ids.push(item.id)
        state.byId[item.id] = item
      }
    },
    clearFavorites() {
      return initialState
    },
    /** Replace state from storage (capped so a corrupt payload stays bounded). */
    hydrateFavorites(state, action: PayloadAction<FavoritesState>) {
      const payload = action.payload
      if (payload.ids.length <= MAX_FAVORITES) return payload
      const ids = payload.ids.slice(0, MAX_FAVORITES)
      const byId: Record<string, ContentItem> = {}
      for (const id of ids) {
        const item = payload.byId[id]
        if (item) byId[id] = item
      }
      return { byId, ids }
    },
  },
})

export const { addFavorite, removeFavorite, toggleFavorite, clearFavorites, hydrateFavorites } =
  favoritesSlice.actions

/** Select favorite items in insertion order. */
export const selectFavoriteItems = createSelector(
  (state: RootState) => state.favorites.ids,
  (state: RootState) => state.favorites.byId,
  (ids, byId) => ids.flatMap((id) => (byId[id] ? [byId[id]] : [])),
)

/** Select whether an id is favorited. */
export function selectIsFavorite(id: string): (state: RootState) => boolean {
  return (state) => id in state.favorites.byId
}

export default favoritesSlice.reducer
