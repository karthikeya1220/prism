'use client'

import Link from 'next/link'
import { cx } from '@/lib/cx'

/**
 * Prism brand mark: a white prism silhouette on a spectrum tile — the only
 * place (besides the active nav indicator) where the brand gradient appears.
 * Links home; the wordmark becomes screen-reader-only in the collapsed rail.
 */
export function Brand({ showName = true }: { showName?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Prism — go to feed"
      className="flex min-w-0 items-center gap-2.5 rounded-control px-1.5 py-1"
    >
      <span
        aria-hidden="true"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px]"
        style={{ backgroundImage: 'var(--prism-spectrum)' }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor">
          <path d="M12 4.8 20.2 19.2H3.8z" />
        </svg>
      </span>
      <span
        className={cx(
          // Inherits the surrounding tone: sidebar-ink on the rail/drawer,
          // page ink when the wordmark sits in the mobile header.
          'truncate text-[0.95rem] font-semibold tracking-tight text-current',
          !showName && 'sr-only',
        )}
      >
        Prism
      </span>
    </Link>
  )
}

export default Brand
