'use client'

import { useCallback, useEffect, useMemo } from 'react'
import type { ContentItem } from '@/types'
import {
  resetSectionOrder,
  selectSectionOrder,
  setSectionOrder,
} from '@/features/layout/layoutSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { applyFeedOrder, sameIds } from './feedOrder'

/**
 * Applies the persisted manual drag order to loaded feed items (M8) and
 * keeps the saved list healthy: ids that arrive via infinite scroll are
 * appended to the saved order, ids that no longer load are pruned, and a
 * saved order with no surviving ids falls back to the algorithm (auto
 * reset). Dispatches only on real changes, so it is loop-safe.
 */
export function useFeedOrder(items: ContentItem[]) {
  const dispatch = useAppDispatch()
  const saved = useAppSelector(selectSectionOrder('feed'))

  const orderedItems = useMemo(() => applyFeedOrder(items, saved), [items, saved])

  useEffect(() => {
    // Nothing saved → natural order already displays correctly; never
    // auto-populate the manual order (the Reset control keys off `saved`).
    if (saved.length === 0 || items.length === 0) return
    const present = new Set(items.map((item) => item.id))
    const kept = saved.filter((id) => present.has(id))
    if (kept.length === 0) {
      // Every saved id is gone (e.g. topic switch) — drop back to the algorithm.
      dispatch(resetSectionOrder('feed'))
      return
    }
    const effective = orderedItems.map((item) => item.id)
    if (!sameIds(effective, saved)) {
      dispatch(setSectionOrder({ section: 'feed', ids: effective }))
    }
  }, [items, orderedItems, saved, dispatch])

  const reorder = useCallback(
    (ids: string[]) => dispatch(setSectionOrder({ section: 'feed', ids })),
    [dispatch],
  )
  const reset = useCallback(() => dispatch(resetSectionOrder('feed')), [dispatch])

  return { orderedItems, isCustomized: saved.length > 0, reorder, reset }
}
