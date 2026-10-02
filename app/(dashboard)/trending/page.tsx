import type { Metadata } from 'next'
import TrendingView from '@/features/feed/TrendingView'

export const metadata: Metadata = { title: 'Trending — Prism' }

/** Trending: category tabs over news/movies/social risers (R7). */
export default function TrendingPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-display font-semibold text-ink">Trending</h1>
        <p className="max-w-[60ch] text-ink-soft">
          What is rising fastest across news, films, and social right now —
          filtered by the topic you pick.
        </p>
      </header>
      <TrendingView />
    </div>
  )
}
