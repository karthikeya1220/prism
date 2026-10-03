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
import { useTranslation } from '@/lib/i18n'

type Filter = 'all' | 'news' | 'movie' | 'social'

/**
 * Favorites view (R8): saved items straight from the store (no refetch),
 * grouped by content type behind filter chips. Removing a card — via its
 * heart — fires an undo toast; empty state routes back to the feed.
 */
export function FavoritesView() {
  const { t } = useTranslation('favorites')
  const items = useAppSelector(selectFavoriteItems)
  const dispatch = useAppDispatch()
  const [filter, setFilter] = useState<Filter>('all')
  const [undoItem, setUndoItem] = useState<ContentItem | null>(null)

  // Labels live inside the component so a language change re-renders them.
  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: t('filters.all') },
    { key: 'news', label: t('filters.news') },
    { key: 'movie', label: t('filters.movie') },
    { key: 'social', label: t('filters.social') },
  ]

  const groups = useMemo(
    () => [
      { key: 'news', label: t('filters.news'), items: items.filter(isNewsItem) },
      { key: 'movie', label: t('filters.movie'), items: items.filter(isMovieItem) },
      { key: 'social', label: t('filters.social'), items: items.filter(isSocialItem) },
    ],
    [items, t],
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
        title={t('emptyTitle')}
        hint={t('emptyHint')}
        action={
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-control bg-accent-solid px-4 py-2 text-sm font-medium text-on-accent transition-opacity hover:opacity-90"
          >
            {t('browseFeed')}
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <div
        role="group"
        aria-label={t('filterLabel')}
        className="flex flex-wrap items-center gap-2"
      >
        {filters.map((option) => {
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
          aria-label={t('groupFavorites', { label: group.label })}
          className="space-y-4"
        >
          <h2 className="text-title font-semibold text-ink">
            {group.label}
            <span className="ml-2 text-sm font-normal text-ink-soft">
              {t('savedCount', { n: group.items.length })}
            </span>
          </h2>
          {group.items.length === 0 ? (
            <EmptyState
              title={t('emptyGroupTitle', { type: group.label.toLowerCase() })}
              hint={t('emptyGroupHint')}
            />
          ) : (
            <ContentGrid
              items={group.items}
              label={t('groupFavorites', { label: group.label })}
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
            message={t('removed', { title: undoItem.title })}
            onUndo={undo}
            onDismiss={dismiss}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default FavoritesView
