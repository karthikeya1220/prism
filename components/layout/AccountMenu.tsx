'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, UserRound } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { cx } from '@/lib/cx'
import { useTranslation } from '@/lib/i18n'

const menuItemClass =
  'flex w-full items-center justify-between gap-3 rounded-control px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-line/60'

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Header account menu on the real NextAuth session: profile identity block,
 * links to settings/profile, and sign-out (→ /login). Fully keyboard-operable:
 * Enter/Space or ArrowDown opens and focuses the first item, ArrowUp/ArrowDown
 * cycle, Escape closes and restores focus, outside pointer-down dismisses.
 */
export function AccountMenu() {
  const { t } = useTranslation('nav')
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  const user = session?.user
  const fallbackName = t('account.fallback')
  const name = user?.name ?? fallbackName
  const initials = user
    ? initialsOf(user.name ?? user.email ?? fallbackName) || '?'
    : ''
  const avatar = user?.avatar ?? null

  useEffect(() => {
    if (!open) return
    const first = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')
    first?.focus()
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!menuRef.current?.contains(t) && !buttonRef.current?.contains(t)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    )
    const index = items.indexOf(document.activeElement as HTMLElement)
    const next =
      e.key === 'ArrowDown'
        ? items[(index + 1) % items.length]
        : items[(index - 1 + items.length) % items.length]
    next?.focus()
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('account.menuFor', { name })}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-1 rounded-control px-1 transition-colors hover:bg-line/60"
      >
        <span
          aria-hidden="true"
          className="grid h-8 w-8 place-items-center rounded-full bg-accent-solid text-sm text-white"
        >
          {status === 'loading' ? (
            <UserRound size={15} />
          ) : avatar ? (
            avatar
          ) : (
            <span className="text-xs font-semibold">{initials}</span>
          )}
        </span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={cx('text-ink-soft transition-transform', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            role="menu"
            aria-label={t('account.label')}
            onKeyDown={onMenuKeyDown}
            initial={reduce ? false : { opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: reduce ? 0 : 0.14 }}
            className="absolute right-0 top-full z-50 mt-2 w-60 origin-top-right rounded-card border border-line bg-surface p-1.5 shadow-pop"
          >
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-medium text-ink">{name}</p>
              <p className="truncate text-xs text-ink-soft">{user?.email ?? '…'}</p>
            </div>
            <hr className="my-1 border-line" />
            <Link
              href="/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={menuItemClass}
            >
              {t('settings')}
            </Link>
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={menuItemClass}
            >
              {t('profile')}
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className={menuItemClass}
            >
              {t('signOut')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AccountMenu
