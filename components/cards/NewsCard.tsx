'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Newspaper } from 'lucide-react'
import type { NewsItem } from '@/types'
import CardImage from './CardImage'
import FavoriteButton from './FavoriteButton'
import { cardBodyClass, cardClass, cardCtaClass, cardMetaClass, cardTextClass, cardTitleClass } from './cardStyles'
import { Highlight } from '@/components/ui/Highlight'
import { timeAgo } from '@/lib/format'
import { useTranslation } from '@/lib/i18n'

export interface NewsCardProps {
  item: NewsItem
  isFavorite: boolean
  onToggleFavorite: (item: NewsItem) => void
  /** Search term to highlight in title/description ('' = none, M7). */
  highlight?: string
}

/** News variant of the content card: source/category meta + "Read More". */
export function NewsCard({ item, isFavorite, onToggleFavorite, highlight = '' }: NewsCardProps) {
  const { t } = useTranslation('cards')
  const reduce = useReducedMotion()
  return (
    <motion.article
      whileHover={reduce ? undefined : { y: -3 }}
      transition={{ duration: 0.15 }}
      className={cardClass}
    >
      <CardImage src={item.imageUrl} fallback={<Newspaper size={28} />} />
      <div className={cardBodyClass}>
        <p className={cardMetaClass}>
          {item.source} · {t(`categories.${item.category}`)} · {timeAgo(item.publishedAt)}
        </p>
        <h3 className={cardTitleClass}>
          <Highlight text={item.title} term={highlight} />
        </h3>
        {item.description && (
          <p className={cardTextClass}>
            <Highlight text={item.description} term={highlight} />
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className={cardCtaClass}
          >
            {t('readMore')}
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
          <FavoriteButton
            title={item.title}
            pressed={isFavorite}
            onToggle={() => onToggleFavorite(item)}
          />
        </div>
      </div>
    </motion.article>
  )
}

export default NewsCard
