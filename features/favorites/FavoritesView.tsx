'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import ContentGrid from '@/components/feed/ContentGrid'
import EmptyState from '@/components/ui/EmptyState'
import Toast from '@/components/ui/Toast'
import { addFavorite, removeFavorite, selectFavoriteItems } from '@/features/favorites/favoritesSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { isMovieItem, isNewsItem, isSocialItem, type ContentItem } from '@/types'
import { cx } from '@/lib/cx'

type Filter = 'all' | 'news' | 'movie' | 'social'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'news', label: 'News' },
  { key: 'movie', label: 'Movies' },
  { key: 'social', label: 'Social' },
]

/**
 * Favorites view (R8): saved items straight from the store (no refetch),
 * grouped by content type behind filter chips. Removing a card — via its
 * heart — fires an undo toast; empty state routes back to the feed.
 */
export function FavoritesView() {
  const items = useAppSelector(selectFavoriteItems)
  const dispatch = useAppDispatch()
  const [filter, setFilter] = useState<Filter>('all')
  const [undoItem, setUndoItem] = useState<ContentItem | null>(null)

  const groups = useMemo(
    () => [
      { key: 'news', label: 'News', items: items.filter(isNewsItem) },
      { key: 'movie', label: 'Movies', items: items.filter(isMovieItem) },
      { key: 'social', label: 'Social', items: items.filter(isSocialItem) },
    ],
    [items],
  )

  const remove = useCallback(
    (item: ContentItem) => {
      dispatch(removeFavorite(item.id))
      setUndoItem(item)
    },
    [dispatch],
  )
  const undo = useCallback(() => {
    if (undoItem) dispatch(addFavorite(undoItem))
    setUndoItem(null)
  }, [undoItem, dispatch])
  const dismiss = useCallback(() => setUndoItem(null), [])

  const isFavorite = useCallback(() => true, [])
  const visibleGroups = groups.filter((group) => filter === 'all' || group.key === filter)

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Heart size={20} aria-hidden="true" />}
        title="No favorites yet"
        hint="Tap the heart on any card to keep it here — favorites stay put even when you are offline."
        action={
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-control bg-accent-solid px-4 py-2 text-sm font-medium text-on-accent transition-opacity hover:opacity-90"
          >
            Browse your feed
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <div
        role="group"
        aria-label="Filter favorites by type"
        className="flex flex-wrap items-center gap-2"
      >
        {FILTERS.map((option) => {
          const count =
            option.key === 'all'
              ? items.length
              : (groups.find((group) => group.key === option.key)?.items.length ?? 0)
          const active = filter === option.key
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(option.key)}
              className={cx(
                'rounded-control border px-3 py-1.5 text-sm transition-colors',
                active
                  ? 'border-transparent bg-accent-solid text-on-accent'
                  : 'border-line bg-surface text-ink-soft hover:border-accent hover:text-accent',
              )}
            >
              {option.label} ({count})
            </button>
          )
        })}
      </div>

      {visibleGroups.map((group) => (
        <section
          key={group.key}
          aria-label={`${group.label} favorites`}
          className="space-y-4"
        >
          <h2 className="text-title font-semibold text-ink">
            {group.label}
            <span className="ml-2 text-sm font-normal text-ink-soft">
              {group.items.length} saved
            </span>
          </h2>
          {group.items.length === 0 ? (
            <EmptyState
              title={`No saved ${group.label.toLowerCase()}`}
              hint="Switch the filter or heart a card of this type from your feed."
            />
          ) : (
            <ContentGrid
              items={group.items}
              label={`${group.label} favorites`}
              isFavorite={isFavorite}
              onToggleFavorite={remove}
            />
          )}
        </section>
      ))}

      <AnimatePresence>
        {undoItem && (
          <Toast
            key={undoItem.id}
            message={`Removed “${undoItem.title}”`}
            onUndo={undo}
            onDismiss={dismiss}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default FavoritesView
