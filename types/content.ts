/**
 * Core domain types for the Personalized Content Dashboard.
 *
 * The discriminated union `ContentItem` is the single currency of the app:
 * route handlers normalize every upstream API into one of these variants, and
 * the UI renders cards from them (see PLAN.md §2).
 */

/** Content categories a user can personalize their feed with. */
export const CATEGORIES = [
  'technology',
  'business',
  'finance',
  'sports',
  'entertainment',
  'science',
  'health',
  'general',
] as const

export type Category = (typeof CATEGORIES)[number]

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value)
}

/** Fields shared by every content variant. */
interface BaseContentItem {
  /** Stable, namespaced id: 'news:…' | 'movie:…' | 'social:…'. */
  id: string
  /** Discriminant for the union. */
  type: 'news' | 'movie' | 'social'
  title: string
  description: string
  /** Poster/thumbnail/avatar image; null when the upstream omits it. */
  imageUrl: string | null
  /** Detail link — the 'Read More' / 'Play Now' CTA target. */
  url: string
  /** Human-readable origin: 'TechCrunch' | 'TMDB' | '@nasa'. */
  source: string
  category: Category
  /** ISO 8601 timestamp. */
  publishedAt: string
}

export interface NewsItem extends BaseContentItem {
  type: 'news'
  author: string | null
}

export interface MovieItem extends BaseContentItem {
  type: 'movie'
  /** TMDB vote_average, 0–10. */
  rating: number
  /** ISO date (yyyy-mm-dd). */
  releaseDate: string
  genres: string[]
  /** TMDB popularity — drives the Trending section. */
  popularity: number
}

export interface SocialItem extends BaseContentItem {
  type: 'social'
  author: { handle: string; displayName: string; avatarUrl: string | null }
  /** Hashtag without the leading '#'. */
  hashtag: string
  likes: number
  reposts: number
}

export type ContentItem = NewsItem | MovieItem | SocialItem

export function isNewsItem(item: ContentItem): item is NewsItem {
  return item.type === 'news'
}

export function isMovieItem(item: ContentItem): item is MovieItem {
  return item.type === 'movie'
}

export function isSocialItem(item: ContentItem): item is SocialItem {
  return item.type === 'social'
}

/** Only web schemes may leave the app — blocks `javascript:`, `data:`, etc. */
const SAFE_URL_SCHEME = /^https?:\/\//i

function isBaseContentItem(value: unknown): value is BaseContentItem {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<BaseContentItem>
  return (
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.description === 'string' &&
    typeof v.url === 'string' &&
    SAFE_URL_SCHEME.test(v.url) &&
    typeof v.source === 'string' &&
    typeof v.publishedAt === 'string' &&
    (v.imageUrl === null ||
      (typeof v.imageUrl === 'string' && SAFE_URL_SCHEME.test(v.imageUrl))) &&
    typeof v.category === 'string' &&
    isCategory(v.category)
  )
}

/**
 * Runtime guard for untrusted/persisted data (localStorage rehydration, API
 * payloads). Validates the discriminant and the variant-specific fields.
 */
export function isContentItem(value: unknown): value is ContentItem {
  if (!isBaseContentItem(value)) return false
  switch (value.type) {
    case 'news':
      return typeof (value as NewsItem).author === 'string' ||
        (value as NewsItem).author === null
    case 'movie': {
      const movie = value as MovieItem
      return (
        typeof movie.rating === 'number' &&
        typeof movie.releaseDate === 'string' &&
        typeof movie.popularity === 'number' &&
        Array.isArray(movie.genres)
      )
    }
    case 'social': {
      const social = value as SocialItem
      const author = social.author
      return (
        !!author &&
        typeof author === 'object' &&
        typeof author.handle === 'string' &&
        typeof author.displayName === 'string' &&
        typeof social.hashtag === 'string' &&
        typeof social.likes === 'number' &&
        typeof social.reposts === 'number'
      )
    }
    default:
      return false
  }
}
