/**
 * POST /api/auth/signup — create a demo account (PLAN.md M11). Enforces the
 * same validation as the signup form (lib/auth/validation.ts) and returns a
 * sanitized user — never the password hash. The client then signs in via
 * next-auth `signIn('credentials')`.
 */
import { NextResponse } from 'next/server'
import { createUser, findUserByEmail } from '@/lib/auth/users'
import { validateEmail, validateName, validatePassword } from '@/lib/auth/validation'
import { jsonError, withErrors } from '@/lib/response'

export async function POST(request: Request): Promise<NextResponse> {
  return withErrors(async () => {
    const body: unknown = await request.json().catch(() => null)
    const record = (body ?? {}) as Record<string, unknown>
    const email = typeof record.email === 'string' ? record.email : ''
    const name = typeof record.name === 'string' ? record.name : ''
    const password = typeof record.password === 'string' ? record.password : ''

    const error =
      validateEmail(email) ?? validateName(name) ?? validatePassword(password)
    if (error) return jsonError('BAD_REQUEST', error)
    if (findUserByEmail(email)) {
      return jsonError('BAD_REQUEST', 'An account with this email already exists.')
    }

    const user = createUser({ email, name, password })
    if (!user) {
      return jsonError('BAD_REQUEST', 'An account with this email already exists.')
    }
    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
    })
  })
}
