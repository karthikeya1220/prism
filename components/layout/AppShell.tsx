'use client'

import { useState, type CSSProperties, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Header from './Header'
import Sidebar from './Sidebar'
import { useSlideOverDrawer } from '@/hooks/useSlideOverDrawer'

export interface AppShellProps {
  children: ReactNode
}

/**
 * Responsive app shell (M4): collapsible ink sidebar on desktop (lg+), a
 * slide-over drawer below lg, sticky header, skip-to-content link, and page
 * transitions keyed on the pathname. All motion respects reduced-motion.
 * The rail width is published as the `--rail` custom property so the content
 * column and the fixed sidebar can never drift apart.
 */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  const [collapsed, setCollapsed] = useState(false)
  const { open, setOpen, close, triggerRef, panelRef } = useSlideOverDrawer()

  const shellStyle = { '--rail': collapsed ? '5rem' : '16rem' } as CSSProperties

  return (
    <div style={shellStyle} className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-control focus:bg-accent-solid focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-on-accent focus:shadow-pop"
      >
        Skip to content
      </a>

      <Sidebar
        activePath={pathname}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />

      <div className="transition-[padding-left] duration-200 ease-out motion-reduce:transition-none lg:pl-[var(--rail)]">
        <Header
          activePath={pathname}
          onOpenMenu={() => setOpen(true)}
          menuButtonRef={triggerRef}
        />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-10"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={{ duration: reduce ? 0 : 0.2, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            aria-hidden="true"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
            className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-[2px] lg:hidden"
          />
        )}
        {open && (
          <motion.div
            key="drawer"
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={reduce ? false : { x: '-100%' }}
            animate={{ x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: '-100%' }}
            transition={{ duration: reduce ? 0 : 0.22, ease: 'easeOut' }}
            className="fixed inset-y-0 left-0 z-50 w-[min(18rem,85vw)] outline-none lg:hidden"
          >
            <Sidebar
              variant="drawer"
              activePath={pathname}
              onNavigate={close}
              onClose={close}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AppShell
