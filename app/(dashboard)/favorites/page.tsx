import type { Metadata } from 'next'
import FavoritesView from '@/features/favorites/FavoritesView'
import { T } from '@/lib/i18n/T'

export const metadata: Metadata = { title: 'Favorites — Prism' }

/** Favorites: everything you kept, grouped by type with an undoable remove (R8). */
export default function FavoritesPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-display font-semibold text-ink">
          <T ns="pages" k="favorites.title" />
        </h1>
        <p className="max-w-[60ch] text-ink-soft">
          <T ns="pages" k="favorites.subtitle" />
        </p>
      </header>
      <FavoritesView />
    </div>
  )
}
