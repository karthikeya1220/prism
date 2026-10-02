'use client'

import { useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { CATEGORIES, type Category } from '@/types'
import { cx } from '@/lib/cx'

export type TrendingTab = 'all' | Category

/** Every selectable tab: the "All" overview plus each content category. */
export const TRENDING_TABS: TrendingTab[] = ['all', ...CATEGORIES]

export interface TrendingTabsProps {
  value: TrendingTab
  onChange: (tab: TrendingTab) => void
}

/**
 * Category tabs for the Trending page (role="tablist"): automatic
 * arrow-key activation (←/→/Home/End), roving tabindex, and aria-selected
 * on the active tab. The panel it controls is the section wrapper in
 * TrendingView.
 */
export function TrendingTabs({ value, onChange }: TrendingTabsProps) {
  const listRef = useRef<HTMLDivElement>(null)

  const move = (next: TrendingTab) => {
    onChange(next)
    listRef.current
      ?.querySelector<HTMLButtonElement>(`#trend-tab-${next}`)
      ?.focus()
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const index = TRENDING_TABS.indexOf(value)
    let next: TrendingTab | null = null
    if (event.key === 'ArrowRight') next = TRENDING_TABS[(index + 1) % TRENDING_TABS.length]
    else if (event.key === 'ArrowLeft')
      next = TRENDING_TABS[(index - 1 + TRENDING_TABS.length) % TRENDING_TABS.length]
    else if (event.key === 'Home') next = TRENDING_TABS[0]
    else if (event.key === 'End') next = TRENDING_TABS[TRENDING_TABS.length - 1]
    if (!next) return
    event.preventDefault()
    move(next)
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Trending categories"
      onKeyDown={onKeyDown}
      className="flex flex-wrap gap-2"
    >
      {TRENDING_TABS.map((tab) => {
        const selected = tab === value
        return (
          <button
            key={tab}
            id={`trend-tab-${tab}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls="trending-panel"
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab)}
            className={cx(
              'rounded-control border px-3 py-1.5 text-sm capitalize transition-colors',
              selected
                ? 'border-transparent bg-accent-solid text-on-accent'
                : 'border-line bg-surface text-ink-soft hover:border-accent hover:text-accent',
            )}
          >
            {tab}
          </button>
        )
      })}
    </div>
  )
}

export default TrendingTabs
