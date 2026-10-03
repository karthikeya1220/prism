/**
 * Route protection (PLAN.md M11). Next 16 renamed middleware → proxy; this
 * proxy uses the edge-safe NextAuth config (auth.config.ts) whose `authorized`
 * callback requires a session for dashboard pages, redirects signed-in users
 * off /login and /signup, and preserves the target as ?callbackUrl=.
 */
import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

// Plain named export so Next's static export analysis (and the runtime) both
// recognize it — destructured `export const { auth: proxy }` trips a dev error.
const nextAuth = NextAuth(authConfig)
export const proxy = nextAuth.auth

export const config = {
  // Protect all pages; skip API routes, Next internals, and image assets.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
