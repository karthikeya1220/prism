'use client'

import { useCallback, useMemo, useState } from 'react'
import { Newspaper } from 'lucide-react'
import ContentGrid from '@/components/feed/ContentGrid'
import CardSkeleton from '@/components/cards/CardSkeleton'
import ErrorState from '@/components/feed/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import { buildFeed } from '@/features/feed/buildFeed'
import { useInfiniteScroll } from '@/features/feed/useInfiniteScroll'
import { useGetMoviesQuery, useGetNewsQuery, useGetSocialQuery } from '@/features/feed/contentApi'
import { toggleFavorite } from '@/features/favorites/favoritesSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import type { ContentItem } from '@/types'

/**
 * Personalized unified feed (R6): three parallel RTK Query subscriptions
 * (news, movies, social) filtered by the user's categories, merged by the
 * pure `buildFeed` interleave, with skeleton/empty/error states (rule 4),
 * favorite toggling, and IntersectionObserver infinite scroll (R4).
 * Changing preferences changes the query args — RTK Query refetches
 * automatically on a fresh cache key.
 */
export function FeedSection() {
  const categories = useAppSelector((state) => state.preferences.categories)
  const favorites = useAppSelector((state) => state.favorites.byId)
  const dispatch = useAppDispatch()

  // Page is keyed by the category set: new topics automatically read as
  // page 1 (derived during render — no reset effect needed).
  const categoriesKey = categories.join(',')
  const [pageByKey, setPageByKey] = useState<Record<string, number>>({})
  const page = pageByKey[categoriesKey] ?? 1

  const news = useGetNewsQuery({ categories, page })
  const movies = useGetMoviesQuery({ categories, page })
  const social = useGetSocialQuery({ page })

  const items = useMemo(
    () =>
      buildFeed({
        news: news.data?.items ?? [],
        movies: movies.data?.items ?? [],
        social: social.data?.items ?? [],
        categories,
      }),
    [news.data, movies.data, social.data, categories],
  )

  const firstLoad = news.isLoading || movies.isLoading || social.isLoading
  const fetching = news.isFetching || movies.isFetching || social.isFetching
  const anyError = news.isError || movies.isError || social.isError
  const hasMore = Boolean(news.data?.hasMore || movies.data?.hasMore || social.data?.hasMore)

  const loadMore = useCallback(() => {
    setPageByKey((current) => ({
      ...current,
      [categoriesKey]: (current[categoriesKey] ?? 1) + 1,
    }))
  }, [categoriesKey])
  const sentinelRef = useInfiniteScroll(loadMore, hasMore && !fetching && !anyError)

  const retry = () => {
    news.refetch()
    movies.refetch()
    social.refetch()
  }

  const toggle = useCallback(
    (item: ContentItem) => {
      dispatch(toggleFavorite(item))
    },
    [dispatch],
  )

  if (anyError && items.length === 0) {
    return <ErrorState onRetry={retry} />
  }

  return (
    <div className="space-y-4">
      {firstLoad && items.length === 0 ? (
        <div
          role="status"
          aria-label="Loading your feed"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Newspaper size={20} aria-hidden="true" />}
          title="Nothing matches your topics yet"
          hint="Widen your topics in Settings — more stories, films, and posts will land here."
        />
      ) : (
        <ContentGrid
          items={items}
          label="Your feed"
          isFavorite={(id) => id in favorites}
          onToggleFavorite={toggle}
        />
      )}

      {fetching && items.length > 0 && (
        <p role="status" className="pt-2 text-center text-sm text-ink-soft">
          Loading more…
        </p>
      )}
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />
    </div>
  )
}

export default FeedSection
