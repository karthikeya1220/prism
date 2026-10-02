'use client'

import { useEffect } from 'react'
import { Undo2, X } from 'lucide-react'

export interface ToastProps {
  /** Short confirmation line ("Removed “Headline”"). */
  message: string
  /** Reverses the action — wired to re-adding the favorite. */
  onUndo: () => void
  /** Closes the toast without undoing. */
  onDismiss: () => void
  /** Auto-dismiss delay in ms (default 6 s). */
  duration?: number
}

/**
 * Undo toast: a polite live region anchored to the bottom of the viewport.
 * Announces the completed action, offers a single-click undo, and
 * self-dismisses after `duration` (timer cleared on unmount).
 */
export function Toast({ message, onUndo, onDismiss, duration = 6000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [onDismiss, duration])

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
    >
      <div className="flex items-center gap-3 rounded-control border border-sidebar-line bg-sidebar px-4 py-3 text-sm text-white shadow-pop">
        <span className="min-w-0 flex-1 truncate">{message}</span>
        <button
          type="button"
          onClick={onUndo}
          className="inline-flex shrink-0 items-center gap-1.5 rounded px-2 py-1 font-semibold text-white underline decoration-white/40 underline-offset-2 transition hover:decoration-white"
        >
          <Undo2 size={14} aria-hidden="true" />
          Undo
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="grid h-7 w-7 shrink-0 place-items-center rounded text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export default Toast
