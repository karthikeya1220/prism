/**
 * SearchBar unit tests (M7): prove the 400 ms debounce (URL sync happens
 * only after the pause, not per keystroke), the min-2-char gate, trimming,
 * Enter flush, Escape clear, and "/" focus. next/navigation is mocked
 * (project convention — no router provider in jsdom); replace() calls are
 * the URL-sync assertions. Real timers: 400 ms waits are trivially cheap and
 * avoid the userEvent×fake-timer deadlock under Vitest 5.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SearchBar, MIN_QUERY_LENGTH } from '@/components/layout/SearchBar'

const replace = vi.fn()
let currentQuery = ''

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(currentQuery),
}))

function renderBar() {
  return render(<SearchBar />)
}

const input = () => screen.getByLabelText('Search news, movies, and posts')

describe('SearchBar', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    replace.mockClear()
    currentQuery = ''
  })

  it('exposes a 2-character minimum', () => {
    expect(MIN_QUERY_LENGTH).toBe(2)
  })

  it('syncs to /search?q= only after the 400 ms debounce', async () => {
    const user = userEvent.setup()
    renderBar()

    await user.type(input(), 'news')
    // No per-keystroke navigation, and nothing fires within the pause window.
    expect(replace).not.toHaveBeenCalled()

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/search?q=news'), {
      timeout: 1000,
    })
  })

  it('does not sync for a one-character query', async () => {
    const user = userEvent.setup()
    renderBar()

    await user.type(input(), 'n')
    await new Promise((resolve) => setTimeout(resolve, 600))

    expect(replace).not.toHaveBeenCalled()
  })

  it('trims whitespace before syncing the URL', async () => {
    const user = userEvent.setup()
    renderBar()

    await user.type(input(), '  ai  ')
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/search?q=ai'), {
      timeout: 1000,
    })
  })

  it('fires once per typing pause, not per keystroke', async () => {
    const user = userEvent.setup()
    renderBar()

    await user.type(input(), 'ne')
    await new Promise((resolve) => setTimeout(resolve, 300))
    await user.type(input(), 'w')
    await new Promise((resolve) => setTimeout(resolve, 300))
    // 300 ms pauses: still inside the debounce window — nothing yet.
    expect(replace).not.toHaveBeenCalled()

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/search?q=new'), {
      timeout: 1000,
    })
    expect(replace).toHaveBeenCalledTimes(1)
  })

  it('flushes the debounce on Enter', async () => {
    const user = userEvent.setup()
    renderBar()

    await user.type(input(), 'jazz')
    expect(replace).not.toHaveBeenCalled()
    await user.keyboard('{Enter}')

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/search?q=jazz'))
  })

  it('clears with Escape and refocuses the input', async () => {
    const user = userEvent.setup()
    currentQuery = 'q=drama'
    const { unmount } = renderBar()

    await user.type(input(), '{Escape}')

    expect(replace).toHaveBeenCalledWith('/search')
    expect(input()).toHaveValue('')
    expect(input()).toHaveFocus()
    unmount()
    currentQuery = ''
  })

  it('focuses the input when / is pressed outside a text field', async () => {
    const user = userEvent.setup()
    renderBar()

    await user.keyboard('/')

    expect(input()).toHaveFocus()
  })

  it('does not hijack / while typing inside the input', async () => {
    const user = userEvent.setup()
    renderBar()

    await user.click(input())
    await user.keyboard('a/b')

    expect(input()).toHaveValue('a/b')
  })

  it('clears via the Clear search button and keeps focus', async () => {
    const user = userEvent.setup()
    renderBar()

    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
    await user.type(input(), 'news')
    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(input()).toHaveValue('')
    expect(input()).toHaveFocus()
  })

  it('wraps the input in a search landmark with an accessible hint', () => {
    renderBar()
    expect(screen.getByRole('search')).toBeInTheDocument()
    expect(screen.getByRole('searchbox')).toHaveAttribute(
      'aria-describedby',
      'global-search-hint',
    )
  })
})
