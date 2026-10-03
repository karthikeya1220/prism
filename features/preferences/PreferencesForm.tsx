'use client'

import { useState } from 'react'
import { MAX_CATEGORIES, toggleCategory } from '@/features/preferences/preferencesSlice'
import { CATEGORIES, type Category } from '@/types'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { cx } from '@/lib/cx'

/**
 * Feed-topic picker: toggle chips over every category, capped at
 * MAX_CATEGORIES and never empty — deselecting the final topic is refused
 * with a clear (role="alert") message. State lives in the preferences slice,
 * so choices persist through localStorage (store/persistence.ts) and drive
 * feed queries (FeedSection passes them as RTK Query args). The counter is
 * polite-live so screen readers hear the cap.
 */
export function PreferencesForm() {
  const categories = useAppSelector((state) => state.preferences.categories)
  const dispatch = useAppDispatch()
  const [blocked, setBlocked] = useState(false)
  const atCap = categories.length >= MAX_CATEGORIES

  const onToggle = (category: Category) => {
    if (categories.includes(category) && categories.length === 1) {
      setBlocked(true)
      return
    }
    setBlocked(false)
    dispatch(toggleCategory(category))
  }

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
                onClick={() => onToggle(category)}
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
      <p
        role={blocked ? 'alert' : undefined}
        aria-live={blocked ? undefined : 'polite'}
        className="mt-3 text-xs"
      >
        {blocked ? (
          <span className="text-danger">
            Keep at least one topic selected — Prism always needs something to show you.
          </span>
        ) : (
          <span className="text-ink-soft">
            {atCap ? 'Topic limit reached — clear one to swap it.' : 'Saved automatically.'}
          </span>
        )}
      </p>
    </div>
  )
}

export default PreferencesForm
