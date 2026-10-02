/**
 * Uniform JSON responses for all /api/* route handlers (PLAN.md §4).
 * Success → ContentPage; failure → ApiErrorBody with a matching status.
 */
import { NextResponse } from 'next/server'
import type { ApiErrorBody, ApiErrorCode, ContentItem, ContentPage } from '@/types'
import { ValidationError } from './validate'

/** Wrap a page as a 200 JSON response. */
export function jsonPage<T extends ContentItem>(page: ContentPage<T>): NextResponse {
  return NextResponse.json(page)
}

/** Map an error code to its HTTP status. */
export function statusForCode(code: ApiErrorCode): number {
  switch (code) {
    case 'BAD_REQUEST':
      return 400
    case 'NOT_FOUND':
      return 404
    case 'RATE_LIMITED':
      return 429
    case 'UPSTREAM_ERROR':
      return 502
    case 'INTERNAL':
      return 500
  }
}

/** Build a JSON error response with the right status code. */
export function jsonError(code: ApiErrorCode, message: string): NextResponse {
  const body: ApiErrorBody = { error: { code, message } }
  return NextResponse.json(body, { status: statusForCode(code) })
}

/**
 * Run a handler with uniform error mapping: ValidationError → 400, everything
 * else → 500 with a generic message (never leaks internals).
 */
export async function withErrors(
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await handler()
  } catch (error) {
    if (error instanceof ValidationError) {
      return jsonError('BAD_REQUEST', error.message)
    }
    console.error('[api] unhandled error', error)
    return jsonError('INTERNAL', 'Something went wrong. Please try again.')
  }
}
