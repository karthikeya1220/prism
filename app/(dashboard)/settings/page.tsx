import type { Metadata } from 'next'
import PreferencesForm from '@/features/preferences/PreferencesForm'
import SettingsPanel from '@/features/preferences/SettingsPanel'
import { T } from '@/lib/i18n/T'

export const metadata: Metadata = { title: 'Settings — Prism' }

/**
 * Settings: topic chips (persisted + feed refetch), appearance/language
 * controls, and reset (M5). Every change saves immediately; headings render
 * through <T> islands so they follow the chosen language.
 */
export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-display font-semibold text-ink">
          <T ns="pages" k="settings.title" />
        </h1>
        <p className="max-w-[60ch] text-ink-soft">
          <T ns="pages" k="settings.subtitle" />
        </p>
      </header>
      <section
        id="preferences"
        aria-labelledby="preferences-heading"
        className="scroll-mt-24 space-y-4"
      >
        <div className="space-y-1">
          <h2 id="preferences-heading" className="text-title font-semibold text-ink">
            <T ns="pages" k="settings.topicsHeading" />
          </h2>
          <p className="text-sm text-ink-soft">
            <T ns="pages" k="settings.topicsCopy" />
          </p>
        </div>
        <PreferencesForm />
      </section>
      <SettingsPanel />
    </div>
  )
}
