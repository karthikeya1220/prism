/**
 * Shared API contracts between /app/api/* route handlers, the RTK Query layer,
 * and the UI (see PLAN.md §4).
 */
import type { ContentItem } from './content'

/** Where a successful page's data came from — surfaced as a subtle UI badge. */
export type ContentSource = 'live' | 'cache' | 'mock'

/** One page of normalized content. `pageSize` is always PAGE_SIZE (12). */
export interface ContentPage<T extends ContentItem> {
  items: T[]
  page: number
  pageSize: number
  totalResults: number
  hasMore: boolean
  source: ContentSource
}

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UPSTREAM_ERROR'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'INTERNAL'

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode
    /** Human-readable and safe to display; never leaks keys or stack traces. */
    message: string
  }
}
