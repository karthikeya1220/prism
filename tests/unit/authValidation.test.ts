/**
 * Auth form validation (PLAN.md M11): shared client/server rules plus the
 * open-redirect guard for ?callbackUrl=.
 */
import { describe, expect, it } from 'vitest'
import {
  safeCallbackUrl,
  validateEmail,
  validateName,
  validatePassword,
} from '@/lib/auth/validation'

describe('validateEmail', () => {
  it('accepts a normal address', () => {
    expect(validateEmail('demo@prism.app')).toBeNull()
    expect(validateEmail('  user+tag@example.co.uk ')).toBeNull()
  })

  it('rejects empty, malformed, and oversized addresses', () => {
    expect(validateEmail('')).toMatch(/required/i)
    expect(validateEmail('   ')).toMatch(/required/i)
    expect(validateEmail('not-an-email')).toMatch(/valid/i)
    expect(validateEmail('a@b')).toMatch(/valid/i)
    expect(validateEmail('a b@c.com')).toMatch(/valid/i)
    expect(validateEmail(`${'a'.repeat(250)}@x.com`)).toMatch(/valid/i)
  })
})

describe('validatePassword', () => {
  it('requires at least 8 characters', () => {
    expect(validatePassword('')).toMatch(/required/i)
    expect(validatePassword('short7c')).toMatch(/at least 8/i)
    expect(validatePassword('PrismDemo!2026')).toBeNull()
  })

  it('caps runaway input', () => {
    expect(validatePassword('a'.repeat(129))).toMatch(/too long/i)
  })
})

describe('validateName', () => {
  it('requires a bounded display name', () => {
    expect(validateName('')).toMatch(/required/i)
    expect(validateName('  ')).toMatch(/required/i)
    expect(validateName('Jordan')).toBeNull()
    expect(validateName('a'.repeat(41))).toMatch(/40/i)
  })
})

describe('safeCallbackUrl', () => {
  it('passes same-site absolute paths through', () => {
    expect(safeCallbackUrl('/settings')).toBe('/settings')
    expect(safeCallbackUrl('/trending?type=news')).toBe('/trending?type=news')
  })

  it('rejects open-redirect and missing targets', () => {
    expect(safeCallbackUrl(null)).toBe('/')
    expect(safeCallbackUrl(undefined)).toBe('/')
    expect(safeCallbackUrl('')).toBe('/')
    expect(safeCallbackUrl('//evil.example')).toBe('/')
    expect(safeCallbackUrl('https://evil.example')).toBe('/')
    expect(safeCallbackUrl('javascript:alert(1)')).toBe('/')
    expect(safeCallbackUrl('/\\evil.example')).toBe('/')
  })
})
