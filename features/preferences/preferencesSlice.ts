/**
 * User content preferences: feed categories, dark mode, UI language, and the
 * first-run onboarding flag. Persisted via the store's listener middleware
 * (see store/persistence.ts).
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Category } from '@/types'

/** Max selected categories — keeps the feed diverse and requests bounded. */
export const MAX_CATEGORIES = 5

/** Factory-fresh choices used by the initial state and "Reset preferences". */
export const DEFAULT_CATEGORIES: Category[] = ['technology', 'entertainment']

export interface PreferencesState {
  categories: Category[]
  darkMode: boolean
  language: 'en' | 'hi'
  /** First-run onboarding has been completed (chosen topics or skipped). */
  onboarded: boolean
  /**
   * True once post-mount rehydration has run. Until then the defaults on
   * screen are provisional — gated UI (onboarding dialog, feed queries) must
   * wait so returning users see no flash and no duplicate first fetch.
   * Runtime-only: never written to storage.
   */
  hydrated: boolean
}

/** The persisted subset — `hydrated` lives only in memory. */
export type PersistedPreferences = Omit<PreferencesState, 'hydrated'>

const initialState: PreferencesState = {
  categories: DEFAULT_CATEGORIES,
  darkMode: false,
  language: 'en',
  onboarded: false,
  hydrated: false,
}

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    /**
     * Toggle a category; caps at MAX_CATEGORIES (silently ignores extras) and
     * refuses to empty the list — the feed always needs at least one topic.
     */
    toggleCategory(state, action: PayloadAction<Category>) {
      const { categories } = state
      if (categories.includes(action.payload)) {
        if (categories.length === 1) return
        state.categories = categories.filter((c) => c !== action.payload)
      } else if (categories.length < MAX_CATEGORIES) {
        state.categories = [...categories, action.payload]
      }
    },
    setDarkMode(state, action: PayloadAction<boolean>) {
      state.darkMode = action.payload
    },
    setLanguage(state, action: PayloadAction<'en' | 'hi'>) {
      state.language = action.payload
    },
    /** Dismiss the first-run prompt permanently (picked topics or skipped). */
    markOnboarded(state) {
      state.onboarded = true
    },
    /** Post-mount rehydration pass finished (even when storage was empty). */
    markHydrated(state) {
      state.hydrated = true
    },
    /**
     * Restore factory defaults. The onboarding flag is intentionally kept —
     * resetting topics should not re-trigger the first-run prompt.
     */
    resetPreferences(state) {
      state.categories = [...DEFAULT_CATEGORIES]
      state.darkMode = false
      state.language = 'en'
    },
    /** Replace persisted fields (used by persistence rehydration). */
    hydratePreferences(state, action: PayloadAction<PersistedPreferences>) {
      return { ...action.payload, hydrated: state.hydrated }
    },
  },
})

export const {
  toggleCategory,
  setDarkMode,
  setLanguage,
  markOnboarded,
  markHydrated,
  resetPreferences,
  hydratePreferences,
} = preferencesSlice.actions

export default preferencesSlice.reducer
