import type { Metadata } from 'next'
import FeedSection from '@/features/feed/FeedSection'
import { T } from '@/lib/i18n/T'

export const metadata: Metadata = { title: 'Feed — Prism' }

/** Personalized unified feed — the app's landing view (R6). */
export default function FeedPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-display font-semibold text-ink">
          <T ns="pages" k="feed.title" />
        </h1>
        <p className="max-w-[60ch] text-ink-soft">
          <T ns="pages" k="feed.subtitle" />
        </p>
      </header>
      <section
        id="feed"
        aria-labelledby="feed-heading"
        className="scroll-mt-24 space-y-4"
      >
        <h2 id="feed-heading" className="text-title font-semibold text-ink">
          <T ns="pages" k="feed.latest" />
        </h2>
        <FeedSection />
      </section>
    </div>
  )
}
