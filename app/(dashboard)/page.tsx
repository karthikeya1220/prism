import type { Metadata } from 'next'
import FeedSection from '@/features/feed/FeedSection'

export const metadata: Metadata = { title: 'Feed — Prism' }

/** Personalized unified feed — the app's landing view (R6). */
export default function FeedPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-display font-semibold text-ink">Your feed</h1>
        <p className="max-w-[60ch] text-ink-soft">
          News, films, and social posts from your topics, woven into one stream.
        </p>
      </header>
      <section
        id="feed"
        aria-labelledby="feed-heading"
        className="scroll-mt-24 space-y-4"
      >
        <h2 id="feed-heading" className="text-title font-semibold text-ink">
          Latest for you
        </h2>
        <FeedSection />
      </section>
    </div>
  )
}
