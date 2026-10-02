/**
 * Error type thrown by upstream API adapters so handlers can trigger the
 * cache→mock fallback chain (PLAN.md §4) without coupling to fetch internals.
 */
export class UpstreamError extends Error {
  readonly status: number | undefined

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'UpstreamError'
    this.status = status
  }
}
