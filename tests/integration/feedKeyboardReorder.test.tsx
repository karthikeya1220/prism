/**
 * Integration (MSW + RTL): keyboard reordering of the feed (M8) — Space
 * picks a card up, ArrowDown moves it, Space drops it, Escape cancels —
 * with the committed order landing in the persisted layout slice and
 * screen-reader announcements for pickup/drop/cancel. jsdom reports all-zero
 * rects, so feed items get sequential mock rects to drive dnd-kit's
 * sortable coordinate getter.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import FeedSection from '@/features/feed/FeedSection'
import { feedHandlers, makeTestStore } from '../helpers'

/** Sequential, non-overlapping rects for feed items (jsdom → all zeros). */
function installRectMock() {
  const original = Element.prototype.getBoundingClientRect
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const el = this as HTMLElement
    if (el.dataset?.feedId && el.parentElement) {
      const index = Array.from(el.parentElement.children).indexOf(el)
      const top = index * 300
      return {
        x: 0,
        y: top,
        top,
        left: 0,
        right: 1200,
        bottom: top + 260,
        width: 1200,
        height: 260,
        toJSON: () => ({}),
      } as DOMRect
    }
    return original.call(this) as DOMRect
  }
  return () => {
    Element.prototype.getBoundingClientRect = original
  }
}

/** Current visible feed order, condensed to a recognizable fragment. */
const listOrder = () =>
  screen.getAllByRole('listitem').map((li) => li.textContent ?? '')

describe('feed keyboard reorder', () => {
  let restoreRects: () => void

  beforeEach(() => {
    restoreRects = installRectMock()
    server.use(...feedHandlers([]))
  })

  afterEach(() => {
    restoreRects()
  })

  it('cancels a keyboard drag with Escape and keeps the order', async () => {
    const user = userEvent.setup()
    const store = makeTestStore()
    render(
      <Provider store={store}>
        <FeedSection />
      </Provider>,
    )

    await screen.findByText('Tech story one')
    const handle = screen.getByRole('button', { name: 'Reorder Tech story one' })

    await user.click(handle) // focus only — no movement, no pointer drag
    await user.keyboard(' ')
    await waitFor(() =>
      expect(screen.getByText(/picked up card/i)).toBeInTheDocument(),
    )
    // The sensor attaches its window keydown listener on a macrotask.
    await new Promise((resolve) => setTimeout(resolve, 30))
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Escape}')

    await waitFor(() =>
      expect(screen.getByText(/dragging cancelled/i)).toBeInTheDocument(),
    )
    expect(listOrder()[0]).toContain('Tech story one') // untouched
    expect(store.getState().layout.manualOrder.feed).toEqual([])
    expect(
      screen.queryByRole('button', { name: /reset order/i }),
    ).not.toBeInTheDocument()
  })

  it('picks up with Space, moves with arrows, drops, persists, resets', async () => {
    const user = userEvent.setup()
    const store = makeTestStore()
    render(
      <Provider store={store}>
        <FeedSection />
      </Provider>,
    )

    await screen.findByText('Tech story one')
    // Natural feed order: news → movie → social.
    expect(listOrder()[0]).toContain('Tech story one')

    const handles = screen.getAllByRole('button', { name: /^Reorder / })
    expect(handles).toHaveLength(3)

    await user.click(handles[0])
    await user.keyboard(' ')
    await waitFor(() =>
      expect(screen.getByText(/picked up card/i)).toBeInTheDocument(),
    )
    await new Promise((resolve) => setTimeout(resolve, 30))
    await user.keyboard('{ArrowDown}') // move over the movie card
    await user.keyboard(' ') // drop

    await waitFor(() =>
      expect(screen.getByText(/dropped at position 2 of 3/)).toBeInTheDocument(),
    )
    const after = listOrder()
    expect(after[0]).toContain('Signal Horizon')
    expect(after[1]).toContain('Tech story one')
    expect(after[2]).toContain('A fresh dev thread')
    expect(store.getState().layout.manualOrder.feed).toEqual([
      'movie:one',
      'news:tech',
      'social:one',
    ])

    // Reset restores the algorithmic order and clears the persisted order.
    await user.click(screen.getByRole('button', { name: /reset order/i }))
    expect(store.getState().layout.manualOrder.feed).toEqual([])
    expect(listOrder()[0]).toContain('Tech story one')
  })
})
