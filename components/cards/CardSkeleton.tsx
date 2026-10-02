import { cx } from '@/lib/cx'

export interface CardSkeletonProps {
  /** Media aspect: 'wide' mirrors news/social thumbs, 'poster' movies. */
  variant?: 'wide' | 'poster'
}

/**
 * Shimmering card placeholder shown while a feed section loads (rule 4:
 * loading state for every data-driven view). Purely decorative — the owning
 * list announces progress via role="status".
 */
export function CardSkeleton({ variant = 'wide' }: CardSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cx('animate-pulse overflow-hidden rounded-card border border-line bg-surface motion-reduce:animate-none')}
    >
      <div
        className={cx(
          'bg-line/70',
          variant === 'poster' ? 'h-52 w-full' : 'h-36 w-full',
        )}
      />
      <div className="space-y-2.5 p-4">
        <div className="h-2.5 w-1/3 rounded bg-line/70" />
        <div className="h-4 w-5/6 rounded bg-line/70" />
        <div className="h-3 w-full rounded bg-line/70" />
        <div className="h-3 w-2/3 rounded bg-line/70" />
      </div>
    </div>
  )
}

export default CardSkeleton
