/**
 * Demo auth store (PLAN.md M11): scrypt hashing round-trips, the seeded demo
 * user verifies WITHOUT plaintext in the codebase, sign-ups hash passwords,
 * and profile updates validate their inputs.
 */
import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/auth/passwords'
import {
  AVATAR_PRESETS,
  createUser,
  findUserByEmail,
  isAvatarPreset,
  updateProfile,
  verifyCredentials,
} from '@/lib/auth/users'

describe('password hashing', () => {
  it('round-trips and rejects the wrong password', () => {
    const stored = hashPassword('correct horse battery staple')
    expect(stored).toMatch(/^[0-9a-f]+:[0-9a-f]{128}$/)
    expect(stored).not.toContain('correct horse')
    expect(verifyPassword('correct horse battery staple', stored)).toBe(true)
    expect(verifyPassword('wrong password', stored)).toBe(false)
  })

  it('salts every hash (same input, different output)', () => {
    expect(hashPassword('same-input')).not.toBe(hashPassword('same-input'))
  })

  it('rejects malformed stored hashes instead of throwing', () => {
    expect(verifyPassword('x', 'not-a-hash')).toBe(false)
    expect(verifyPassword('x', 'abc:def')).toBe(false)
    expect(verifyPassword('x', '')).toBe(false)
  })
})

describe('demo user seed', () => {
  it('verifies the documented demo credentials from the stored hash', () => {
    const user = verifyCredentials('demo@prism.app', 'PrismDemo!2026')
    expect(user).not.toBeNull()
    expect(user?.name).toBe('Demo User')
    expect(user?.avatar).toBe('🦊')
    expect(user?.passwordHash).toMatch(/^[0-9a-f]+:[0-9a-f]{128}$/)
  })

  it('rejects wrong passwords and unknown emails', () => {
    expect(verifyCredentials('demo@prism.app', 'wrong-password')).toBeNull()
    expect(verifyCredentials('nobody@prism.app', 'PrismDemo!2026')).toBeNull()
  })
})

describe('createUser', () => {
  it('hashes the password and lowercases the email', () => {
    const user = createUser({
      email: '  Case.User@Example.COM ',
      name: 'Case User',
      password: 'supersecret1',
    })
    expect(user).not.toBeNull()
    expect(user?.email).toBe('case.user@example.com')
    expect(user?.passwordHash).not.toContain('supersecret1')
    expect(findUserByEmail('CASE.USER@example.com')).not.toBeNull()
    expect(verifyCredentials('case.user@example.com', 'supersecret1')).not.toBeNull()
    expect(AVATAR_PRESETS).toContain(user?.avatar)
  })

  it('refuses duplicate emails (case-insensitive)', () => {
    expect(
      createUser({ email: 'dup@prism.app', name: 'A', password: 'password1' }),
    ).not.toBeNull()
    expect(
      createUser({ email: 'DUP@prism.app', name: 'B', password: 'password2' }),
    ).toBeNull()
  })
})

describe('updateProfile', () => {
  it('updates the display name and avatar', () => {
    const created = createUser({
      email: 'profile@prism.app',
      name: 'Before',
      password: 'password1',
    })
    const updated = updateProfile(created!.id, { name: 'After', avatar: '🚀' })
    expect(updated?.name).toBe('After')
    expect(updated?.avatar).toBe('🚀')
    expect(findUserByEmail('profile@prism.app')?.name).toBe('After')
  })

  it('returns null for unknown ids and partial patches keep old values', () => {
    expect(updateProfile('user_missing', { name: 'X' })).toBeNull()
    const created = createUser({
      email: 'partial@prism.app',
      name: 'Keep',
      password: 'password1',
    })
    const updated = updateProfile(created!.id, { avatar: '🌙' })
    expect(updated?.name).toBe('Keep')
    expect(updated?.avatar).toBe('🌙')
  })
})

describe('isAvatarPreset', () => {
  it('accepts presets and null, rejects arbitrary strings', () => {
    expect(isAvatarPreset('🦊')).toBe(true)
    expect(isAvatarPreset(null)).toBe(true)
    expect(isAvatarPreset('<img onerror=alert(1)>')).toBe(false)
    expect(isAvatarPreset(42)).toBe(false)
  })
})
