/**
 * Password hashing for the demo auth store (PLAN.md M11): scrypt with a
 * per-user random salt, timing-safe comparison. Plaintext passwords are
 * never stored — only salt:hash pairs produced here.
 */
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 64

/** Hash a password with a fresh random salt. Returns `salt:hash` (hex). */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex')
  return `${salt}:${hash}`
}

/** Constant-time verification of a password against a stored `salt:hash`. */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const expected = Buffer.from(hash, 'hex')
  if (expected.length !== KEY_LENGTH) return false
  const actual = scryptSync(password, salt, KEY_LENGTH)
  return timingSafeEqual(actual, expected)
}
