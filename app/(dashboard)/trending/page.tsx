import type { Metadata } from 'next'
import TrendingView from '@/features/feed/TrendingView'
import { T } from '@/lib/i18n/T'

export const metadata: Metadata = { title: 'Trending — Prism' }

/** Trending: category tabs over news/movies/social risers (R7). */
export default function TrendingPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-display font-semibold text-ink">
          <T ns="pages" k="trending.title" />
        </h1>
        <p className="max-w-[60ch] text-ink-soft">
          <T ns="pages" k="trending.subtitle" />
        </p>
      </header>
      <TrendingView />
    </div>
  )
}
