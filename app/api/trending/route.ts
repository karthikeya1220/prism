/**
 * GET /api/trending — trending content, optionally sliced by `type`
 * (news | movie | social) and `category` (PLAN.md §5, M5).
 *
 * - `type=news`    → latest headlines, newest first.
 * - `type=movie`   → TMDB weekly trending, popularity first.
 * - `type=social`  → mock dataset sorted by engagement (likes + 2·reposts).
 * - no `type`      → merged cross-type page scored per type (legacy 'all').
 *
 * Every slice falls back to mock fixtures when its upstream is unavailable,
 * so the page always renders (`source` marks the degradation).
 */
import type { NextRequest, NextResponse } from 'next/server'
import type { Category, ContentItem, ContentPage, ContentSource, MovieItem, NewsItem, SocialItem } from '@/types'
import { fetchNews } from '@/lib/apis/news'
import { fetchTrendingMovies } from '@/lib/apis/movies'
import { fetchSocial } from '@/lib/apis/social'
import { jsonPage, withErrors } from '@/lib/response'
import {
  PAGE_SIZE,
  parseCategories,
  parsePage,
  parseTrendingType,
  type TrendingType,
} from '@/lib/validate'
import { buildMockNewsPage } from '@/mocks/newsPage'
import { buildMockMoviesPage } from '@/mocks/moviesPage'

/** Items per section — one full screen of trending content per type. */
const PER_TYPE = PAGE_SIZE

/** Engagement score for social posts (PLAN.md §5). */
function engagement(post: SocialItem): number {
  return post.likes + 2 * post.reposts
}

/** Trending score per type for the merged 'all' view. */
function trendScore(item: ContentItem): number {
  switch (item.type) {
    case 'movie':
      return item.popularity
    case 'social':
      return engagement(item)
    case 'news': {
      const ageHours = Math.max(
        (Date.now() - new Date(item.publishedAt).getTime()) / 3_600_000,
        1,
      )
      return 5_000 / ageHours
    }
  }
}

/** Page envelope around an already-materialized trending list. */
function trendingPage<T extends ContentItem>(
  items: T[],
  source: ContentSource,
): ContentPage<T> {
  return {
    items,
    page: 1,
    pageSize: items.length,
    totalResults: items.length,
    hasMore: false,
    source,
  }
}

async function trendingNews(categories: Category[], requested: number): Promise<ContentPage<NewsItem>> {
  const result = await fetchNews({ categories, page: 1, pageSize: PER_TYPE }).catch(
    () => buildMockNewsPage(categories, 1, PER_TYPE),
  )
  const items = [...result.items]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, requested)
  return trendingPage(items, result.source)
}

async function trendingMovies(categories: Category[], requested: number): Promise<ContentPage<MovieItem>> {
  const result = await fetchTrendingMovies({ categories, page: 1, pageSize: PER_TYPE })
    .catch(() => buildMockMoviesPage(categories, 1, '', PER_TYPE))
  const wanted = categories.includes('general') ? null : categories
  const items = result.items
    .filter((movie) => !wanted || wanted.includes(movie.category))
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, requested)
  return trendingPage(items, result.source)
}

function trendingSocial(categories: Category[], requested: number): ContentPage<SocialItem> {
  const result = fetchSocial({ hashtags: [], page: 1, pageSize: 100 })
  const wanted = categories.includes('general') ? null : categories
  const items = result.items
    .filter((post) => !wanted || wanted.includes(post.category))
    .sort((a, b) => engagement(b) - engagement(a))
    .slice(0, requested)
  return trendingPage(items, result.source)
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrors(async () => {
    const params = request.nextUrl.searchParams
    const type: TrendingType = parseTrendingType(params.get('type'))
    const categories = parseCategories(params.get('category'))
    parsePage(params.get('page'))

    if (type === 'news') return jsonPage(await trendingNews(categories, PER_TYPE))
    if (type === 'movie') return jsonPage(await trendingMovies(categories, PER_TYPE))
    if (type === 'social') return jsonPage(trendingSocial(categories, PER_TYPE))

    // 'all' — merged cross-type page (back-compat with the M3 contract).
    const [movies, news, social] = await Promise.all([
      trendingMovies(categories, 8),
      trendingNews(categories, 8),
      Promise.resolve(trendingSocial(categories, 8)),
    ])

    const merged = [...movies.items, ...news.items, ...social.items].sort(
      (a, b) => trendScore(b) - trendScore(a),
    )
    const source: ContentSource =
      movies.source === 'live' && news.source === 'live' ? 'live' : 'mock'
    return jsonPage(trendingPage(merged, source))
  })
}
