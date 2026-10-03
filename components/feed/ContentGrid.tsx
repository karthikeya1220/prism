'use client'

import type { ContentItem } from '@/types'
import { renderCard } from '@/components/feed/renderCard'

export interface ContentGridProps {
  items: ContentItem[]
  /** Accessible name for the list ("Your feed", "Trending news" …). */
  label: string
  isFavorite: (id: string) => boolean
  onToggleFavorite: (item: ContentItem) => void
  /** Search term to highlight in titles/descriptions (M7; '' = none). */
  highlight?: string
}

/**
 * Responsive card grid shared by the trending, search, and favorites views
 * (the feed uses the sortable variant). Card dispatch lives in renderCard.
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
