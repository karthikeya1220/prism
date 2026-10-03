'use client'

import { useCallback, useState } from 'react'
import { Clapperboard, Newspaper, MessageCircle } from 'lucide-react'
import TrendingTabs, { type TrendingTab } from '@/components/feed/TrendingTabs'
import TrendingSection from '@/features/feed/TrendingSection'
import { toggleFavorite } from '@/features/favorites/favoritesSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import type { ContentItem } from '@/types'
import { useTranslation } from '@/lib/i18n'

/**
 * Trending page body (R7): category tabs (All + each category) over three
 * independently-fetched sections — trending news (recency), trending movies
 * (TMDB trending), and trending social (engagement). The active tab becomes
 * the categories of the section panel's queries; results stay cached per
 * (type, category) so tab switches are instant after the first visit.
 */
export function TrendingView() {
  const { t } = useTranslation('trending')
  const [tab, setTab] = useState<TrendingTab>('all')
  const favorites = useAppSelector((state) => state.favorites.byId)
  const dispatch = useAppDispatch()

  const toggle = useCallback(
    (item: ContentItem) => {
      dispatch(toggleFavorite(item))
    },
    [dispatch],
  )
  const isFavorite = useCallback((id: string) => id in favorites, [favorites])
  const category = tab === 'all' ? undefined : tab

  return (
    <div className="space-y-6">
      <TrendingTabs value={tab} onChange={setTab} />
      <div
        key={tab}
        id="trending-panel"
        role="tabpanel"
        aria-labelledby={`trend-tab-${tab}`}
        className="space-y-8"
      >
        <TrendingSection
          type="news"
          category={category}
          heading={t('sectionNews')}
          icon={<Newspaper size={20} />}
          isFavorite={isFavorite}
          onToggleFavorite={toggle}
        />
        <TrendingSection
          type="movie"
          category={category}
          heading={t('sectionMovies')}
          icon={<Clapperboard size={20} />}
          isFavorite={isFavorite}
          onToggleFavorite={toggle}
        />
        <TrendingSection
          type="social"
          category={category}
          heading={t('sectionSocial')}
          icon={<MessageCircle size={20} />}
          isFavorite={isFavorite}
          onToggleFavorite={toggle}
        />
      </div>
    </div>
  )
}

export default TrendingView
