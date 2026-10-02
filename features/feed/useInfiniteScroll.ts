'use client'

import { useEffect, useRef } from 'react'

/**
 * Infinite scroll via an IntersectionObserver sentinel (no dependency).
 *
 * Attach the returned ref to a marker element below the feed; `onHit` fires
 * each time it enters the viewport (rootMargin pre-fetches ~1 screen early).
 * Pass `enabled: false` while a page is in flight to avoid stacking requests —
 * re-enabling re-observes and fires again if the sentinel is still visible.
 * Environments without IntersectionObserver (jsdom) simply no-op.
 */
export function useInfiniteScroll(onHit: () => void, enabled: boolean) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const hitRef = useRef(onHit)

  useEffect(() => {
    hitRef.current = onHit
  })

  useEffect(() => {
    if (!enabled) return
    const node = sentinelRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) hitRef.current()
      },
      { rootMargin: '600px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled])

  return sentinelRef
}
