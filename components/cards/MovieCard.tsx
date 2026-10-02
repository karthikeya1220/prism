'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Clapperboard, Star } from 'lucide-react'
import type { MovieItem } from '@/types'
import CardImage from './CardImage'
import FavoriteButton from './FavoriteButton'
import { cardBodyClass, cardClass, cardCtaClass, cardMetaClass, cardTextClass, cardTitleClass } from './cardStyles'
import { Highlight } from '@/components/ui/Highlight'
import { formatRating, releaseYear } from '@/lib/format'

export interface MovieCardProps {
  item: MovieItem
  isFavorite: boolean
  onToggleFavorite: (item: MovieItem) => void
  /** Search term to highlight in title/description ('' = none, M7). */
  highlight?: string
}

/** Movie variant of the content card: rating badge + "Play Now" CTA. */
export function MovieCard({ item, isFavorite, onToggleFavorite, highlight = '' }: MovieCardProps) {
  const reduce = useReducedMotion()
  return (
    <motion.article
      whileHover={reduce ? undefined : { y: -3 }}
      transition={{ duration: 0.15 }}
      className={cardClass}
    >
      <CardImage src={item.imageUrl} fallback={<Clapperboard size={28} />} />
      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-ink/85 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
        <Star size={12} fill="currentColor" className="text-amber-400" aria-hidden="true" />
        {formatRating(item.rating)}
      </span>
      <div className={cardBodyClass}>
        <p className={cardMetaClass}>
          {releaseYear(item.releaseDate) || 'Upcoming'}
          {item.genres.length > 0 && ` · ${item.genres.slice(0, 2).join(', ')}`}
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
            Play Now
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

export default MovieCard
