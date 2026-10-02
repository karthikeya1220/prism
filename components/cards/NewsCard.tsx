'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Newspaper } from 'lucide-react'
import type { NewsItem } from '@/types'
import CardImage from './CardImage'
import FavoriteButton from './FavoriteButton'
import { cardBodyClass, cardClass, cardCtaClass, cardMetaClass, cardTextClass, cardTitleClass } from './cardStyles'
import { timeAgo } from '@/lib/format'

export interface NewsCardProps {
  item: NewsItem
  isFavorite: boolean
  onToggleFavorite: (item: NewsItem) => void
}

/** News variant of the content card: source/category meta + "Read More". */
export function NewsCard({ item, isFavorite, onToggleFavorite }: NewsCardProps) {
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
          {item.source} · {item.category} · {timeAgo(item.publishedAt)}
        </p>
        <h3 className={cardTitleClass}>{item.title}</h3>
        {item.description && <p className={cardTextClass}>{item.description}</p>}
        <div className="mt-auto flex items-center justify-between pt-2">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className={cardCtaClass}
          >
            Read More
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
