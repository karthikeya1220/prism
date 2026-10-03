'use client'

import { useState, type FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { Field } from './Field'
import { navigate } from '@/lib/nav'
import {
  safeCallbackUrl,
  validateEmail,
  validateName,
  validatePassword,
  type ValidationT,
} from '@/lib/auth/validation'
import { useTranslation } from '@/lib/i18n'

export interface SignupFormProps {
  /** Same-site path to return to after signing in (?callbackUrl=). */
  callbackUrl?: string
}

interface FieldErrors {
  name?: string
  email?: string
  password?: string
}

/**
 * Sign-up form (PLAN.md M11): validates, creates the account via
 * POST /api/auth/signup (server re-validates), then signs in with the same
 * credentials and navigates to a freshly hydrated dashboard.
 */
export function SignupForm({ callbackUrl }: SignupFormProps) {
  const { t } = useTranslation('auth')
  /** Routes raw validation keys through the auth namespace. */
  const vt: ValidationT = (key, vars) => t(`errors.${key}`, vars)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const next: FieldErrors = {}
    const nameError = validateName(name, vt)
    const emailError = validateEmail(email, vt)
    const passwordError = validatePassword(password, vt)
    if (nameError) next.name = nameError
    if (emailError) next.email = emailError
    if (passwordError) next.password = passwordError
    setErrors(next)
    setFormError(null)
    if (nameError || emailError || passwordError) return

    setPending(true)
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null
        setFormError(body?.error?.message ?? t('createFailed'))
        return
      }
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
        redirectTo: safeCallbackUrl(callbackUrl),
      })
      if (result?.error || !result?.url) {
        setFormError(t('signinAfterSignup'))
        return
      }
      navigate(result.url)
    } catch {
      setFormError(t('genericError'))
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && (
        <p role="alert" className="rounded-control border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {formError}
        </p>
      )}
      <Field
        id="signup-name"
        label={t('displayName')}
        value={name}
        onChange={setName}
        error={errors.name}
        autoComplete="name"
        placeholder={t('namePlaceholder')}
        required
      />
      <Field
        id="signup-email"
        label={t('email')}
        type="email"
        value={email}
        onChange={setEmail}
        error={errors.email}
        autoComplete="email"
        placeholder={t('emailPlaceholder')}
        required
      />
      <Field
        id="signup-password"
        label={t('password')}
        type="password"
        value={password}
        onChange={setPassword}
        error={errors.password}
        autoComplete="new-password"
        placeholder={t('passwordPlaceholder')}
        required
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-control bg-accent-solid px-4 py-2.5 text-sm font-medium text-on-accent transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? t('creatingAccount') : t('createAccount')}
      </button>
    </form>
  )
}
