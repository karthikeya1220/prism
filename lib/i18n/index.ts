/**
 * i18next bootstrap (PLAN.md M13). Static JSON resources mean `init` runs
 * synchronously (`initImmediate: false`), so `useTranslation` is ready on the
 * first render — client or server. The instance always boots as `en` (the
 * SSR language); `LanguageSync` applies the persisted choice after hydration
 * to keep the server HTML and the first client render identical.
 *
 * Importing this module has the side effect of initializing i18next — every
 * translated component imports `useTranslation` from here, never directly
 * from react-i18next, so the instance is always ready before first use.
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { LANGUAGES, resources, type Language, type KeyOf, type Ns } from './resources'

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    ns: Object.keys(resources.en),
    defaultNS: 'common',
    fallbackNS: 'common',
    interpolation: { escapeValue: false },
    returnNull: false,
    react: { useSuspense: false },
  })
}

export default i18n
export { LANGUAGES }
export { T } from './T'
export type { Language, Ns, KeyOf }
export { useTranslation } from 'react-i18next'

/**
 * Language endonyms — each language's name in its own script. Deliberately
 * not translated (WCAG language-identification practice).
 */
export const LANGUAGE_ENDONYMS: Record<Language, string> = {
  en: 'English',
  hi: 'हिन्दी',
}
