/**
 * Degraded-mode fallback (PLAN.md §4): when an upstream call fails or is rate
 * limited, serve the last cached page marked 'cache', else deterministic mock
 * data marked 'mock' — the UI never hard-fails.
 */
import type { ContentItem, ContentPage } from '@/types'
import { peekCache } from './cache'

export function pageFromCacheOrMock<T extends ContentItem>(
  cacheKey: string,
  buildMock: () => ContentPage<T>,
): ContentPage<T> {
  const stale = peekCache<ContentPage<T>>(cacheKey)
  if (stale) return { ...stale, source: 'cache' }
  return buildMock()
}
