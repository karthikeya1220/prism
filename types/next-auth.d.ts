/**
 * Augment NextAuth session/JWT with the fields Prism stores per user.
 * v5 types live in @auth/core — augment both it (JWT callbacks) and the
 * next-auth re-exports (Session/User used by useSession).
 */
import type { DefaultSession } from 'next-auth'
import type { Avatar } from './auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      avatar: Avatar
    } & DefaultSession['user']
  }

  interface User {
    id: string
    avatar?: Avatar
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string
    avatar?: Avatar
  }
}
