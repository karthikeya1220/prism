'use client'

import { useCallback, useMemo, useState } from 'react'
import { SearchX } from 'lucide-react'
import ContentGrid from '@/components/feed/ContentGrid'
import CardSkeleton from '@/components/cards/CardSkeleton'
import EmptyState from '@/components/ui/EmptyState'
import { useSearchQuery } from '@/features/feed/contentApi'
import { toggleFavorite } from '@/features/favorites/favoritesSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { isMovieItem, isNewsItem, isSocialItem, type ContentItem } from '@/types'
import { cx } from '@/lib/cx'
import { useTranslation } from '@/lib/i18n'

export interface SearchResultsProps {
  /** The active search term (already trimmed by the URL sync). */
  query: string
}

type Filter = 'all' | 'news' | 'movie' | 'social'

/** Deterministic, non-preachy suggestions for the no-results state. */
function suggestionsFor(query: string): string[] {
  const base = query.trim().replace(/\s+/g, ' ')
  const variants = [
    base.split(' ')[0],
    base.slice(0, Math.max(base.length - 1, 2)),
    'space',
    'market',
  ]
  return [...new Set(variants)]
    .filter((s) => s.length >= 2 && s.toLowerCase() !== base.toLowerCase())
    .slice(0, 3)
}

/**
 * Cross-type search results (M7, R9): one `search` subscription fans out to
 * news/movies/social in parallel and the bundle renders as three type groups
 * with counts, filter tabs, matched-text highlighting, per-source error
 * rows, and loading skeletons — every data-driven state covered (rule 4).
 */
export function SearchResults({ query }: SearchResultsProps) {
  const { t } = useTranslation('search')
  const term = query.trim()
  const dispatch = useAppDispatch()
  const favorites = useAppSelector((state) => state.favorites.byId)
  const [filter, setFilter] = useState<Filter>('all')

  const { data, isLoading, isFetching, isError, refetch } = useSearchQuery(
    { q: term },
    { skip: term.length < 2 },
  )

  const toggle = useCallback(
    (item: ContentItem) => dispatch(toggleFavorite(item)),
    [dispatch],
  )
  const isFavorite = useCallback((id: string) => id in favorites, [favorites])

  // Filter tabs and group labels are built here (not at module scope) so a
  // language change re-renders them.
  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: t('filters.all') },
    { key: 'news', label: t('filters.news') },
    { key: 'movie', label: t('filters.movie') },
    { key: 'social', label: t('filters.social') },
  ]

  const groups = useMemo(
    () => [
      {
        key: 'news' as const,
        label: t('filters.news'),
        items: data?.news.items.filter(isNewsItem) ?? [],
      },
      {
        key: 'movie' as const,
        label: t('filters.movie'),
        items: data?.movies.items.filter(isMovieItem) ?? [],
      },
      {
        key: 'social' as const,
        label: t('filters.social'),
        items: data?.social.items.filter(isSocialItem) ?? [],
      },
    ],
    [data, t],
  )

  if (term.length < 2) {
    return (
      <EmptyState
        title={t('minCharsTitle')}
        hint={t('minCharsHint')}
      />
    )
  }

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label={t('loading')}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {Array.from({ length: 6 }, (_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <EmptyState
        icon={<SearchX size={20} aria-hidden="true" />}
        title={t('errorTitle')}
        hint={t('errorHint')}
        action={
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-control bg-accent-solid px-4 py-2 text-sm font-medium text-on-accent transition-opacity hover:opacity-90"
          >
            {t('tryAgain')}
          </button>
        }
      />
    )
  }

  const total =
    (data?.news.items.length ?? 0) +
    (data?.movies.items.length ?? 0) +
    (data?.social.items.length ?? 0)

  if (total === 0) {
    return (
      <EmptyState
        icon={<SearchX size={20} aria-hidden="true" />}
        title={t('noResultsTitle', { term })}
        hint={t('noResultsHint')}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {suggestionsFor(term).map((suggestion) => (
              <a
                key={suggestion}
                href={`/search?q=${encodeURIComponent(suggestion)}`}
                className="rounded-control border border-line bg-canvas px-3 py-1.5 text-sm text-accent transition-colors hover:border-accent"
              >
                {suggestion}
              </a>
            ))}
          </div>
        }
      />
    )
  }

  const failedSources = [
    data?.news.failed && t('sourceNames.news'),
    data?.movies.failed && t('sourceNames.movies'),
    data?.social.failed && t('sourceNames.social'),
  ].filter(Boolean) as string[]
  const visibleGroups = groups.filter((group) => filter === 'all' || group.key === filter)

  return (
    <div className="space-y-6">
      {failedSources.length > 0 && (
        <p role="status" className="rounded-control border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-ink">
          {t('partialSources', { sources: failedSources.join(', ') })}
          <button type="button" onClick={() => refetch()} className="font-semibold underline underline-offset-2">
            {t('retry')}
          </button>
          .
        </p>
      )}

      <div
        role="group"
        aria-label={t('filterLabel')}
        className="flex flex-wrap items-center gap-2"
      >
        {filters.map((option) => {
          const count =
            option.key === 'all'
              ? total
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
        {isFetching && (
          <span
            role="status"
            aria-label={t('updatingAria')}
            className="text-sm text-ink-soft"
          >
            {t('updating')}
          </span>
        )}
      </div>

      {visibleGroups.map((group) => (
        <section
          key={group.key}
          aria-label={t('groupResults', { label: group.label })}
          className="space-y-4"
        >
          <h2 className="text-title font-semibold text-ink">
            {group.label}
            <span className="ml-2 text-sm font-normal text-ink-soft">
              {group.items.length === 1
                ? t('resultOne', { n: group.items.length })
                : t('resultMany', { n: group.items.length })}
            </span>
          </h2>
          {group.items.length === 0 ? (
            <p className="text-sm text-ink-soft">
              {t('noMatch', { type: group.label.toLowerCase(), term })}
            </p>
          ) : (
            <ContentGrid
              items={group.items}
              label={t('groupResults', { label: group.label })}
              isFavorite={isFavorite}
              onToggleFavorite={toggle}
              highlight={term}
            />
          )}
        </section>
      ))}
    </div>
  )
}

export default SearchResults
