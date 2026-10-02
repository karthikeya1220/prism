/**
 * Route-handler query param validation (PLAN.md §4). Unknown params are
 * ignored; invalid values produce a typed error so handlers can return a
 * uniform 400.
 */
import { isCategory, type ApiErrorBody, type Category } from '@/types'

export class ValidationError extends Error {
  readonly body: ApiErrorBody

  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
    this.body = { error: { code: 'BAD_REQUEST', message } }
  }
}

/** Shared page size across all content endpoints. */
export const PAGE_SIZE = 12
const MAX_PAGE = 10
const MAX_QUERY_LENGTH = 80

/** Parse `page` (1-based). Defaults to 1; clamps to [1, MAX_PAGE]. */
export function parsePage(value: string | null): number {
  if (value === null || value === '') return 1
  const n = Number.parseInt(value, 10)
  if (Number.isNaN(n)) throw new ValidationError(`Invalid page: ${value}`)
  return Math.min(Math.max(n, 1), MAX_PAGE)
}

/** Parse a comma-separated category list. Defaults to ['general']; unknown
 * entries are a BAD_REQUEST (PLAN.md §4). */
export function parseCategories(value: string | null): Category[] {
  if (value === null || value.trim() === '') return ['general']
  const categories: Category[] = []
  for (const raw of value.split(',')) {
    const candidate = raw.trim().toLowerCase()
    if (!candidate) continue
    if (!isCategory(candidate)) throw new ValidationError(`Unknown category: ${candidate}`)
    categories.push(candidate)
  }
  return categories.length > 0 ? categories : ['general']
}

/** Parse a comma-separated hashtag list (without '#'). Returns [] when absent. */
export function parseHashtags(value: string | null): string[] {
  if (value === null || value.trim() === '') return []
  return value
    .split(',')
    .map((h) => h.trim().replace(/^#/, '').toLowerCase())
    .filter(Boolean)
}

/** Parse the free-text search query; trims and caps length. '' when absent. */
export function parseQuery(value: string | null): string {
  if (value === null) return ''
  const q = value.trim()
  if (q.length > MAX_QUERY_LENGTH) {
    throw new ValidationError(`Query too long (max ${MAX_QUERY_LENGTH} chars)`)
  }
  return q
}

/** Content slice requested from /api/trending; 'all' merges every type. */
export type TrendingType = 'all' | 'news' | 'movie' | 'social'

/** Parse the `type` param for /api/trending. Defaults to 'all'; unknown → 400. */
export function parseTrendingType(value: string | null): TrendingType {
  if (value === null || value.trim() === '' || value === 'all') return 'all'
  if (value === 'news' || value === 'movie' || value === 'social') return value
  throw new ValidationError(`Unknown type: ${value}`)
}
