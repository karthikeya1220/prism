/**
 * Feed composition (PLAN.md §5) — pure, deterministic, and unit-testable:
 *
 * 1. Filter news/movies to the user's categories (social is hashtag-driven;
 *    the app has no hashtag preferences yet, so every post qualifies).
 * 2. Sort: news/social newest first, movies by popularity.
 * 3. Interleave in a fixed 2:1:1 news:movie:social pattern, skipping
 *    exhausted streams — no randomness, stable across renders.
 */
import type { ContentItem, MovieItem, NewsItem, SocialItem } from '@/types'

export interface FeedInput {
  news: NewsItem[]
  movies: MovieItem[]
  social: SocialItem[]
  /** Selected feed categories; undefined/'general' disables client filtering. */
  categories?: string[]
}

/** Round-robin pattern: two news slots per movie/social slot (2:1:1). */
const PATTERN = [0, 0, 1, 2] as const

function interleave(streams: ContentItem[][]): ContentItem[] {
  const cursor = streams.map(() => 0)
  const total = streams.reduce((sum, s) => sum + s.length, 0)
  const out: ContentItem[] = []
  let step = 0
  while (out.length < total) {
    const preferred = PATTERN[step % PATTERN.length]
    step += 1
    // Fall back to the first stream that still has items when the preferred
    // one is exhausted (keeps the output dense and deterministic).
    const index =
      cursor[preferred] < streams[preferred].length
        ? preferred
        : streams.findIndex((s, i) => cursor[i] < s.length)
    if (index === -1) break
    out.push(streams[index][cursor[index]])
    cursor[index] += 1
  }
  return out
}

/** Build the unified feed from the three endpoint payloads. */
export function buildFeed({ news, movies, social, categories }: FeedInput): ContentItem[] {
  const wanted =
    !categories || categories.length === 0 || categories.includes('general')
      ? null
      : categories
  const pass = (item: { category: string }) => !wanted || wanted.includes(item.category)

  const sortedNews = news.filter(pass).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const sortedMovies = movies.filter(pass).sort((a, b) => b.popularity - a.popularity)
  const sortedSocial = [...social].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  return interleave([sortedNews, sortedMovies, sortedSocial])
}
