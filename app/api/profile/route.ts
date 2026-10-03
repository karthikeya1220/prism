/**
 * PATCH /api/profile — update the signed-in user's display name / avatar
 * (PLAN.md M11). Auth-guarded via the JWT session; avatar must be one of the
 * preset keys (no uploads). The client refreshes its session afterwards so
 * the AccountMenu reflects the change immediately.
 */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  isAvatarPreset,
  updateProfile,
  type ProfileUpdate,
} from '@/lib/auth/users'
import { validateName } from '@/lib/auth/validation'
import { jsonError, withErrors } from '@/lib/response'

export async function PATCH(request: Request): Promise<NextResponse> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return jsonError('UNAUTHORIZED', 'You must be signed in.')

  return withErrors(async () => {
    const body: unknown = await request.json().catch(() => null)
    const record = (body ?? {}) as Record<string, unknown>
    const patch: ProfileUpdate = {}

    if ('name' in record) {
      const name = typeof record.name === 'string' ? record.name : ''
      const error = validateName(name)
      if (error) return jsonError('BAD_REQUEST', error)
      patch.name = name
    }
    if ('avatar' in record) {
      if (!isAvatarPreset(record.avatar)) {
        return jsonError('BAD_REQUEST', 'Unknown avatar.')
      }
      patch.avatar = record.avatar
    }
    if (Object.keys(patch).length === 0) {
      return jsonError('BAD_REQUEST', 'Nothing to update.')
    }

    const user = updateProfile(userId, patch)
    if (!user) return jsonError('NOT_FOUND', 'Account not found.')
    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
    })
  })
}
