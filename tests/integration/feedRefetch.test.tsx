/**
 * Integration (MSW): preference changes refetch the feed with the new
 * categories, and the feed proves all three UI states — loading skeletons,
 * empty, and error + retry — through the real store, RTK Query, and
 * FeedSection (PLAN.md §8, rule 4).
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import FeedSection from '@/features/feed/FeedSection'
import { toggleCategory } from '@/features/preferences/preferencesSlice'
import { feedHandlers, makeTestStore, newsFixture, page } from '../helpers'

describe('feed', () => {
  const requests: string[] = []

  beforeEach(() => {
    requests.length = 0
    window.localStorage.clear()
    server.use(...feedHandlers(requests))
  })

  it('refetches with the new categories when a topic is added', async () => {
    const store = makeTestStore({ categories: ['technology'] })

    render(
      <Provider store={store}>
        <FeedSection />
      </Provider>,
    )

    // Initial load is filtered by the persisted categories.
    await screen.findByText('Tech story one')
    expect(requests.some((url) => url.includes('category=technology'))).toBe(true)
    expect(screen.queryByText('Sports story one')).not.toBeInTheDocument()

    // Adding a topic changes the query args → RTK Query fetches a new entry.
    // URLSearchParams percent-encodes the comma, so decode before matching.
    store.dispatch(toggleCategory('sports'))
    await screen.findByText('Sports story one')
    expect(
      requests.map(decodeURIComponent).some((url) => url.includes('category=technology,sports')),
    ).toBe(true)
    // The first topic's stories stay in the feed.
    expect(screen.getByText('Tech story one')).toBeInTheDocument()
    // Onboarding stays hidden — preferences were hydrated as onboarded.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows skeleton cards while loading and content once resolved', async () => {
    const gate: { resolve?: () => void } = {}
    const hold = new Promise<void>((resolve) => {
      gate.resolve = resolve
    })
    server.use(
      http.get('*/api/news', async () => {
        await hold
        return HttpResponse.json(page([newsFixture('news:delayed', 'Delayed story')]))
      }),
    )

    render(
      <Provider store={makeTestStore()}>
        <FeedSection />
      </Provider>,
    )

    expect(screen.getByRole('status', { name: 'Loading your feed' })).toBeInTheDocument()
    gate.resolve?.()
    await screen.findByText('Delayed story')
    expect(
      screen.queryByRole('status', { name: 'Loading your feed' }),
    ).not.toBeInTheDocument()
  })

  it('shows the empty state when every endpoint returns nothing', async () => {
    server.use(
      http.get('*/api/news', () => HttpResponse.json(page([]))),
      http.get('*/api/movies', () => HttpResponse.json(page([]))),
      http.get('*/api/social', () => HttpResponse.json(page([]))),
    )

    render(
      <Provider store={makeTestStore()}>
        <FeedSection />
      </Provider>,
    )

    await screen.findByText('Nothing matches your topics yet')
    expect(
      screen.getByText('Nothing matches your topics yet'),
    ).toBeInTheDocument()
  })

  it('shows an error state and recovers on retry', async () => {
    const user = userEvent.setup()
    const fail = () =>
      HttpResponse.json(
        { error: { code: 'INTERNAL', message: 'boom' } },
        { status: 500 },
      )
    server.use(
      http.get('*/api/news', fail),
      http.get('*/api/movies', fail),
      http.get('*/api/social', fail),
    )

    render(
      <Provider store={makeTestStore()}>
        <FeedSection />
      </Provider>,
    )

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/could not reach the content services/i)

    // Recover: healthy handlers take precedence, then retry re-issues queries.
    server.use(...feedHandlers(requests))
    await user.click(screen.getByRole('button', { name: /try again/i }))
    await screen.findByText('Tech story one')
  })

  it('keeps healthy content and banners when only one source fails', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('*/api/news', () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL', message: 'boom' } },
          { status: 500 },
        ),
      ),
    )

    render(
      <Provider store={makeTestStore()}>
        <FeedSection />
      </Provider>,
    )

    // Content from the healthy sources still renders next to the warning.
    await screen.findByText('Signal Horizon')
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/may be incomplete/i)

    // Retry recovers once news comes back.
    server.use(...feedHandlers(requests))
    await user.click(screen.getByRole('button', { name: /try again/i }))
    await screen.findByText('Tech story one')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
