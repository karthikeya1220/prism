/**
 * User content preferences: feed categories, dark mode, and UI language.
 * Persisted via the store's listener middleware (see store/persistence.ts).
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Category } from '@/types'

/** Max selected categories — keeps the feed diverse and requests bounded. */
export const MAX_CATEGORIES = 5

export interface PreferencesState {
  categories: Category[]
  darkMode: boolean
  language: 'en' | 'de'
}

const initialState: PreferencesState = {
  categories: ['technology', 'entertainment'],
  darkMode: false,
  language: 'en',
}

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    /** Toggle a category; caps at MAX_CATEGORIES (silently ignores extras). */
    toggleCategory(state, action: PayloadAction<Category>) {
      const { categories } = state
      if (categories.includes(action.payload)) {
        state.categories = categories.filter((c) => c !== action.payload)
      } else if (categories.length < MAX_CATEGORIES) {
        state.categories = [...categories, action.payload]
      }
    },
    setDarkMode(state, action: PayloadAction<boolean>) {
      state.darkMode = action.payload
    },
    setLanguage(state, action: PayloadAction<'en' | 'de'>) {
      state.language = action.payload
    },
    /** Replace all state (used by persistence rehydration). */
    hydratePreferences(state, action: PayloadAction<PreferencesState>) {
      return action.payload
    },
  },
})

export const { toggleCategory, setDarkMode, setLanguage, hydratePreferences } =
  preferencesSlice.actions

export default preferencesSlice.reducer
