import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import Providers from '@/components/Providers'
import ThemeToggle from '@/components/layout/ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('labels itself for the mode it switches to', () => {
    render(
      <Providers>
        <ThemeToggle />
      </Providers>,
    )
    // First visit defaults to light (system preference never matches in jsdom).
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument()
  })

  it('toggles dark mode on <html> and flips its accessible label', async () => {
    const user = userEvent.setup()
    render(
      <Providers>
        <ThemeToggle />
      </Providers>,
    )
    const button = screen.getByRole('button', { name: 'Switch to dark theme' })

    await user.click(button)
    expect(document.documentElement).toHaveClass('dark')
    expect(button).toHaveAttribute('aria-label', 'Switch to light theme')

    await user.click(button)
    expect(document.documentElement).not.toHaveClass('dark')
    expect(button).toHaveAttribute('aria-label', 'Switch to dark theme')
  })

  it('keeps the applied theme in sync after re-render', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <Providers>
        <ThemeToggle />
      </Providers>,
    )
    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }))
    expect(document.documentElement).toHaveClass('dark')
    rerender(
      <Providers>
        <ThemeToggle />
      </Providers>,
    )
    expect(document.documentElement).toHaveClass('dark')
  })
})
