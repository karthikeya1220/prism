import type { Metadata } from 'next'
import { TrendingUp } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'

export const metadata: Metadata = { title: 'Trending — Prism' }

/** Trending page (M4 shell): the cross-type risers section lands in M9. */
export default function TrendingPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-display font-semibold text-ink">Trending</h1>
        <p className="max-w-[60ch] text-ink-soft">
          What is rising fastest across news, films, and social right now.
        </p>
      </header>
      <section
        id="trending"
        aria-labelledby="trending-heading"
        className="scroll-mt-24 space-y-4"
      >
        <h2 id="trending-heading" className="text-title font-semibold text-ink">
          Rising now
        </h2>
        <EmptyState
          icon={<TrendingUp size={20} aria-hidden="true" />}
          title="Nothing is trending yet"
          hint="Once your feed starts flowing, Prism ranks the items gaining momentum and surfaces them here."
        />
      </section>
    </div>
  )
}
