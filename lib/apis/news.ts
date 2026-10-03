/**
 * NewsAPI adapter → NewsItem normalization (PLAN.md §4). All NewsAPI specifics
 * (top-headlines shape, category mapping) stay in this module.
 */
import type { ContentPage, NewsItem } from '@/types'
import { hashId } from '../hash'
import { MAX_PAGE } from '../validate'
import { UpstreamError } from '../upstream'

const NEWSAPI_BASE = 'https://newsapi.org/v2'

/** NewsAPI category names; our 'finance' maps onto NewsAPI 'business'. */
const CATEGORY_MAP: Record<string, string> = {
  finance: 'business',
}

/** Only http(s) links survive normalization — blocks javascript:/data: XSS. */
const SAFE_URL = /^https?:\/\//i

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

/** One upstream page for a single NewsAPI category, with our name attached. */
interface HeadlineBatch {
  requested: string
  articles: NewsApiArticle[]
  totalResults: number
}

/**
 * Fetch news for every selected topic (PLAN §5 filters by category — a single
 * upstream call can only express one category, so we fan out, merge, and
 * dedupe). Optional `query` filters locally after the merge. Throws
 * UpstreamError on any failure so the route can fall back to cache/mock.
 */
export async function fetchNews(options: {
  categories: string[]
  page: number
  pageSize: number
  query?: string
}): Promise<ContentPage<NewsItem>> {
  const { categories, page, pageSize, query } = options
  const key = process.env.NEWS_API_KEY
  if (!key) throw new UpstreamError('NEWS_API_KEY is not configured')

  const wanted = categories.length > 0 ? categories : ['general']
  const batches = await Promise.all(
    wanted.map((requested) => fetchHeadlines(key, requested, page, pageSize)),
  )

  const seen = new Set<string>()
  const merged: NewsItem[] = []
  for (const batch of batches) {
    for (const item of normalizeArticles(batch.articles, batch.requested)) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      merged.push(item)
    }
  }
  merged.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  // NewsAPI top-headlines has no `q` param; filter locally (title/description/
  // author) after merging the per-topic windows.
  const needle = query?.trim().toLowerCase() ?? ''
  const filtered = needle
    ? merged.filter(
        (item) =>
          item.title.toLowerCase().includes(needle) ||
          item.description.toLowerCase().includes(needle) ||
          (item.author?.toLowerCase().includes(needle) ?? false),
      )
    : merged
  const items = filtered.slice(0, pageSize)
  const moreFromUpstream = batches.some((b) => b.totalResults > page * pageSize)

  return {
    items,
    page,
    pageSize,
    // Truthful count of what this window actually contains (post-dedupe).
    totalResults: filtered.length,
    // Clamp at MAX_PAGE: the route rejects higher pages, so advertising more
    // would make the infinite-scroll sentinel refetch the same page forever.
    hasMore:
      page < MAX_PAGE && (moreFromUpstream || filtered.length > pageSize),
    source: 'live',
  }
}

/** Fetch + validate one top-headlines page for a single category. */
async function fetchHeadlines(
  key: string,
  requested: string,
  page: number,
  pageSize: number,
): Promise<HeadlineBatch> {
  const params = new URLSearchParams({
    apiKey: key,
    country: 'us',
    category: CATEGORY_MAP[requested] ?? requested,
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
  return {
    requested,
    articles: data.articles,
    totalResults: data.totalResults ?? 0,
  }
}

/** Normalize one category's articles; drops junk rows and unsafe URLs. */
function normalizeArticles(
  articles: NewsApiArticle[],
  requested: string,
): NewsItem[] {
  return articles.flatMap((article) => {
    const title = article.title?.trim()
    const url = article.url?.trim()
    if (!title || !url || !SAFE_URL.test(url)) return [] // junk or unsafe row
    const image = article.urlToImage?.trim()
    return [
      {
        id: hashId('news', url),
        type: 'news' as const,
        title,
        description: article.description?.trim() || '',
        imageUrl: image && SAFE_URL.test(image) ? image : null,
        url,
        source: article.source?.name?.trim() || 'NewsAPI',
        category: requested as NewsItem['category'],
        publishedAt: article.publishedAt?.trim() || new Date(0).toISOString(),
        author: article.author?.trim() || null,
      },
    ]
  })
}
