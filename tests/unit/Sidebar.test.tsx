import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ComponentProps } from 'react'
import Sidebar from '@/components/layout/Sidebar'

// next/link needs the App Router context, which tests don't mount; anchors
// carry everything these tests assert (href, aria-current, click handlers).
vi.mock('next/link', () => ({
  default: function MockLink({ href, children, onClick, ...rest }: ComponentProps<'a'>) {
    return (
      <a
        href={href ?? '#'}
        onClick={(e) => {
          e.preventDefault()
          onClick?.(e)
        }}
        {...rest}
      >
        {children}
      </a>
    )
  },
}))

describe('Sidebar', () => {
  it('renders the four primary destinations as links', () => {
    render(<Sidebar activePath="/" />)
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(nav).getByRole('link', { name: 'Feed' })).toHaveAttribute('href', '/')
    expect(within(nav).getByRole('link', { name: 'Trending' })).toHaveAttribute('href', '/trending')
    expect(within(nav).getByRole('link', { name: 'Favorites' })).toHaveAttribute('href', '/favorites')
    expect(within(nav).getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings')
  })

  it('marks only the active destination with aria-current="page"', () => {
    render(<Sidebar activePath="/trending" />)
    expect(screen.getByRole('link', { name: 'Trending' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Feed' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: 'Favorites' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: 'Settings' })).not.toHaveAttribute('aria-current')
  })

  it('calls onNavigate when a destination is activated', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<Sidebar activePath="/" onNavigate={onNavigate} />)
    await user.click(screen.getByRole('link', { name: 'Favorites' }))
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('keeps labels accessible in the collapsed rail', () => {
    render(<Sidebar activePath="/" collapsed onToggleCollapse={() => {}} />)
    const link = screen.getByRole('link', { name: 'Feed' })
    expect(within(link).getByText('Feed')).toHaveClass('sr-only')
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument()
  })

  it('exposes a collapse control that reports its expanded state', () => {
    render(<Sidebar activePath="/" onToggleCollapse={() => {}} />)
    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('closes the drawer via its close button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Sidebar variant="drawer" activePath="/" onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Close navigation menu' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
