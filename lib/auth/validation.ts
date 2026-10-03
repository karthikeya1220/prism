/**
 * Pure auth-form validation (PLAN.md M11). Shared by the login/signup pages
 * (client feedback) and the signup API route (server enforcement), and unit
 * tested directly. Each function returns an error message or null when valid.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const MIN_PASSWORD_LENGTH = 8
export const MAX_NAME_LENGTH = 40

export function validateEmail(email: string): string | null {
  const value = email.trim()
  if (!value) return 'Email is required.'
  if (value.length > 254 || !EMAIL_RE.test(value)) return 'Enter a valid email address.'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.'
  if (password.length < MIN_PASSWORD_LENGTH)
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  if (password.length > 128) return 'Password is too long.'
  return null
}

export function validateName(name: string): string | null {
  const value = name.trim()
  if (!value) return 'Display name is required.'
  if (value.length > MAX_NAME_LENGTH) return `Name must be ${MAX_NAME_LENGTH} characters or fewer.`
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
