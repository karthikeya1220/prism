/**
 * NewsAPI adapter → NewsItem normalization (PLAN.md §4). All NewsAPI specifics
 * (top-headlines shape, category mapping) stay in this module.
 */
import type { ContentPage, NewsItem } from '@/types'
import { hashId } from '../hash'
import { UpstreamError } from '../upstream'

const NEWSAPI_BASE = 'https://newsapi.org/v2'

/** NewsAPI category names; our 'finance' maps onto NewsAPI 'business'. */
const CATEGORY_MAP: Record<string, string> = {
  finance: 'business',
}

interface NewsApiArticle {
  source?: { name?: string | null } | null
  author?: string | null
  title?: string | null
  description?: string | null
  url?: string | null
  urlToImage?: string | null
  publishedAt?: string | null
}

interface NewsApiTopHeadlinesResponse {
  status?: 'ok' | 'error'
  totalResults?: number
  articles?: NewsApiArticle[]
}

/**
 * Fetch one page of top headlines for the given categories and normalize to a
 * ContentPage<NewsItem>. Throws UpstreamError on any failure.
 */
export async function fetchNews(options: {
  categories: string[]
  page: number
  pageSize: number
}): Promise<ContentPage<NewsItem>> {
  const { categories, page, pageSize } = options
  const key = process.env.NEWS_API_KEY
  if (!key) throw new UpstreamError('NEWS_API_KEY is not configured')

  const apiCategories = categories.map((c) => CATEGORY_MAP[c] ?? c)
  const params = new URLSearchParams({
    apiKey: key,
    country: 'us',
    category: apiCategories[0] ?? 'general',
    page: String(page),
    pageSize: String(pageSize),
  })

  const response = await fetch(`${NEWSAPI_BASE}/top-headlines?${params}`, {
    // Always fetch dynamic data; caching is handled by lib/cache.
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new UpstreamError(`NewsAPI responded ${response.status}`, response.status)
  }
  const data = (await response.json()) as NewsApiTopHeadlinesResponse
  if (data.status !== 'ok' || !Array.isArray(data.articles)) {
    throw new UpstreamError('NewsAPI returned an unexpected payload')
  }

  const items: NewsItem[] = data.articles.flatMap((article) => {
    const title = article.title?.trim()
    const url = article.url?.trim()
    if (!title || !url) return [] // skip upstream junk rows
    return [
      {
        id: hashId('news', url),
        type: 'news',
        title,
        description: article.description?.trim() || '',
        imageUrl: article.urlToImage?.trim() || null,
        url,
        source: article.source?.name?.trim() || 'NewsAPI',
        category: mapBackCategory(categories),
        publishedAt: article.publishedAt?.trim() || new Date(0).toISOString(),
        author: article.author?.trim() || null,
      },
    ]
  })

  return {
    items,
    page,
    pageSize,
    totalResults: data.totalResults ?? items.length,
    hasMore: page * pageSize < (data.totalResults ?? 0),
    source: 'live',
  }
}

function mapBackCategory(requested: string[]): NewsItem['category'] {
  // The adapter requests one upstream category per call; reflect it back on
  // the normalized items so feed filtering works.
  return (requested[0] ?? 'general') as NewsItem['category']
}
