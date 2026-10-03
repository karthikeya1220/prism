'use client'

import { useState, type FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { Field } from './Field'
import { navigate } from '@/lib/nav'
import {
  safeCallbackUrl,
  validateEmail,
  validatePassword,
  type ValidationT,
} from '@/lib/auth/validation'
import { useTranslation } from '@/lib/i18n'

export interface LoginFormProps {
  /** Same-site path to return to after signing in (?callbackUrl=). */
  callbackUrl?: string
}

interface FieldErrors {
  email?: string
  password?: string
}

/**
 * Credentials sign-in form (PLAN.md M11): client-side validation, a
 * server-verified `signIn('credentials')`, and a full page navigation on
 * success so the Redux store re-hydrates under the signed-in user's key.
 */
export function LoginForm({ callbackUrl }: LoginFormProps) {
  const { t } = useTranslation('auth')
  /** Routes raw validation keys through the auth namespace. */
  const vt: ValidationT = (key, vars) => t(`errors.${key}`, vars)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const next: FieldErrors = {}
    const emailError = validateEmail(email, vt)
    const passwordError = validatePassword(password, vt)
    if (emailError) next.email = emailError
    if (passwordError) next.password = passwordError
    setErrors(next)
    setFormError(null)
    if (emailError || passwordError) return

    setPending(true)
    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
        redirectTo: safeCallbackUrl(callbackUrl),
      })
      if (result?.error || !result?.url) {
        setFormError(t('wrongCredentials'))
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
        id="login-email"
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
        id="login-password"
        label={t('password')}
        type="password"
        value={password}
        onChange={setPassword}
        error={errors.password}
        autoComplete="current-password"
        required
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-control bg-accent-solid px-4 py-2.5 text-sm font-medium text-on-accent transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? t('signingIn') : t('signIn')}
      </button>
    </form>
  )
}
