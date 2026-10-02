'use client'

import type { ReactNode } from 'react'
import { Flame } from 'lucide-react'
import ContentGrid from '@/components/feed/ContentGrid'
import CardSkeleton from '@/components/cards/CardSkeleton'
import ErrorState from '@/components/feed/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import { useGetTrendingQuery } from '@/features/feed/contentApi'
import type { ContentItem } from '@/types'

export interface TrendingSectionProps {
  /** Which content slice /api/trending should score. */
  type: 'news' | 'movie' | 'social'
  /** Category tab, or undefined for the "All" overview. */
  category?: string
  heading: string
  icon: ReactNode
  isFavorite: (id: string) => boolean
  onToggleFavorite: (item: ContentItem) => void
}

/**
 * One trending section (news / movies / social) with its own query, so each
 * renders loading, empty, and error states independently (rule 4).
 */
export function TrendingSection({
  type,
  category,
  heading,
  icon,
  isFavorite,
  onToggleFavorite,
}: TrendingSectionProps) {
  const { data, isLoading, isError, refetch } = useGetTrendingQuery({ type, category })

  if (isError) {
    return (
      <ErrorState
        onRetry={() => refetch()}
        message={`Prism could not load ${heading.toLowerCase()}`}
      />
    )
  }

  return (
    <section aria-label={heading} className="space-y-4">
      <h2 className="flex items-center gap-2 text-title font-semibold text-ink">
        <span className="text-accent" aria-hidden="true">
          {icon}
        </span>
        {heading}
        {data && (
          <span className="text-sm font-normal text-ink-soft">
            {data.items.length} items
          </span>
        )}
      </h2>
      {isLoading ? (
        <div role="status" aria-label={`Loading ${heading}`} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Flame size={20} aria-hidden="true" />}
          title={`Nothing trending in ${heading.toLowerCase()} yet`}
          hint="Fresh momentum shows up here as soon as your topics start moving."
        />
      ) : (
        <ContentGrid
          items={data?.items ?? []}
          label={heading}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
        />
      )}
    </section>
  )
}

export default TrendingSection
