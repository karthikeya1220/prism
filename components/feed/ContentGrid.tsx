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
  /** Search term to highlight in titles/descriptions (M7; '' = none). */
  highlight?: string
}

function renderCard(
  item: ContentItem,
  isFavorite: (id: string) => boolean,
  onToggleFavorite: (item: ContentItem) => void,
  highlight: string,
) {
  switch (item.type) {
    case 'news':
      return <NewsCard item={item} isFavorite={isFavorite(item.id)} onToggleFavorite={onToggleFavorite} highlight={highlight} />
    case 'movie':
      return <MovieCard item={item} isFavorite={isFavorite(item.id)} onToggleFavorite={onToggleFavorite} highlight={highlight} />
    case 'social':
      return <SocialCard item={item} isFavorite={isFavorite(item.id)} onToggleFavorite={onToggleFavorite} highlight={highlight} />
  }
}

/**
 * Responsive card grid shared by the feed, trending, search, and favorites
 * views. Rendering dispatches on the `ContentItem` discriminant so every
 * consumer gets the right variant without repeating the switch.
 */
export function ContentGrid({ items, label, isFavorite, onToggleFavorite, highlight = '' }: ContentGridProps) {
  return (
    <ul aria-label={label} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="flex">
          <div className="w-full">{renderCard(item, isFavorite, onToggleFavorite, highlight)}</div>
        </li>
      ))}
    </ul>
  )
}

export default ContentGrid
