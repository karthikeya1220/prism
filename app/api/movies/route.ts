/**
 * GET /api/movies — TMDB discover/search by category (genre-mapped),
 * paginated, normalized to ContentPage<MovieItem>. Falls back to cache → mock
 * when credentials are missing or upstream fails (PLAN.md §4).
 */
import type { NextRequest, NextResponse } from 'next/server'
import type { ContentPage, MovieItem } from '@/types'
import { cacheKey, getCache, setCache } from '@/lib/cache'
import { fetchMovies, searchMovies } from '@/lib/apis/movies'
import { pageFromCacheOrMock } from '@/lib/fallback'
import { jsonPage, withErrors } from '@/lib/response'
import { parseCategories, parsePage, parseQuery, PAGE_SIZE } from '@/lib/validate'
import { buildMockMoviesPage } from '@/mocks/moviesPage'

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrors(async () => {
    const params = request.nextUrl.searchParams
    const categories = parseCategories(params.get('category'))
    const page = parsePage(params.get('page'))
    const q = parseQuery(params.get('q'))

    const key = cacheKey('movies', { categories, page, q })
    const cached = getCache<ContentPage<MovieItem>>(key)
    if (cached) return jsonPage(cached)

    try {
      const result = q
        ? await searchMovies({ categories, page, pageSize: PAGE_SIZE, query: q })
        : await fetchMovies({ categories, page, pageSize: PAGE_SIZE })
      setCache(key, result, 60 * 60_000)
      return jsonPage(result)
    } catch {
      return jsonPage(pageFromCacheOrMock(key, () => buildMockMoviesPage(categories, page, q, PAGE_SIZE)))
    }
  })
}
