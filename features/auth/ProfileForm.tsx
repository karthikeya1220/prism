'use client'

import { useState, type FormEvent } from 'react'
import { useSession } from 'next-auth/react'
import { Field } from './Field'
import { AVATAR_PRESETS } from '@/lib/auth/avatars'
import { validateName } from '@/lib/auth/validation'
import { cx } from '@/lib/cx'

interface Draft {
  name: string
  avatar: string | null
}

/**
 * Profile editor (PLAN.md M11): display name + preset avatar saved via
 * PATCH /api/profile, then the NextAuth session is refreshed so the
 * AccountMenu shows the new values immediately. Draft state starts as null
 * (falls back to the loaded session) and clears after a successful save;
 * account switches always come with a full navigation, so no reset logic.
 */
export function ProfileForm() {
  const { data: session, update } = useSession()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)

  const user = session?.user
  const effective: Draft = draft ?? { name: user?.name ?? '', avatar: user?.avatar ?? null }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const error = validateName(effective.name)
    setNameError(error)
    setFormError(null)
    setSaved(false)
    if (error) return

    setPending(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: effective.name.trim(), avatar: effective.avatar }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null
        setFormError(body?.error?.message ?? 'Could not save your profile.')
        return
      }
      setDraft(null)
      await update()
      setSaved(true)
    } catch {
      setFormError('Something went wrong. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && (
        <p role="alert" className="rounded-control border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {formError}
        </p>
      )}
      <div aria-live="polite" className="min-h-0">
        {saved && <p className="text-sm text-accent">Profile saved.</p>}
      </div>
      <Field
        id="profile-name"
        label="Display name"
        value={effective.name}
        onChange={(name) => {
          setSaved(false)
          setDraft({ name, avatar: effective.avatar })
        }}
        error={nameError}
        autoComplete="name"
        required
      />
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Avatar</legend>
        <div className="flex flex-wrap gap-2">
          {AVATAR_PRESETS.map((preset) => (
            <label
              key={preset}
              className={cx(
                'grid h-10 w-10 cursor-pointer place-items-center rounded-full border text-lg',
                effective.avatar === preset
                  ? 'border-accent bg-accent/10'
                  : 'border-line bg-canvas',
                'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
              )}
            >
              <input
                type="radio"
                name="avatar"
                value={preset}
                checked={effective.avatar === preset}
                onChange={() => {
                  setSaved(false)
                  setDraft({ name: effective.name, avatar: preset })
                }}
                className="sr-only"
              />
              <span aria-hidden="true">{preset}</span>
              <span className="sr-only">Avatar {preset}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="text-xs text-ink-soft">
        Signed in as {user?.email}. Topics, favorites, and layout are saved per
        account on this device.
      </p>
      <button
        type="submit"
        disabled={pending || !user}
        className="rounded-control bg-accent-solid px-5 py-2.5 text-sm font-medium text-on-accent transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  )
}
