import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import { cx } from '@/lib/cx'

export interface EmptyStateProps {
  /** What the user is waiting for, in plain language. */
  title: string
  /** One sentence telling them what to do next or why it's empty. */
  hint: string
  /** Optional icon override; defaults to a sparkles glyph. */
  icon?: ReactNode
}

/**
 * Empty-state panel shown by data-driven views before their content exists
 * (rule 4: every data-driven view needs an empty state). Directions the user
 * instead of apologizing.
 */
export function EmptyState({ title, hint, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line bg-surface px-6 py-14 text-center shadow-card">
      <span
        aria-hidden="true"
        className="grid h-11 w-11 place-items-center rounded-full bg-accent/10 text-accent"
      >
        {icon ?? <Sparkles size={20} />}
      </span>
      <p className="text-base font-medium text-ink">{title}</p>
      <p className={cx('max-w-[46ch] text-sm text-ink-soft')}>{hint}</p>
    </div>
  )
}

export default EmptyState
