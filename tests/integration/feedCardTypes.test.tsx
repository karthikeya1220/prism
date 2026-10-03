/**
 * Integration (MSW): one feed query pass renders all three card variants —
 * news, movie, social — through the real store, RTK Query, buildFeed, and
 * ContentGrid's discriminant dispatch.
 */
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { beforeEach, describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import FeedSection from '@/features/feed/FeedSection'
import { feedHandlers, makeTestStore } from '../helpers'

describe('feed card types', () => {
  beforeEach(() => {
    server.use(...feedHandlers([]))
  })

  it('renders news, movie, and social cards together', async () => {
    render(
      <Provider store={makeTestStore()}>
        <FeedSection />
      </Provider>,
    )

    // One fixture per variant lands in the same grid.
    await screen.findByText('Tech story one') // news
    await screen.findByText('Signal Horizon') // movie
    await screen.findByText('A fresh dev thread') // social

    // Variant-specific affordances prove the right card rendered each item.
    expect(screen.getByRole('link', { name: /read more/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /play now/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view post/i })).toBeInTheDocument()
  })
})
