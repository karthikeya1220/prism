'use client'

import { Heart } from 'lucide-react'
import { cx } from '@/lib/cx'

export interface FavoriteButtonProps {
  /** Accessible content title, used to build the button label. */
  title: string
  /** Whether the item is currently favorited. */
  pressed: boolean
  onToggle: () => void
}

/**
 * Heart toggle present on every card. The label spells out the outcome
 * ("Add … to favorites" / "Remove … from favorites") so screen readers
 * always announce what a press will do.
 */
export function FavoriteButton({ title, pressed, onToggle }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={pressed ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
      className={cx(
        'grid h-9 w-9 shrink-0 place-items-center rounded-control transition-colors hover:bg-line/60',
        pressed ? 'text-danger' : 'text-ink-soft hover:text-ink',
      )}
    >
      <Heart size={18} fill={pressed ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>
  )
}

export default FavoriteButton
