'use client'

import { setLanguage } from '@/features/preferences/preferencesSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { LANGUAGE_ENDONYMS, LANGUAGES, useTranslation } from '@/lib/i18n'

/**
 * Compact header language switcher: a native select (fully keyboard- and
 * AT-accessible) listing each language by its endonym. Dispatches
 * `setLanguage`; LanguageSync applies it to i18next, and the preferences
 * listener middleware persists it.
 */
export function LanguageSwitcher() {
  const { t } = useTranslation('nav')
  const language = useAppSelector((state) => state.preferences.language)
  const dispatch = useAppDispatch()

  return (
    <select
      aria-label={t('language')}
      value={language}
      onChange={(event) => {
        const next = event.target.value
        dispatch(setLanguage(next === 'hi' ? 'hi' : 'en'))
      }}
      className="h-9 cursor-pointer rounded-control border border-line bg-canvas px-2 text-xs font-medium text-ink transition-colors hover:border-ink-soft focus-visible:border-accent"
    >
      {LANGUAGES.map((code) => (
        <option key={code} value={code}>
          {LANGUAGE_ENDONYMS[code]}
        </option>
      ))}
    </select>
  )
}

export default LanguageSwitcher
