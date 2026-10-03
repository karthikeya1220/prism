/**
 * Locale resource assembly: statically imports every JSON namespace for each
 * supported language and exposes them as typed bundles. `en` is the source
 * of truth for `CustomTypeOptions` (typed translation keys), and `hi` is
 * declared as `typeof en` so missing/extra keys fail `npm run typecheck`.
 */
import enCommon from '@/lib/locales/en/common.json'
import enNav from '@/lib/locales/en/nav.json'
import enPages from '@/lib/locales/en/pages.json'
import enFeed from '@/lib/locales/en/feed.json'
import enSettings from '@/lib/locales/en/settings.json'
import enOnboarding from '@/lib/locales/en/onboarding.json'
import enCards from '@/lib/locales/en/cards.json'
import enFavorites from '@/lib/locales/en/favorites.json'
import enSearch from '@/lib/locales/en/search.json'
import enTrending from '@/lib/locales/en/trending.json'
import enAuth from '@/lib/locales/en/auth.json'

import hiCommon from '@/lib/locales/hi/common.json'
import hiNav from '@/lib/locales/hi/nav.json'
import hiPages from '@/lib/locales/hi/pages.json'
import hiFeed from '@/lib/locales/hi/feed.json'
import hiSettings from '@/lib/locales/hi/settings.json'
import hiOnboarding from '@/lib/locales/hi/onboarding.json'
import hiCards from '@/lib/locales/hi/cards.json'
import hiFavorites from '@/lib/locales/hi/favorites.json'
import hiSearch from '@/lib/locales/hi/search.json'
import hiTrending from '@/lib/locales/hi/trending.json'
import hiAuth from '@/lib/locales/hi/auth.json'
import type { ParseKeys } from 'i18next'

/** English resources — the canonical shape every locale must satisfy. */
export const en = {
  common: enCommon,
  nav: enNav,
  pages: enPages,
  feed: enFeed,
  settings: enSettings,
  onboarding: enOnboarding,
  cards: enCards,
  favorites: enFavorites,
  search: enSearch,
  trending: enTrending,
  auth: enAuth,
}

/** Hindi resources — typed as `en` so key drift is a compile error. */
export const hi: typeof en = {
  common: hiCommon,
  nav: hiNav,
  pages: hiPages,
  feed: hiFeed,
  settings: hiSettings,
  onboarding: hiOnboarding,
  cards: hiCards,
  favorites: hiFavorites,
  search: hiSearch,
  trending: hiTrending,
  auth: hiAuth,
}

/** Supported locale bundles, keyed by language code. */
export const resources = { en, hi }

/** Namespace names (`t('key', { ns })` / `useTranslation(ns)`). */
export type Ns = keyof typeof en

/** Languages the switcher offers (kept in sync with `resources`). */
export const LANGUAGES = ['en', 'hi'] as const
export type Language = (typeof LANGUAGES)[number]

/**
 * Translation keys valid inside namespace `N` — i18next derives them from
 * `resources` (nested JSON → dot paths), plus the `fallbackNS` common keys.
 */
export type KeyOf<N extends Ns> = ParseKeys<N>

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    /** Unqualified keys miss in their namespace fall back to `common`. */
    fallbackNS: 'common'
    resources: typeof en
    returnNull: false
  }
}
