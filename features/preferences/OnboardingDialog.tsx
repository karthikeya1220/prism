'use client'

import { useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import PreferencesForm from './PreferencesForm'
import { markOnboarded } from './preferencesSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

/**
 * First-run onboarding prompt (M5): a modal dialog asking the user to pick
 * their topics, mounted once in the dashboard layout so it guards every
 * route. Nothing renders until rehydration completes (`hydrated`) —
 * returning users never see a flash of the prompt. Focus moves into the
 * dialog, Tab cycles inside it, Escape / "Skip for now" / "Start reading"
 * all mark onboarding complete (persisted), and focus returns to whatever
 * was focused before it opened. Motion respects prefers-reduced-motion.
 */
export function OnboardingDialog() {
  const hydrated = useAppSelector((state) => state.preferences.hydrated)
  const onboarded = useAppSelector((state) => state.preferences.onboarded)
  const dispatch = useAppDispatch()
  const panelRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const show = hydrated && !onboarded

  const dismiss = useCallback(() => {
    dispatch(markOnboarded())
  }, [dispatch])

  useEffect(() => {
    if (!show) return
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    panelRef.current?.focus()
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dismiss()
        return
      }
      if (event.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      // Restore focus to whatever had it before the dialog opened.
      if (previouslyFocused?.isConnected) previouslyFocused.focus()
    }
  }, [show, dismiss])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="onboarding-backdrop"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.15 }}
          className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm"
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
            initial={reduce ? false : { opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-card border border-line bg-surface p-6 shadow-pop outline-none"
          >
            <span
              aria-hidden="true"
              className="grid h-11 w-11 place-items-center rounded-full bg-accent/10 text-accent"
            >
              <Sparkles size={20} />
            </span>
            <h2 id="onboarding-title" className="mt-4 text-title font-semibold text-ink">
              Make Prism yours
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Pick the topics you care about. Your feed, trending, and
              recommendations all follow these choices — change them any time
              in Settings.
            </p>
            <div className="mt-4">
              <PreferencesForm />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={dismiss}
                className="rounded-control bg-accent-solid px-4 py-2 text-sm font-medium text-on-accent transition-opacity hover:opacity-90"
              >
                Start reading
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-control border border-line px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default OnboardingDialog
