/**
 * Integration (MSW): the search feature end-to-end through the real store and
 * RTK Query — grouped results per source with counts, filter tabs, matched-
 * text highlighting, per-source error isolation, the no-results state, and
 * proof that a superseded query never overwrites newer results (M7).
 *
 * Card titles are wrapped in <span>/<mark> (Highlight), so testing-library's
 * text queries can't see them (no direct text nodes). Group-level assertions
 * therefore read the section's textContent.
 */
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import SearchResults from '@/features/search/SearchResults'
import { makeTestStore, newsFixture, page, searchHandlers } from '../helpers'

function renderResults(query: string) {
  return render(
    <Provider store={makeTestStore()}>
      <SearchResults query={query} />
    </Provider>,
  )
}

const section = (name: string) => screen.getByRole('region', { name })
const sectionHas = (name: string, text: string) =>
  section(name).textContent?.includes(text) ?? false

describe('SearchResults', () => {
  const requests: string[] = []

  beforeEach(() => {
    requests.length = 0
    window.localStorage.clear()
    server.use(...searchHandlers(requests))
  })

  it('renders all three source groups with counts and highlights matches', async () => {
    renderResults('venus')

    await screen.findByRole('region', { name: 'News results' })
    await waitFor(() => expect(sectionHas('News results', 'News hit for venus')).toBe(true))
    expect(sectionHas('Movies results', 'Movie hit for venus')).toBe(true)
    expect(sectionHas('Social results', 'Social hit for venus')).toBe(true)

    // Filter tabs carry the total and per-source counts.
    expect(screen.getByRole('button', { name: /All \(3\)/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /News \(1\)/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Movies \(1\)/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Social \(1\)/ })).toBeInTheDocument()

    // The matched term is wrapped in <mark> elements inside each group.
    for (const name of ['News results', 'Movies results', 'Social results']) {
      const marks = within(section(name)).getAllByText('venus')
      expect(marks.length).toBeGreaterThan(0)
      for (const mark of marks) expect(mark.tagName).toBe('MARK')
    }

    // All three endpoints were queried with the same q.
    expect(requests.filter((url) => url.includes('/api/news?')).length).toBeGreaterThan(0)
    expect(requests.filter((url) => url.includes('/api/movies?')).length).toBeGreaterThan(0)
    expect(requests.filter((url) => url.includes('/api/social?')).length).toBeGreaterThan(0)
    expect(requests.every((url) => url.includes('q=venus'))).toBe(true)
  })

  it('filters groups behind the type tabs', async () => {
    const user = userEvent.setup()
    renderResults('venus')

    await screen.findByRole('region', { name: 'News results' })
    await waitFor(() => expect(sectionHas('News results', 'News hit for venus')).toBe(true))

    await user.click(screen.getByRole('button', { name: /Movies \(1\)/ }))
    expect(sectionHas('Movies results', 'Movie hit for venus')).toBe(true)
    expect(screen.queryByRole('region', { name: 'News results' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Social results' })).not.toBeInTheDocument()
  })

  it('shows the no-results state with suggestions when nothing matches', async () => {
    server.use(
      http.get('*/api/news', () => HttpResponse.json(page([]))),
      http.get('*/api/movies', () => HttpResponse.json(page([]))),
      http.get('*/api/social', () => HttpResponse.json(page([]))),
    )

    renderResults('zzz')

    await screen.findByText(/No results for “zzz”/)
    const suggestions = screen.getAllByRole('link')
    expect(suggestions.length).toBeGreaterThan(0)
    suggestions.forEach((link) =>
      expect(link.getAttribute('href')).toMatch(/^\/search\?q=/),
    )
  })

  it('keeps other sources when one endpoint fails (per-source error)', async () => {
    server.use(
      http.get('*/api/movies', () =>
        HttpResponse.json(
          { error: { code: 'UPSTREAM_ERROR', message: 'tmdb down' } },
          { status: 502 },
        ),
      ),
    )
    renderResults('venus')

    await screen.findByRole('status')
    await waitFor(() => expect(sectionHas('News results', 'News hit for venus')).toBe(true))
    expect(sectionHas('Social results', 'Social hit for venus')).toBe(true)
    expect(sectionHas('Movies results', 'Movie hit for venus')).toBe(false)
    expect(screen.getByRole('status')).toHaveTextContent(/Some sources could not be searched/)
    expect(screen.getByRole('button', { name: 'retry' })).toBeInTheDocument()
  })

  it('shows skeletons while loading, then results', async () => {
    const gate: { resolve?: () => void } = {}
    const hold = new Promise<void>((resolve) => {
      gate.resolve = resolve
    })
    server.use(
      http.get('*/api/news', async () => {
        await hold
        return HttpResponse.json(
          page([newsFixture('news:q-venus', 'News hit for venus')]),
        )
      }),
    )

    renderResults('venus')
    expect(screen.getByRole('status', { name: 'Loading search results' })).toBeInTheDocument()

    gate.resolve?.()
    await waitFor(() => expect(sectionHas('News results', 'News hit for venus')).toBe(true))
    expect(
      screen.queryByRole('status', { name: 'Loading search results' }),
    ).not.toBeInTheDocument()
  })

  it('shows the min-length hint below two characters without fetching', async () => {
    renderResults('v')

    await screen.findByText(/Type at least two characters/i)
    await waitFor(() => expect(requests).toHaveLength(0))
  })

  it('never shows outdated results when a query is superseded (stale request test)', async () => {
    const resolvers: Array<(value: Response) => void> = []
    // The "ab" request is held; every other query answers immediately empty.
    server.use(
      http.get('*/api/news', ({ request }) => {
        const q = new URL(request.url).searchParams.get('q') ?? ''
        if (q === 'ab') {
          return new Promise<Response>((resolve) => {
            resolvers.push(resolve)
          })
        }
        return HttpResponse.json(page([]))
      }),
      http.get('*/api/movies', () => HttpResponse.json(page([]))),
      http.get('*/api/social', () => HttpResponse.json(page([]))),
    )

    const { rerender } = renderResults('ab')
    await screen.findByRole('status', { name: 'Loading search results' })

    rerender(
      <Provider store={makeTestStore()}>
        <SearchResults query="abc" />
      </Provider>,
    )
    await screen.findByText(/No results for “abc”/)

    // Release the stale "ab" response AFTER "abc" resolved. RTK Query aborted
    // the superseded request, so its payload must never hit the screen.
    resolvers.forEach((resolve) =>
      resolve(
        HttpResponse.json(
          page([
            {
              id: 'news:stale',
              type: 'news',
              title: 'STALE RESULT THAT MUST NOT RENDER',
              description: 'stale',
              imageUrl: null,
              url: 'https://example.com/stale',
              source: 'Stale',
              category: 'general',
              publishedAt: '2026-10-01T00:00:00Z',
              author: null,
            },
          ]),
        ),
      ),
    )
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(document.body.textContent).not.toContain('STALE RESULT THAT MUST NOT RENDER')
    expect(screen.getByText(/No results for “abc”/)).toBeInTheDocument()
  })
})
