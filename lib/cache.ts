/**
 * Minimal in-memory TTL cache for route handlers (PLAN.md §4). Protects
 * upstream free tiers (e.g. NewsAPI's 100 req/day) and smooths burst traffic.
 * Entries may be served stale as a degraded fallback by `peek`.
 */

interface Entry<T> {
  value: T
  expiresAt: number
}

const store = new Map<string, Entry<unknown>>()

/**
 * Hard cap on entries so attacker-chosen keys (e.g. arbitrary `q` values)
 * cannot grow the map without bound; oldest insertion is evicted first
 * (Map preserves insertion order).
 */
export const MAX_CACHE_ENTRIES = 250

/** Build a stable cache key from an endpoint name and its params. */
export function cacheKey(endpoint: string, params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${String(params[k])}`)
    .join('&')
  return `${endpoint}:${sorted}`
}

/** Store a value with a time-to-live in milliseconds. */
export function setCache<T>(key: string, value: T, ttlMs: number): void {
  if (!store.has(key) && store.size >= MAX_CACHE_ENTRIES) {
    const oldest = store.keys().next().value
    if (oldest !== undefined) store.delete(oldest)
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

/** Return the cached value if present and fresh, else undefined. */
export function getCache<T>(key: string): T | undefined {
  const entry = store.get(key) as Entry<T> | undefined
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    // Evict on read so expired entries do not linger until size pressure.
    store.delete(key)
    return undefined
  }
  return entry.value
}

/** Return the cached value even if stale (degraded-mode fallback), else undefined. */
export function peekCache<T>(key: string): T | undefined {
  const entry = store.get(key) as Entry<T> | undefined
  return entry?.value
}

/** Test helper: drop every cached entry. */
export function clearCache(): void {
  store.clear()
}
