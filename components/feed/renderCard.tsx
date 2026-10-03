'use client'

import NewsCard from '@/components/cards/NewsCard'
import MovieCard from '@/components/cards/MovieCard'
import SocialCard from '@/components/cards/SocialCard'
import type { ContentItem } from '@/types'

/**
 * Dispatch a content card on its discriminant (`item.type`) — shared by the
 * static ContentGrid and the drag-and-drop feed grid so every variant
 * renders identically everywhere.
 */
export function renderCard(
  item: ContentItem,
  isFavorite: (id: string) => boolean,
  onToggleFavorite: (item: ContentItem) => void,
  highlight = '',
) {
  switch (item.type) {
    case 'news':
      return (
        <NewsCard
          item={item}
          isFavorite={isFavorite(item.id)}
          onToggleFavorite={onToggleFavorite}
          highlight={highlight}
        />
      )
    case 'movie':
      return (
        <MovieCard
          item={item}
          isFavorite={isFavorite(item.id)}
          onToggleFavorite={onToggleFavorite}
          highlight={highlight}
        />
      )
    case 'social':
      return (
        <SocialCard
          item={item}
          isFavorite={isFavorite(item.id)}
          onToggleFavorite={onToggleFavorite}
          highlight={highlight}
        />
      )
  }
}

export default renderCard
