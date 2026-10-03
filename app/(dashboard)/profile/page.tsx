import { ProfileForm } from '@/features/auth/ProfileForm'

export const metadata = { title: 'Profile — Prism' }

/**
 * Profile page (PLAN.md M11): edit display name and avatar. Guarded by
 * proxy.ts; the form talks to PATCH /api/profile with the session cookie.
 */
export default function ProfilePage() {
  return (
    <div className="max-w-lg">
      <header className="space-y-1.5">
        <h1 className="text-display font-semibold text-ink">Profile</h1>
        <p className="max-w-[60ch] text-ink-soft">
          How you appear in the account menu. Saved to your account — sign in
          anywhere and it follows you.
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
