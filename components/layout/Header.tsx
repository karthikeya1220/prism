'use client'

import type { RefObject } from 'react'
import Link from 'next/link'
import { Menu, Settings } from 'lucide-react'
import AccountMenu from './AccountMenu'
import Brand from './Brand'
import SearchBar from './SearchBar'
import ThemeToggle from './ThemeToggle'
import { cx } from '@/lib/cx'
import { iconButtonClass } from '@/components/ui/icon-button'

export interface HeaderProps {
  /** Current pathname; highlights the settings action when it matches. */
  activePath: string
  /** Opens the mobile drawer (mobile only). */
  onOpenMenu: () => void
  /** Owned by AppShell so closing the drawer can restore focus here. */
  menuButtonRef: RefObject<HTMLButtonElement | null>
}

/**
 * Sticky command bar: navigation trigger + brand (mobile), search, theme,
 * settings, and the account menu. Blurs the canvas slightly so scrolled
 * content passes underneath without colliding.
 */
export function Header({ activePath, onOpenMenu, menuButtonRef }: HeaderProps) {
  const settingsActive = activePath === '/settings'
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-10">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
          className={cx(iconButtonClass, 'lg:hidden')}
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        {/* Brand only in the mid range: hidden on small screens (keeps the
            search usable at 375 px) and at lg+ (the rail already shows it). */}
        <span className="hidden sm:flex lg:hidden">
          <Brand />
        </span>

        <SearchBar className="min-w-0 flex-1 sm:max-w-md" />

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          <Link
            href="/settings"
            aria-label="Settings"
            aria-current={settingsActive ? 'page' : undefined}
            className={cx(
              iconButtonClass,
              settingsActive && 'bg-accent/10 text-accent hover:text-accent',
            )}
          >
            <Settings size={18} aria-hidden="true" />
          </Link>
          <AccountMenu />
        </div>
      </div>
    </header>
  )
}

export default Header
