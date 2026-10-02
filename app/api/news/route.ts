/**
 * GET /api/news — NewsAPI top-headlines by category, paginated, normalized to
 * ContentPage<NewsItem>. Falls back to cache → mock when the key is missing or
 * the upstream fails (PLAN.md §4).
 */
import type { NextRequest, NextResponse } from 'next/server'
import type { ContentPage, NewsItem } from '@/types'
import { cacheKey, getCache, setCache } from '@/lib/cache'
import { pageFromCacheOrMock } from '@/lib/fallback'
import { jsonPage, withErrors } from '@/lib/response'
import { fetchNews } from '@/lib/apis/news'
import { parseCategories, parsePage, parseQuery, PAGE_SIZE } from '@/lib/validate'
import { buildMockNewsPage } from '@/mocks/newsPage'

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrors(async () => {
    const params = request.nextUrl.searchParams
    const categories = parseCategories(params.get('category'))
    const page = parsePage(params.get('page'))
    const q = parseQuery(params.get('q'))

    const key = cacheKey('news', { categories, page, q })
    const cached = getCache<ContentPage<NewsItem>>(key)
    if (cached) return jsonPage(cached)

    try {
      const result = await fetchNews({ categories, page, pageSize: PAGE_SIZE, query: q })
      setCache(key, result, 10 * 60_000)
      return jsonPage(result)
    } catch {
      return jsonPage(
        pageFromCacheOrMock(key, () => buildMockNewsPage(categories, page, q, PAGE_SIZE)),
      )
    }
  })
}
