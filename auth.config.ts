/**
 * Edge-safe NextAuth config (PLAN.md M11): pages, session strategy, and the
 * `authorized` callback used by proxy.ts to protect dashboard routes. No Node
 * APIs here — the Credentials provider lives in auth.ts.
 */
import type { NextAuthConfig } from 'next-auth'

/** Routes reachable without a session (plus /api/auth and static assets). */
export const PUBLIC_PATHS = new Set(['/login', '/signup'])

export const authConfig = {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    /**
     * Runs in proxy.ts. Public pages bounce signed-in users to the dashboard;
     * everything else requires a session (target saved as ?callbackUrl=).
     */
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      const loggedIn = Boolean(auth?.user)
      if (PUBLIC_PATHS.has(pathname)) {
        if (loggedIn) return Response.redirect(new URL('/', request.nextUrl))
        return true
      }
      if (!loggedIn) {
        const login = new URL('/login', request.nextUrl)
        login.searchParams.set('callbackUrl', pathname + request.nextUrl.search)
        return Response.redirect(login)
      }
      return true
    },
  },
} satisfies NextAuthConfig
