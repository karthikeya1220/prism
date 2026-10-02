/**
 * Integration: Trending tab switching — "All" plus per-category tabs re-query
 * /api/trending with the selected category for each section (news, movies,
 * social), and the active tab exposes proper tablist semantics.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { beforeEach, describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import TrendingView from '@/features/feed/TrendingView'
import { makeTestStore, trendingHandlers } from '../helpers'

describe('trending tabs', () => {
  const requests: string[] = []

  beforeEach(() => {
    requests.length = 0
    window.localStorage.clear()
    server.use(...trendingHandlers(requests))
  })

  it('starts on All, renders the three sections, and refetches per category on tab switch', async () => {
    const user = userEvent.setup()

    render(
      <Provider store={makeTestStore()}>
        <TrendingView />
      </Provider>,
    )

    // All tab selected by default; every section loaded.
    expect(screen.getByRole('tab', { name: 'all' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'technology' })).toHaveAttribute('aria-selected', 'false')
    // Each section echoes its type into the fixture title on the All tab.
    await screen.findByText('News riser — all topics')
    expect(screen.getByText('Movie riser — all topics')).toBeInTheDocument()
    expect(screen.getByText('Social riser — all topics')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /trending news/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /trending movies/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /trending social/i })).toBeInTheDocument()

    // Switching tabs re-queries each section with the new category.
    await user.click(screen.getByRole('tab', { name: 'technology' }))
    expect(screen.getByRole('tab', { name: 'technology' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'all' })).toHaveAttribute('aria-selected', 'false')

    await screen.findByText('News riser — technology')
    expect(screen.getByText('Movie riser — technology')).toBeInTheDocument()
    expect(screen.getByText('Social riser — technology')).toBeInTheDocument()
    expect(screen.queryByText('News riser — all topics')).not.toBeInTheDocument()

    expect(
      requests.some(
        (url) => url.includes('type=news') && url.includes('category=technology'),
      ),
    ).toBe(true)
    expect(
      requests.some(
        (url) => url.includes('type=movie') && url.includes('category=technology'),
      ),
    ).toBe(true)
    expect(
      requests.some(
        (url) => url.includes('type=social') && url.includes('category=technology'),
      ),
    ).toBe(true)
  })

  it('moves selection with arrow keys (tablist keyboard support)', async () => {
    const user = userEvent.setup()

    render(
      <Provider store={makeTestStore()}>
        <TrendingView />
      </Provider>,
    )
    await screen.findByText('News riser — all topics')

    const allTab = screen.getByRole('tab', { name: 'all' })
    allTab.focus()
    await user.keyboard('{ArrowRight}')

    // Tabs are 'all', 'technology', 'business', … — next after all is technology.
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'technology' })).toHaveAttribute(
        'aria-selected',
        'true',
      ),
    )
    expect(screen.getByRole('tab', { name: 'technology' })).toHaveFocus()
  })
})
