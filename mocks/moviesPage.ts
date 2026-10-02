/**
 * Builds paginated mock movie pages for the /api/movies fallback chain
 * (PLAN.md §4). Category-filtered (optional search), popularity-first,
 * deterministic.
 */
import type { Category, ContentPage, MovieItem } from '@/types'
import { MOCK_MOVIES } from './movies'

/** Build a ContentPage of mock movies for a category + page (+ optional query). */
export function buildMockMoviesPage(
  categories: Category[],
  page: number,
  query: string,
  pageSize: number,
): ContentPage<MovieItem> {
  const wanted = categories.includes('general') ? [] : categories
  const q = query.trim().toLowerCase()

  const filtered = MOCK_MOVIES.filter((item) => {
    if (wanted.length > 0 && !wanted.includes(item.category)) return false
    if (
      q &&
      !item.title.toLowerCase().includes(q) &&
      !item.description.toLowerCase().includes(q)
    ) {
      return false
    }
    return true
  }).sort((a, b) => b.popularity - a.popularity)

  const start = (page - 1) * pageSize
  const items = filtered.slice(start, start + pageSize)

  return {
    items,
    page,
    pageSize,
    totalResults: filtered.length,
    hasMore: start + items.length < filtered.length,
    source: 'mock',
  }
}
