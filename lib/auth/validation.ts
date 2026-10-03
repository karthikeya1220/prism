/**
 * Pure auth-form validation (PLAN.md M11). Shared by the login/signup pages
 * (client feedback) and the signup API route (server enforcement), and unit
 * tested directly. Each function returns an error message or null when valid.
 *
 * Messages come from an optional translator so forms can pass their i18n `t`
 * (localized); the default renders the English table from `en/auth.json`,
 * which keeps the API route and unit tests language-independent.
 */

import enErrors from '@/lib/locales/en/auth.json'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const MIN_PASSWORD_LENGTH = 8
export const MAX_NAME_LENGTH = 40

/** Renders an i18n table over the raw `auth:errors.*` key names. */
export type ValidationT = (
  key: keyof typeof enErrors.errors,
  vars?: Record<string, string | number>,
) => string

/** English fallback used by the API route and unit tests (no i18n needed). */
const english: ValidationT = (key, vars) => {
  let message: string = enErrors.errors[key]
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      message = message.replaceAll(`{{${name}}}`, String(value))
    }
  }
  return message
}

export function validateEmail(email: string, t: ValidationT = english): string | null {
  const value = email.trim()
  if (!value) return t('email_required')
  if (value.length > 254 || !EMAIL_RE.test(value)) return t('email_invalid')
  return null
}

export function validatePassword(password: string, t: ValidationT = english): string | null {
  if (!password) return t('password_required')
  if (password.length < MIN_PASSWORD_LENGTH)
    return t('password_short', { min: MIN_PASSWORD_LENGTH })
  if (password.length > 128) return t('password_long')
  return null
}

export function validateName(name: string, t: ValidationT = english): string | null {
  const value = name.trim()
  if (!value) return t('name_required')
  if (value.length > MAX_NAME_LENGTH)
    return t('name_long', { max: MAX_NAME_LENGTH })
  return null
}

/**
 * Sanitize an untrusted `callbackUrl` (login redirect target). Only same-site
 * absolute paths are allowed — anything else falls back to the dashboard.
 */
export function safeCallbackUrl(raw: string | null | undefined): string {
  if (!raw) return '/'
  // Browsers normalize "\" to "/" — reject both // and /\ protocol-relative
  // forms, plus anything that isn't a same-site absolute path.
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/'
  return raw
}
