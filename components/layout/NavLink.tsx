'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { cx } from '@/lib/cx'

export interface NavLinkProps {
  href: string
  label: string
  icon: LucideIcon
  /** Marks the current destination via aria-current="page". */
  isActive: boolean
  /** Icon-only presentation (collapsed rail); the label stays screen-reader-only. */
  collapsed?: boolean
  /** Fires on activation — used to close the mobile drawer. */
  onNavigate?: () => void
}

/**
 * Sidebar destination. The active link is announced with aria-current="page"
 * and carries the spectrum indicator — the second and last home of the brand
 * gradient. In the collapsed rail the visible label hides but is never
 * removed, so screen readers keep the accessible name.
 */
export function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  collapsed,
  onNavigate,
}: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      className={cx(
        'group relative flex items-center gap-3 rounded-control py-2 text-sm transition-colors',
        collapsed ? 'justify-center px-2' : 'px-3',
        isActive
          ? 'bg-sidebar-active font-medium text-white'
          : 'text-sidebar-ink-soft hover:bg-sidebar-active/60 hover:text-sidebar-ink',
      )}
    >
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
          style={{ backgroundImage: 'var(--prism-spectrum)' }}
        />
      )}
      <Icon size={18} aria-hidden="true" className="shrink-0" />
      <span className={cx(collapsed && 'sr-only')}>{label}</span>
    </Link>
  )
}

export default NavLink
