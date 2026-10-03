'use client'

import { useSearchParams } from 'next/navigation'
import SearchResults from './SearchResults'
import { useTranslation } from '@/lib/i18n'

/**
 * Search page body (M7): the `q` URL param is the single source of truth —
 * the header SearchBar writes it (debounced), this reads it. Lives in its own
 * client component so the page can suspend it behind a Suspense boundary
 * (useSearchParams during static prerender).
 */
export function SearchView() {
  const { t } = useTranslation('search')
  const query = useSearchParams().get('q') ?? ''

  return (
    <section aria-label={t('regionLabel')} className="space-y-4">
      <SearchResults query={query} />
    </section>
  )
}

export default SearchView
