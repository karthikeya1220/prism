import type { Metadata } from 'next'
import { Suspense } from 'react'
import SearchView from '@/features/search/SearchView'
import SearchResultsSkeleton from '@/features/search/SearchResultsSkeleton'

export const metadata: Metadata = { title: 'Search — Prism' }

/**
 * Cross-category search results (R9/R10). The `q` param comes from the URL —
 * the header search bar syncs it after a 400 ms debounce. The param-reading
 * body suspends behind a skeleton for prerendering, so the page itself stays
 * statically renderable.
 */
export default function SearchPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-display font-semibold text-ink">Search</h1>
        <p className="max-w-[60ch] text-ink-soft">
          One query across news, films, and social posts — grouped by source.
        </p>
      </header>
      <Suspense fallback={<SearchResultsSkeleton />}>
        <SearchView />
      </Suspense>
    </div>
  )
}
