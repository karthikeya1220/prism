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

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    /** Add (or update) a favorite. Idempotent on id — no duplicates. */
    addFavorite(state, action: PayloadAction<ContentItem>) {
      const item = action.payload
      if (!state.ids.includes(item.id)) state.ids.push(item.id)
      state.byId[item.id] = item
    },
    removeFavorite(state, action: PayloadAction<string>) {
      delete state.byId[action.payload]
      state.ids = state.ids.filter((id) => id !== action.payload)
    },
    /** Toggle: returns the item's new favorite status. */
    toggleFavorite(state, action: PayloadAction<ContentItem>) {
      const item = action.payload
      if (state.ids.includes(item.id)) {
        delete state.byId[item.id]
        state.ids = state.ids.filter((id) => id !== item.id)
      } else {
        state.ids.push(item.id)
        state.byId[item.id] = item
      }
    },
    clearFavorites() {
      return initialState
    },
    /** Replace all state (used by persistence rehydration). */
    hydrateFavorites(state, action: PayloadAction<FavoritesState>) {
      return action.payload
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
