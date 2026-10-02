'use client'

import type { ContentItem } from '@/types'
import NewsCard from '@/components/cards/NewsCard'
import MovieCard from '@/components/cards/MovieCard'
import SocialCard from '@/components/cards/SocialCard'

export interface ContentGridProps {
  items: ContentItem[]
  /** Accessible name for the list ("Your feed", "Trending news" …). */
  label: string
  isFavorite: (id: string) => boolean
  onToggleFavorite: (item: ContentItem) => void
}

function renderCard(
  item: ContentItem,
  isFavorite: (id: string) => boolean,
  onToggleFavorite: (item: ContentItem) => void,
) {
  switch (item.type) {
    case 'news':
      return <NewsCard item={item} isFavorite={isFavorite(item.id)} onToggleFavorite={onToggleFavorite} />
    case 'movie':
      return <MovieCard item={item} isFavorite={isFavorite(item.id)} onToggleFavorite={onToggleFavorite} />
    case 'social':
      return <SocialCard item={item} isFavorite={isFavorite(item.id)} onToggleFavorite={onToggleFavorite} />
  }
}

/**
 * Responsive card grid shared by the feed, trending, and favorites views.
 * Rendering dispatches on the `ContentItem` discriminant so every consumer
 * gets the right variant without repeating the switch.
 */
export function ContentGrid({ items, label, isFavorite, onToggleFavorite }: ContentGridProps) {
  return (
    <ul aria-label={label} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="flex">
          <div className="w-full">{renderCard(item, isFavorite, onToggleFavorite)}</div>
        </li>
      ))}
    </ul>
  )
}

export default ContentGrid
