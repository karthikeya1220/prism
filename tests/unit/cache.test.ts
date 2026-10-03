/**
 * TTL cache unit tests: freshness window, evict-on-read, stale peek for
 * degraded mode, and the hard entry cap (FIFO) that keeps attacker-chosen
 * keys from growing the map without bound.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MAX_CACHE_ENTRIES,
  cacheKey,
  clearCache,
  getCache,
  peekCache,
  setCache,
} from '@/lib/cache'

describe('cache', () => {
  beforeEach(() => {
    clearCache()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    clearCache()
  })

  it('serves fresh values and expires them after the TTL', () => {
    setCache('a', { n: 1 }, 1000)
    expect(getCache<{ n: number }>('a')).toEqual({ n: 1 })
    vi.advanceTimersByTime(1001)
    expect(getCache('a')).toBeUndefined()
  })

  it('lets peek serve stale values but evicts them on strict read', () => {
    setCache('stale', 'value', 1000)
    vi.advanceTimersByTime(1001)
    expect(peekCache('stale')).toBe('value') // degraded-mode fallback
    expect(getCache('stale')).toBeUndefined() // strict reads reject stale
    expect(peekCache('stale')).toBeUndefined() // the read evicted the corpse
  })

  it('caps the store at MAX_CACHE_ENTRIES, evicting the oldest key first', () => {
    for (let i = 0; i < MAX_CACHE_ENTRIES; i += 1) setCache(`k${i}`, i, 60_000)
    setCache('newest', 'x', 60_000)

    expect(getCache('k0')).toBeUndefined() // FIFO victim
    expect(getCache('k1')).toBe(1)
    expect(getCache('newest')).toBe('x')

    // Updating an existing key refreshes it without evicting anything else.
    setCache('k1', 'updated', 60_000)
    expect(getCache('k1')).toBe('updated')
    expect(getCache('k2')).toBe(2)
  })

  it('builds order-independent, endpoint-scoped keys', () => {
    expect(cacheKey('news', { b: 2, a: 1 })).toBe(cacheKey('news', { a: 1, b: 2 }))
    expect(cacheKey('news', { a: 1 })).not.toBe(cacheKey('movies', { a: 1 }))
  })
})
