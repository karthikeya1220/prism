import { ProfileForm } from '@/features/auth/ProfileForm'
import { T } from '@/lib/i18n/T'

export const metadata = { title: 'Profile — Prism' }

/**
 * Profile page (PLAN.md M11): edit display name and avatar. Guarded by
 * proxy.ts; the form talks to PATCH /api/profile with the session cookie.
 * Visible copy renders through <T> islands (the section's aria-label stays
 * server-rendered English — see README i18n notes).
 */
export default function ProfilePage() {
  return (
    <div className="max-w-lg">
      <header className="space-y-1.5">
        <h1 className="text-display font-semibold text-ink">
          <T ns="pages" k="profile.title" />
        </h1>
        <p className="max-w-[60ch] text-ink-soft">
          <T ns="pages" k="profile.subtitle" />
        </p>
      </header>
      <section
        aria-label="Edit profile"
        className="mt-6 rounded-card border border-line bg-surface p-6 shadow-card"
      >
        <ProfileForm />
      </section>
    </div>
  )
}
