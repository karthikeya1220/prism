import type { HttpHandler } from 'msw'

/**
 * Default MSW request handlers shared by the Vitest server and the browser
 * worker. Populated in M2/M3 with /api/news|movies|social fixtures.
 */
export const handlers: HttpHandler[] = []
