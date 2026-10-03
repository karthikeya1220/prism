/**
 * In-memory user store for the demo auth (PLAN.md M11). No database in this
 * project, so users live in a `globalThis` singleton that survives Next.js
 * dev-module reloads. The demo user is seeded once with a *precomputed scrypt
 * hash* — the plaintext lives only in the README.
 *
 * Note: sign-ups reset when the dev server restarts (by design — mock auth).
 */
import { hashPassword, verifyPassword } from './passwords'
import { AVATAR_PRESETS, isAvatarPreset } from './avatars'

export { AVATAR_PRESETS, isAvatarPreset }

export interface StoredUser {
  id: string
  email: string
  name: string
  avatar: string | null
  /** `salt:hash` — never plaintext. */
  passwordHash: string
}

/**
 * Precomputed scrypt hash of the demo password `PrismDemo!2026`
 * (README documents the credentials). Generated with lib/auth/passwords.ts.
 */
const DEMO_PASSWORD_HASH =
  '25f67940c54d7c5c166d2676deab2c9a:7d36a651d74c086e75b024000420592e7fbfc44e0f6207b8229f184a247dd387f3db129aa9d9afe2ed3d0e404eecd56e994837599dfd5620588e271b789ef5ab'

const DEMO_USER: StoredUser = {
  id: 'user_demo',
  email: 'demo@prism.app',
  name: 'Demo User',
  avatar: '🦊',
  passwordHash: DEMO_PASSWORD_HASH,
}

/** Shared across route bundles via globalThis (dev HMR keeps one instance). */
const globalStore = globalThis as typeof globalThis & { __prismUsers?: Map<string, StoredUser> }

function getUsers(): Map<string, StoredUser> {
  if (!globalStore.__prismUsers) {
    globalStore.__prismUsers = new Map([[DEMO_USER.email, DEMO_USER]])
  }
  return globalStore.__prismUsers
}

/** Case-insensitive lookup by email. */
export function findUserByEmail(email: string): StoredUser | undefined {
  return getUsers().get(email.trim().toLowerCase())
}

/** Lookup by id (used to refresh the session profile). */
export function findUserById(id: string): StoredUser | undefined {
  for (const user of getUsers().values()) if (user.id === id) return user
  return undefined
}

export interface CreateUserInput {
  email: string
  name: string
  password: string
}

/** Create a user with a hashed password. Returns null when the email exists. */
export function createUser(input: CreateUserInput): StoredUser | null {
  const email = input.email.trim().toLowerCase()
  if (findUserByEmail(email)) return null
  const user: StoredUser = {
    id: `user_${randomSuffix()}`,
    email,
    name: input.name.trim(),
    avatar: AVATAR_PRESETS[getUsers().size % AVATAR_PRESETS.length],
    passwordHash: hashPassword(input.password),
  }
  getUsers().set(email, user)
  return user
}

/** Verify credentials; returns the user or null. */
export function verifyCredentials(email: string, password: string): StoredUser | null {
  const user = findUserByEmail(email)
  if (!user) return null
  return verifyPassword(password, user.passwordHash) ? user : null
}

export interface ProfileUpdate {
  name?: string
  avatar?: string | null
}

/** Update display name / avatar. Returns the fresh user or null if not found. */
export function updateProfile(id: string, patch: ProfileUpdate): StoredUser | null {
  const user = findUserById(id)
  if (!user) return null
  const next: StoredUser = {
    ...user,
    name: patch.name !== undefined ? patch.name.trim() : user.name,
    avatar: patch.avatar !== undefined ? patch.avatar : user.avatar,
  }
  getUsers().set(next.email, next)
  return next
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10)
}
