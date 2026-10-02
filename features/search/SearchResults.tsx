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

export interface SearchResultsProps {
  /** The active search term (already trimmed by the URL sync). */
  query: string
}

type Filter = 'all' | 'news' | 'movie' | 'social'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'news', label: 'News' },
  { key: 'movie', label: 'Movies' },
  { key: 'social', label: 'Social' },
]

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

  const groups = useMemo(
    () => [
      { key: 'news' as const, label: 'News', items: data?.news.items.filter(isNewsItem) ?? [] },
      { key: 'movie' as const, label: 'Movies', items: data?.movies.items.filter(isMovieItem) ?? [] },
      { key: 'social' as const, label: 'Social', items: data?.social.items.filter(isSocialItem) ?? [] },
    ],
    [data],
  )

  if (term.length < 2) {
    return (
      <EmptyState
        title="Type at least two characters"
        hint="Shorter queries are too noisy to search across news, films, and posts."
      />
    )
  }

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading search results" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        title="Search is unavailable right now"
        hint="The search service did not answer. Your saved topics and favorites are untouched."
        action={
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-control bg-accent-solid px-4 py-2 text-sm font-medium text-on-accent transition-opacity hover:opacity-90"
          >
            Try again
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
        title={`No results for “${term}”`}
        hint="Try a shorter or different phrasing — a suggestion might hit."
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
    data?.news.failed && 'news',
    data?.movies.failed && 'movies',
    data?.social.failed && 'social posts',
  ].filter(Boolean) as string[]
  const visibleGroups = groups.filter((group) => filter === 'all' || group.key === filter)

  return (
    <div className="space-y-6">
      {failedSources.length > 0 && (
        <p role="status" className="rounded-control border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-ink">
          {`Some sources could not be searched (${failedSources.join(', ')}). Results from the others are shown; `}
          <button type="button" onClick={() => refetch()} className="font-semibold underline underline-offset-2">
            retry
          </button>
          .
        </p>
      )}

      <div role="group" aria-label="Filter search results by type" className="flex flex-wrap items-center gap-2">
        {FILTERS.map((option) => {
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
          <span role="status" aria-label="Updating results" className="text-sm text-ink-soft">
            Updating…
          </span>
        )}
      </div>

      {visibleGroups.map((group) => (
        <section key={group.key} aria-label={`${group.label} results`} className="space-y-4">
          <h2 className="text-title font-semibold text-ink">
            {group.label}
            <span className="ml-2 text-sm font-normal text-ink-soft">
              {group.items.length} result{group.items.length === 1 ? '' : 's'}
            </span>
          </h2>
          {group.items.length === 0 ? (
            <p className="text-sm text-ink-soft">
              No {group.label.toLowerCase()} matched “{term}”.
            </p>
          ) : (
            <ContentGrid
              items={group.items}
              label={`${group.label} results`}
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
