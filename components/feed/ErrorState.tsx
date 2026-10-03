'use client'

import { CloudOff, RotateCcw } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export interface ErrorStateProps {
  /** Fired by the retry button — re-issues the failed queries. */
  onRetry: () => void
  /** Human-readable headline; defaults to a feed-specific message. */
  message?: string
}

/**
 * Error state for data-driven views (rule 4): explains what failed in plain
 * language and offers an immediate retry. Announced via role="alert".
 */
export function ErrorState({ onRetry, message }: ErrorStateProps) {
  const { t } = useTranslation('common')
  const headline = message ?? t('error.title')
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface px-6 py-12 text-center shadow-card"
    >
      <span
        aria-hidden="true"
        className="grid h-11 w-11 place-items-center rounded-full bg-danger/10 text-danger"
      >
        <CloudOff size={20} />
      </span>
      <p className="text-base font-medium text-ink">{headline}</p>
      <p className="max-w-[46ch] text-sm text-ink-soft">{t('error.hint')}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 inline-flex items-center gap-2 rounded-control bg-accent-solid px-4 py-2 text-sm font-medium text-on-accent transition-opacity hover:opacity-90"
      >
        <RotateCcw size={15} aria-hidden="true" />
        {t('tryAgain')}
      </button>
    </div>
  )
}

export default ErrorState
