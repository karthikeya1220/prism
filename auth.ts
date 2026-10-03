/**
 * Full NextAuth (v5) setup (PLAN.md M11): Credentials provider backed by the
 * in-memory demo user store (lib/auth/users.ts), JWT sessions, and a session
 * callback that re-reads the store so profile edits appear on refetch.
 *
 * Used by the route handler (app/api/auth/[...nextauth]) and server code via
 * `auth()`. proxy.ts only imports the edge-safe auth.config.ts.
 */
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from './auth.config'
import { findUserById, verifyCredentials } from '@/lib/auth/users'
import type { Avatar } from '@/types/auth'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: (credentials) => {
        const email = typeof credentials?.email === 'string' ? credentials.email : ''
        const password = typeof credentials?.password === 'string' ? credentials.password : ''
        if (!email || !password) return null
        const user = verifyCredentials(email, password)
        if (!user) return null
        return { id: user.id, email: user.email, name: user.name, avatar: user.avatar }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? token.sub ?? ''
        token.avatar = (user as { avatar?: Avatar }).avatar ?? null
      }
      return token
    },
    session({ session, token }) {
      // Fresh profile read: a PATCH /api/profile + update() reflects immediately.
      const fresh = token.id ? findUserById(token.id) : undefined
      session.user.id = token.id as string
      session.user.name = fresh?.name ?? session.user.name
      session.user.email = fresh?.email ?? session.user.email
      session.user.avatar = fresh ? fresh.avatar : ((token.avatar as Avatar | null) ?? null)
      return session
    },
  },
})
