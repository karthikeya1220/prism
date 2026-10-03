'use client'

import { resetPreferences, setDarkMode, setLanguage } from './preferencesSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { LANGUAGE_ENDONYMS, LANGUAGES, useTranslation } from '@/lib/i18n'
import { cx } from '@/lib/cx'

const cardClass = 'space-y-1 rounded-card border border-line bg-surface p-5 shadow-card'
const headingClass = 'text-title font-semibold text-ink'

/**
 * Settings controls beyond topic chips: an immediate dark-mode switch, the
 * language selector (applied live by LanguageSync and persisted), and
 * "Reset preferences" (defaults for topics/appearance/language — onboarding
 * and favorites are untouched). Every change persists via the store's
 * listener middleware, and topic changes refetch the feed automatically.
 */
export function SettingsPanel() {
  const { t } = useTranslation('settings')
  const dark = useAppSelector((state) => state.preferences.darkMode)
  const language = useAppSelector((state) => state.preferences.language)
  const dispatch = useAppDispatch()

  return (
    <div className="space-y-6">
      <section aria-labelledby="appearance-heading" className={cardClass}>
        <h2 id="appearance-heading" className={headingClass}>
          {t('appearance')}
        </h2>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink">{t('darkMode')}</p>
            <p className="text-xs text-ink-soft">{t('darkModeHint')}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={dark}
            aria-label={t('darkMode')}
            onClick={() => dispatch(setDarkMode(!dark))}
            className={cx(
              'relative h-6 w-11 shrink-0 rounded-full transition-colors motion-reduce:transition-none',
              dark ? 'bg-accent-solid' : 'bg-line',
            )}
          >
            <span
              aria-hidden="true"
              className={cx(
                'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-card transition-all motion-reduce:transition-none',
                dark ? 'left-[22px]' : 'left-0.5',
              )}
            />
          </button>
        </div>
      </section>

      <section aria-labelledby="language-heading" className={cardClass}>
        <h2 id="language-heading" className={headingClass}>
          {t('language')}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label htmlFor="settings-language" className="text-sm font-medium text-ink">
            {t('interfaceLanguage')}
          </label>
          <select
            id="settings-language"
            value={language}
            onChange={(event) =>
              dispatch(setLanguage(event.target.value === 'hi' ? 'hi' : 'en'))
            }
            className="cursor-pointer rounded-control border border-line bg-canvas px-3 py-2 text-sm text-ink focus-visible:border-accent"
          >
            {LANGUAGES.map((code) => (
              <option key={code} value={code}>
                {LANGUAGE_ENDONYMS[code]}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-ink-soft">{t('languageHint')}</p>
      </section>

      <section aria-labelledby="reset-heading" className={cardClass}>
        <h2 id="reset-heading" className={headingClass}>
          {t('resetHeading')}
        </h2>
        <p className="text-sm text-ink-soft">{t('resetCopy')}</p>
        <button
          type="button"
          onClick={() => dispatch(resetPreferences())}
          className="mt-3 rounded-control border border-danger/40 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
        >
          {t('resetButton')}
        </button>
      </section>
    </div>
  )
}

export default SettingsPanel
