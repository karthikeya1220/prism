'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { setDarkMode } from '@/features/preferences/preferencesSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { cx } from '@/lib/cx'
import { iconButtonClass } from '@/components/ui/icon-button'

export interface ThemeToggleProps {
  className?: string
}

/**
 * Dark-mode switch. Reads `preferences.darkMode` and dispatches the flip;
 * components/Providers.tsx is the single writer for `<html class="dark">`,
 * so the store stays the source of truth. The icon shows the *current*
 * mode and swaps with a short rotation (instant under reduced motion).
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const dark = useAppSelector((state) => state.preferences.darkMode)
  const dispatch = useAppDispatch()
  const reduce = useReducedMotion()

  return (
    <button
      type="button"
      onClick={() => dispatch(setDarkMode(!dark))}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cx(iconButtonClass, className)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? 'moon' : 'sun'}
          initial={reduce ? false : { opacity: 0, rotate: -30, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, rotate: 30, scale: 0.7 }}
          transition={{ duration: reduce ? 0 : 0.15 }}
          className="grid place-items-center"
        >
          {dark ? (
            <Moon size={18} aria-hidden="true" />
          ) : (
            <Sun size={18} aria-hidden="true" />
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

export default ThemeToggle
