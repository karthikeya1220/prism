/**
 * Integration (MSW + stubbed EventSource): the feed opens the SSE stream,
 * queues arrivals behind the "N new posts" pill, reveals them on click, and
 * de-dupes repeats (PLAN.md M12). jsdom has no EventSource, so a controllable
 * stub stands in — the hook's guard keeps every other suite unaffected.
 */
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import FeedSection from '@/features/feed/FeedSection'
import type { SocialItem } from '@/types'
import { makeTestStore, socialFixture, page } from '../helpers'

/** Minimal observable EventSource stand-in for jsdom. */
class StubEventSource {
  static instances: StubEventSource[] = []
  url: string
  closed = false
  private listeners = new Map<string, ((event: MessageEvent) => void)[]>()

  constructor(url: string) {
    this.url = url
    StubEventSource.instances.push(this)
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void): void {
    const list = this.listeners.get(type) ?? []
    list.push(listener)
    this.listeners.set(type, list)
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void): void {
    const list = this.listeners.get(type) ?? []
    this.listeners.set(
      type,
      list.filter((entry) => entry !== listener),
    )
  }

  close(): void {
    this.closed = true
  }

  /** Simulate one `event: post` frame from the server. */
  emit(data: unknown): void {
    for (const listener of this.listeners.get('post') ?? []) {
      listener({ data: JSON.stringify(data) } as MessageEvent)
    }
  }
}

const post = (sequence: number): SocialItem => {
  const item = socialFixture(`social:live:${sequence}`, `Live thread number ${sequence}`)
  item.publishedAt = new Date(Date.now() + sequence * 1_000).toISOString()
  return item
}

describe('realtime feed', () => {
  beforeEach(() => {
    StubEventSource.instances.length = 0
    vi.stubGlobal('EventSource', StubEventSource)
    server.use(
      http.get('*/api/news', () => HttpResponse.json(page([]))),
      http.get('*/api/movies', () => HttpResponse.json(page([]))),
      http.get('*/api/social', () =>
        HttpResponse.json(page([socialFixture('social:one', 'A fresh dev thread')])),
      ),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('opens the stream, counts arrivals on the pill, then reveals on click', async () => {
    const user = userEvent.setup()
    const store = makeTestStore()
    render(
      <Provider store={store}>
        <FeedSection />
      </Provider>,
    )

    await screen.findByText('A fresh dev thread')
    await waitFor(() => expect(StubEventSource.instances).toHaveLength(1))
    const stream = StubEventSource.instances[0]
    expect(stream.url).toBe('/api/social/stream')

    // Arrivals queue behind the pill — still not in the grid.
    act(() => stream.emit(post(1)))
    const pill = await screen.findByRole('button', { name: '1 new post' })
    expect(screen.queryByText('Live thread number 1')).not.toBeInTheDocument()

    // A duplicate frame (reconnect replay) must not bump the count.
    act(() => stream.emit(post(1)))
    expect(screen.getByRole('button', { name: '1 new post' })).toBeInTheDocument()

    act(() => stream.emit(post(2)))
    expect(screen.getByRole('button', { name: '2 new posts' })).toBeInTheDocument()

    // The pill lives in a polite live region so arrivals are announced.
    expect(pill.closest('[role="status"]')).toHaveAttribute('aria-live', 'polite')

    // Clicking consumes the queue: posts enter the feed, the pill exits.
    await user.click(pill)
    await screen.findByText('Live thread number 1')
    expect(screen.getByText('Live thread number 2')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /new posts?$/ })).not.toBeInTheDocument(),
    )
    expect(store.getState().realtime.pending).toHaveLength(0)
    expect(store.getState().realtime.live).toHaveLength(2)
  })

  it('closes the connection on unmount and ignores malformed frames', async () => {
    const store = makeTestStore()
    const { unmount } = render(
      <Provider store={store}>
        <FeedSection />
      </Provider>,
    )
    await waitFor(() => expect(StubEventSource.instances).toHaveLength(1))
    const stream = StubEventSource.instances[0]

    act(() => stream.emit('not json at all'))
    act(() => stream.emit({ id: 'news:1', type: 'news' }))
    expect(store.getState().realtime.pending).toHaveLength(0)

    unmount()
    expect(stream.closed).toBe(true)
  })
})
