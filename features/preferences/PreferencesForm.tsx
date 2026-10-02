'use client'

import { MAX_CATEGORIES, toggleCategory } from '@/features/preferences/preferencesSlice'
import { CATEGORIES, type Category } from '@/types'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { cx } from '@/lib/cx'

/**
 * Feed-topic picker: toggle chips over every category, capped at
 * MAX_CATEGORIES. State lives in the preferences slice, so choices persist
 * through localStorage (store/persistence.ts) and will drive feed queries
 * from M5 on. The counter is polite-live so screen readers hear the cap.
 */
export function PreferencesForm() {
  const categories = useAppSelector((state) => state.preferences.categories)
  const dispatch = useAppDispatch()
  const atCap = categories.length >= MAX_CATEGORIES

  return (
    <div className="rounded-card border border-line bg-surface p-5 shadow-card">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-ink-soft">
          Pick up to {MAX_CATEGORIES} topics
        </p>
        <p
          aria-live="polite"
          className="font-mono text-xs text-ink-soft"
        >{`${categories.length}/${MAX_CATEGORIES}`}</p>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((category: Category) => {
          const selected = categories.includes(category)
          return (
            <li key={category}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => dispatch(toggleCategory(category))}
                className={cx(
                  'rounded-control border px-3 py-1.5 text-sm capitalize transition-colors',
                  selected
                    ? 'border-transparent bg-accent-solid text-on-accent'
                    : 'border-line bg-canvas text-ink hover:border-accent hover:text-accent',
                )}
              >
                {category}
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-xs text-ink-soft" aria-live="polite">
        {atCap
          ? 'Topic limit reached — clear one to swap it.'
          : 'Saved automatically.'}
      </p>
    </div>
  )
}

export default PreferencesForm
