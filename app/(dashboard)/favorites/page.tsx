import type { Metadata } from 'next'
import FavoritesView from '@/features/favorites/FavoritesView'

export const metadata: Metadata = { title: 'Favorites — Prism' }

/** Favorites: everything you kept, grouped by type with an undoable remove (R8). */
export default function FavoritesPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-display font-semibold text-ink">Favorites</h1>
        <p className="max-w-[60ch] text-ink-soft">
          Everything you kept, saved on this device and ready to revisit.
        </p>
      </header>
      <FavoritesView />
    </div>
  )
}
