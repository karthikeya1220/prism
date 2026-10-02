'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Repeat2, Heart } from 'lucide-react'
import type { SocialItem } from '@/types'
import CardImage from './CardImage'
import FavoriteButton from './FavoriteButton'
import { cardBodyClass, cardClass, cardCtaClass, cardMetaClass, cardTextClass } from './cardStyles'
import { Highlight } from '@/components/ui/Highlight'
import { timeAgo } from '@/lib/format'

export interface SocialCardProps {
  item: SocialItem
  isFavorite: boolean
  onToggleFavorite: (item: SocialItem) => void
  /** Search term to highlight in description ('' = none, M7). */
  highlight?: string
}

/** Social variant of the content card: author + engagement counts. */
export function SocialCard({ item, isFavorite, onToggleFavorite, highlight = '' }: SocialCardProps) {
  const reduce = useReducedMotion()
  const initials = item.author.displayName
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <motion.article
      whileHover={reduce ? undefined : { y: -3 }}
      transition={{ duration: 0.15 }}
      className={cardClass}
    >
      <CardImage
        src={item.imageUrl}
        fallback={<span className="text-2xl font-bold text-accent/60">{initials}</span>}
      />
      <div className={cardBodyClass}>
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent">
            {initials}
          </span>
          <p className="text-sm font-medium text-ink">
            {item.author.displayName}{' '}
            <span className="font-normal text-ink-soft">@{item.author.handle}</span>
          </p>
        </div>
        <p className={cardTextClass}>
          <Highlight text={item.description} term={highlight} />
        </p>
        <p className={cardMetaClass}>
          #{item.hashtag} · {timeAgo(item.publishedAt)}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="flex items-center gap-3 text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1">
              <Heart size={13} aria-hidden="true" />
              {item.likes.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1">
              <Repeat2 size={13} aria-hidden="true" />
              {item.reposts.toLocaleString()}
            </span>
          </span>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className={cardCtaClass}
          >
            View post
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
          <FavoriteButton
            title={`post by @${item.author.handle}`}
            pressed={isFavorite}
            onToggle={() => onToggleFavorite(item)}
          />
        </div>
      </div>
    </motion.article>
  )
}

export default SocialCard
