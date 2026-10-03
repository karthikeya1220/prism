/** NextAuth route handler: /api/auth/* (sign-in, session, CSRF, sign-out). */
import { handlers } from '@/auth'

export const { GET, POST } = handlers
