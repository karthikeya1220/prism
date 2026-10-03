import { describe, expect, it } from 'vitest'
import reducer, {
  hydratePreferences,
  markOnboarded,
  MAX_CATEGORIES,
  resetPreferences,
  setDarkMode,
  setLanguage,
  toggleCategory,
} from '@/features/preferences/preferencesSlice'

const initial = reducer(undefined, { type: '@@INIT' })

describe('preferencesSlice', () => {
  it('has sensible defaults', () => {
    expect(initial.categories).toEqual(['technology', 'entertainment'])
    expect(initial.darkMode).toBe(false)
    expect(initial.language).toBe('en')
  })

  it('toggles a category on and off', () => {
    const added = reducer(initial, toggleCategory('sports'))
    expect(added.categories).toContain('sports')

    const removed = reducer(added, toggleCategory('sports'))
    expect(removed.categories).not.toContain('sports')
    expect(removed.categories).toEqual(initial.categories)
  })

  it('caps selected categories at MAX_CATEGORIES', () => {
    let state = initial
    for (const c of ['business', 'finance', 'sports', 'science', 'health'] as const) {
      state = reducer(state, toggleCategory(c))
    }
    expect(state.categories.length).toBe(MAX_CATEGORIES)

    // A 6th category is silently ignored, and re-toggling still works.
    const blocked = reducer(state, toggleCategory('general'))
    expect(blocked.categories.length).toBe(MAX_CATEGORIES)

    const afterRemove = reducer(state, toggleCategory('technology'))
    expect(afterRemove.categories).not.toContain('technology')
    const nowFits = reducer(afterRemove, toggleCategory('general'))
    expect(nowFits.categories).toContain('general')
  })

  it('sets dark mode and language', () => {
    let state = reducer(initial, setDarkMode(true))
    expect(state.darkMode).toBe(true)
    state = reducer(state, setLanguage('de'))
    expect(state.language).toBe('de')
  })

  it('rehydrates wholesale and tolerates empty categories', () => {
    const persisted = {
      categories: [],
      darkMode: true,
      language: 'en' as const,
      onboarded: false,
    }
    const state = reducer(initial, hydratePreferences(persisted))
    expect(state).toEqual({ ...persisted, hydrated: false })
  })

  it('never empties the category list', () => {
    const single = reducer(
      { ...initial, categories: ['technology'] },
      toggleCategory('technology'),
    )
    expect(single.categories).toEqual(['technology'])
  })

  it('marks onboarding complete without touching topics', () => {
    const state = reducer(initial, markOnboarded())
    expect(state.onboarded).toBe(true)
    expect(state.categories).toEqual(initial.categories)
  })

  it('resets preferences to defaults but keeps the onboarding flag', () => {
    let state = reducer(initial, setDarkMode(true))
    state = reducer(state, setLanguage('de'))
    state = reducer(state, toggleCategory('sports'))
    state = reducer(state, markOnboarded())

    state = reducer(state, resetPreferences())
    expect(state.categories).toEqual(['technology', 'entertainment'])
    expect(state.darkMode).toBe(false)
    expect(state.language).toBe('en')
    expect(state.onboarded).toBe(true)
  })
})
