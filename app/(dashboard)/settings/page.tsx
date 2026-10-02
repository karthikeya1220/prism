import type { Metadata } from 'next'
import PreferencesForm from '@/features/preferences/PreferencesForm'

export const metadata: Metadata = { title: 'Settings — Prism' }

/** Settings page (M4 shell): topic preferences now, social/language next. */
export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-display font-semibold text-ink">Settings</h1>
        <p className="max-w-[60ch] text-ink-soft">
          Shape what Prism pulls for you. Changes save automatically and follow
          you across reloads.
        </p>
      </header>
      <section
        id="preferences"
        aria-labelledby="preferences-heading"
        className="scroll-mt-24 space-y-4"
      >
        <div className="space-y-1">
          <h2 id="preferences-heading" className="text-title font-semibold text-ink">
            Feed topics
          </h2>
          <p className="text-sm text-ink-soft">
            These decide which stories, films, and posts reach your feed.
          </p>
        </div>
        <PreferencesForm />
      </section>
      <section aria-labelledby="appearance-heading" className="space-y-1">
        <h2 id="appearance-heading" className="text-title font-semibold text-ink">
          Appearance
        </h2>
        <p className="text-sm text-ink-soft">
          Use the sun/moon button in the header to switch themes — Prism follows
          your system setting until you choose.
        </p>
      </section>
    </div>
  )
}
