'use client'

import { Flame, Heart, Newspaper, PanelLeftClose, PanelLeftOpen, SlidersHorizontal, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Brand from './Brand'
import NavLink from './NavLink'
import { cx } from '@/lib/cx'
import { useTranslation } from '@/lib/i18n'

interface NavItem {
  href: string
  /** i18n key inside the `nav` namespace (labels translate at render). */
  key: 'feed' | 'trending' | 'favorites' | 'settings'
  icon: LucideIcon
}

/** Destinations shown in both the desktop rail and the mobile drawer. */
const NAV_ITEMS: NavItem[] = [
  { href: '/', key: 'feed', icon: Newspaper },
  { href: '/trending', key: 'trending', icon: Flame },
  { href: '/favorites', key: 'favorites', icon: Heart },
  { href: '/settings', key: 'settings', icon: SlidersHorizontal },
]

export interface SidebarProps {
  /** Current pathname (from usePathname) used for active highlighting. */
  activePath: string
  /** Persistent desktop rail (default) or the mobile slide-over content. */
  variant?: 'rail' | 'drawer'
  /** Icon-only rail; labels stay screen-reader-only. */
  collapsed?: boolean
  onToggleCollapse?: () => void
  /** Called when a destination is activated (closes the drawer). */
  onNavigate?: () => void
  /** Drawer-only close button handler. */
  onClose?: () => void
}

/**
 * Primary navigation on the ink "instrument frame". Desktop gets a fixed,
 * collapsible rail with a collapse control; mobile renders the same list
 * inside the slide-over drawer. One landmark (`nav[aria-label="Primary"]`),
 * four links, aria-current on the active destination.
 */
export function Sidebar({
  activePath,
  variant = 'rail',
  collapsed = false,
  onToggleCollapse,
  onNavigate,
  onClose,
}: SidebarProps) {
  const { t } = useTranslation('nav')
  const links = (
    <ul className="space-y-1">
      {NAV_ITEMS.map((item) => (
        <li key={item.href}>
          <NavLink
            href={item.href}
            label={t(item.key)}
            icon={item.icon}
            isActive={activePath === item.href}
            collapsed={variant === 'rail' && collapsed}
            onNavigate={onNavigate}
          />
        </li>
      ))}
    </ul>
  )

  if (variant === 'drawer') {
    return (
      <div className="flex h-full flex-col bg-sidebar text-sidebar-ink">
        <div className="flex items-center justify-between border-b border-sidebar-line px-4 py-3.5">
          <Brand />
          <button
            type="button"
            onClick={onClose}
            aria-label={t('closeMenu')}
            className="grid h-9 w-9 place-items-center rounded-control text-sidebar-ink-soft transition-colors hover:bg-sidebar-active hover:text-white"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label={t('primaryNav')} className="flex-1 overflow-y-auto p-3">
          {links}
        </nav>
      </div>
    )
  }

  return (
    <aside
      className={cx(
        'fixed inset-y-0 left-0 z-40 hidden w-[var(--rail)] flex-col border-r border-sidebar-line bg-sidebar text-sidebar-ink transition-[width] duration-200 ease-out motion-reduce:transition-none lg:flex',
      )}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <Brand showName={!collapsed} />
      </div>
      <nav aria-label={t('primaryNav')} className="flex-1 overflow-y-auto px-3 py-2">
        {links}
      </nav>
      {onToggleCollapse && (
        <div className="border-t border-sidebar-line p-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
            aria-label={collapsed ? t('expandSidebar') : t('collapseSidebar')}
            className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-sm text-sidebar-ink-soft transition-colors hover:bg-sidebar-active hover:text-white"
          >
            {collapsed ? (
              <PanelLeftOpen size={18} aria-hidden="true" className="shrink-0" />
            ) : (
              <PanelLeftClose size={18} aria-hidden="true" className="shrink-0" />
            )}
            <span className={cx(collapsed && 'sr-only')}>{t('collapse')}</span>
          </button>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
