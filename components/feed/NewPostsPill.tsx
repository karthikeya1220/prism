'use client'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { consumeLive, selectPending } from '@/features/feed/realtimeSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

/**
 * "N new posts" pill (PLAN.md M12): a polite live region above the feed grid
 * that appears while SSE posts are queued. Clicking reveals them (pending
 * moves into the merged `live` stream) and the pill exits — animations are
 * skipped when the user prefers reduced motion.
 */
export function NewPostsPill() {
  const { t } = useTranslation('feed')
  const reduce = useReducedMotion()
  const dispatch = useAppDispatch()
  const count = useAppSelector(selectPending).length

  return (
    <div role="status" aria-live="polite" className="flex justify-center">
      <AnimatePresence>
        {count > 0 && (
          <motion.button
            key="pill"
            type="button"
            onClick={() => dispatch(consumeLive())}
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <ArrowUp size={14} aria-hidden="true" />
            {count === 1
              ? t('liveOne', { n: count })
              : t('liveMany', { n: count })}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
