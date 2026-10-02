/**
 * Builds paginated mock news pages for the /api/news fallback chain
 * (PLAN.md §4). Category-filtered, newest first, deterministic.
 */
import type { Category, ContentPage, NewsItem } from '@/types'
import { MOCK_NEWS } from './news'

/** Build a ContentPage of mock news for a category + page request. */
export function buildMockNewsPage(
  categories: Category[],
  page: number,
  pageSize: number,
): ContentPage<NewsItem> {
  const wanted = categories.includes('general') ? [] : categories
  const filtered = MOCK_NEWS.filter(
    (item) => wanted.length === 0 || wanted.includes(item.category),
  ).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

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
