/**
 * GET /api/trending — top trending items across all content types (PLAN.md §5).
 * Movies come from TMDB trending (popularity), news from the latest headlines
 * (recency), social from the mock dataset (engagement). Falls back to mock
 * data per endpoint so the section always renders.
 */
import type { NextRequest, NextResponse } from 'next/server'
import type { ContentItem, ContentPage } from '@/types'
import { fetchNews } from '@/lib/apis/news'
import { fetchTrendingMovies } from '@/lib/apis/movies'
import { fetchSocial } from '@/lib/apis/social'
import { jsonPage, withErrors } from '@/lib/response'
import { parsePage } from '@/lib/validate'
import { MOCK_NEWS } from '@/mocks/news'
import { MOCK_MOVIES } from '@/mocks/movies'

/** Trending score per type: movies by popularity, social by engagement, news by recency. */
function trendScore(item: ContentItem): number {
  switch (item.type) {
    case 'movie':
      return item.popularity
    case 'social':
      return Math.log10(1 + item.likes + 2 * item.reposts) * 100
    case 'news': {
      const ageHours = Math.max(
        (Date.now() - new Date(item.publishedAt).getTime()) / 3_600_000,
        1,
      )
      return 5_000 / ageHours
    }
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrors(async () => {
    parsePage(request.nextUrl.searchParams.get('page'))

    const [movies, news, social] = await Promise.all([
      fetchTrendingMovies({ categories: ['general'], page: 1, pageSize: 8 }).catch(
        () => null,
      ),
      fetchNews({ categories: ['general'], page: 1, pageSize: 8 }).catch(() => null),
      Promise.resolve(fetchSocial({ hashtags: [], page: 1, pageSize: 8 })),
    ])

    const movieItems = movies?.items ?? MOCK_MOVIES.slice(0, 8)
    const newsItems = news?.items ?? MOCK_NEWS.slice(0, 8)
    const socialItems = social.items

    const merged = [...movieItems, ...newsItems, ...socialItems].sort(
      (a, b) => trendScore(b) - trendScore(a),
    )

    const page: ContentPage<ContentItem> = {
      items: merged,
      page: 1,
      pageSize: merged.length,
      totalResults: merged.length,
      hasMore: false,
      source: movies && news ? 'live' : 'mock',
    }
    return jsonPage(page)
  })
}
