import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '@/mocks/server'

// jsdom implements neither matchMedia nor reduced-motion queries; framer-motion
// and the theme sync (components/Providers.tsx) both need it. Minimal stand-in:
// never matches, listeners are no-ops — keeps theme assertions deterministic.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

// jsdom does not implement scrollIntoView; @dnd-kit's keyboard sensor calls it
// when a lifted card sits outside the viewport. No-op stand-in.
if (typeof window !== 'undefined' && typeof Element !== 'undefined' && !('scrollIntoView' in Element.prototype)) {
  ;(Element.prototype as { scrollIntoView?: () => void }).scrollIntoView = () => {}
}

// RTK Query's fetchBaseQuery constructs `new Request('/api/...')` with a
// relative URL. Browsers resolve that against the document, but Node's undici
// Request rejects it (ERR_INVALID_URL). Resolve string inputs against the
// jsdom location so app code can keep using relative API paths.
if (typeof window !== 'undefined' && typeof Request === 'function') {
  const BaseRequest = Request
  globalThis.Request = class RelativeRequest extends BaseRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      super(typeof input === 'string' ? new URL(input, window.location.href).href : input, init)
    }
  } as typeof Request
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => server.close())
