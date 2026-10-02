import type { Metadata } from 'next'
import { Heart } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'

export const metadata: Metadata = { title: 'Favorites — Prism' }

/** Favorites page (M4 shell): the saved-items section lands in M9. */
export default function FavoritesPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-display font-semibold text-ink">Favorites</h1>
        <p className="max-w-[60ch] text-ink-soft">
          Everything you kept, saved on this device and ready to revisit.
        </p>
      </header>
      <section
        id="favorites"
        aria-labelledby="favorites-heading"
        className="scroll-mt-24 space-y-4"
      >
        <h2 id="favorites-heading" className="text-title font-semibold text-ink">
          Saved items
        </h2>
        <EmptyState
          icon={<Heart size={20} aria-hidden="true" />}
          title="No favorites yet"
          hint="Tap the heart on any card to keep it here — favorites stay put even when you are offline."
        />
      </section>
    </div>
  )
}
