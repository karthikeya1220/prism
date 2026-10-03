'use client'

import CardSkeleton from '@/components/cards/CardSkeleton'
import { useTranslation } from '@/lib/i18n'

/**
 * Suspense fallback for /search while the param-reading body resolves:
 * a grid of card skeletons behind a role="status" announcer (rule 4).
 */
export default function SearchResultsSkeleton() {
  const { t } = useTranslation('search')
  return (
    <div
      role="status"
      aria-label={t('loading')}
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  )
}
