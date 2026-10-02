/**
 * Integration: favorites add → group rendering → remove with undo toast →
 * restore, plus type filter chips (R8, M5).
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { beforeEach, describe, expect, it } from 'vitest'
import FavoritesView from '@/features/favorites/FavoritesView'
import { addFavorite } from '@/features/favorites/favoritesSlice'
import { makeTestStore, movieFixture, newsFixture, socialFixture } from '../helpers'
import type { AppStore } from '@/store'

function seedStore(): AppStore {
  const store = makeTestStore()
  store.dispatch(addFavorite(newsFixture('news:keep', 'Chip supply crunch eases')))
  store.dispatch(addFavorite(movieFixture('movie:keep', 'Orbital Winter')))
  store.dispatch(addFavorite(socialFixture('social:keep', 'Thread: shipping the dashboard')))
  return store
}

describe('favorites', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('lists favorites grouped by type and removes with an undo toast', async () => {
    const user = userEvent.setup()
    const store = seedStore()

    render(
      <Provider store={store}>
        <FavoritesView />
      </Provider>,
    )

    // Grouped by type with counts.
    expect(screen.getByRole('heading', { name: /^news/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^movies/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^social/i })).toBeInTheDocument()
    expect(screen.getByText('Chip supply crunch eases')).toBeInTheDocument()

    // Remove via the card's heart — the toast confirms with Undo.
    await user.click(
      screen.getByRole('button', { name: 'Remove Chip supply crunch eases from favorites' }),
    )
    expect(screen.queryByText('Chip supply crunch eases')).not.toBeInTheDocument()
    expect(store.getState().favorites.ids).not.toContain('news:keep')
    const toast = await screen.findByRole('status')
    expect(toast).toHaveTextContent('Removed “Chip supply crunch eases”')

    // Undo restores the snapshot exactly.
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByText('Chip supply crunch eases')).toBeInTheDocument()
    expect(store.getState().favorites.ids).toContain('news:keep')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('filters groups with the type chips', async () => {
    const user = userEvent.setup()

    render(
      <Provider store={seedStore()}>
        <FavoritesView />
      </Provider>,
    )

    await user.click(screen.getByRole('button', { name: 'Movies (1)' }))
    expect(screen.getByRole('button', { name: 'Movies (1)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('heading', { name: /^movies/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /^news/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Chip supply crunch eases')).not.toBeInTheDocument()
    expect(screen.getByText('Orbital Winter')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'All (3)' }))
    expect(screen.getByText('Chip supply crunch eases')).toBeInTheDocument()
  })

  it('shows an empty state with a CTA back to the feed when nothing is saved', () => {
    render(
      <Provider store={makeTestStore()}>
        <FavoritesView />
      </Provider>,
    )

    expect(screen.getByText('No favorites yet')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Browse your feed' }),
    ).toHaveAttribute('href', '/')
  })
})
