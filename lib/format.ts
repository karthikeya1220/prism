/** Small display formatters shared by the card variants. */

import i18n from '@/lib/i18n'

/**
 * Compact relative timestamp: "just now", "12m ago", "5h ago", "3d ago",
 * falling back to a short date beyond a week — in the current interface
 * language. Invalid input → ''.
 */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const parsed = Date.parse(iso)
  if (Number.isNaN(parsed)) return ''
  const t = i18n.getFixedT(i18n.language, 'common')
  const minutes = Math.round((now - parsed) / 60_000)
  if (minutes < 1) return t('time.justNow')
  if (minutes < 60) return t('time.minutesAgo', { n: minutes })
  const hours = Math.round(minutes / 60)
  if (hours < 24) return t('time.hoursAgo', { n: hours })
  const days = Math.round(hours / 24)
  if (days < 7) return t('time.daysAgo', { n: days })
  const locale = i18n.resolvedLanguage === 'hi' ? 'hi-IN' : 'en-US'
  return new Date(parsed).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
}

/** TMDB rating as one decimal ("7.8"), guarding non-numeric input. */
export function formatRating(rating: number): string {
  return Number.isFinite(rating) ? rating.toFixed(1) : '—'
}

/** Release year from an ISO date; '' when unparseable. */
export function releaseYear(iso: string): string {
  const year = Number.parseInt(iso.slice(0, 4), 10)
  return Number.isFinite(year) && iso.length >= 4 ? String(year) : ''
}
