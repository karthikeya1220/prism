/**
 * Normalizer tests: feed upstream fixture payloads through the adapters and
 * assert the ContentItem contracts (types, required fields, ids, fallbacks).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearCache } from '@/lib/cache'
import { fetchNews } from '@/lib/apis/news'
import { fetchMovies, searchMovies } from '@/lib/apis/movies'
import { fetchSocial } from '@/lib/apis/social'
import { buildMockNewsPage } from '@/mocks/newsPage'
import { buildMockMoviesPage } from '@/mocks/moviesPage'
import { MOCK_SOCIAL } from '@/mocks/social'
import type { ContentPage, MovieItem, NewsItem } from '@/types'

const newsApiFixture = {
  status: 'ok',
  totalResults: 3,
  articles: [
    {
      source: { name: 'The Verge' },
      author: 'Mia Sato',
      title: 'On-device AI chips arrive',
      description: 'Faster local inference.',
      url: 'https://theverge.com/a-1',
      urlToImage: 'https://theverge.com/img.jpg',
      publishedAt: '2026-10-01T10:00:00Z',
    },
    {
      source: { name: 'Reuters' },
      author: null,
      title: 'Markets close higher',
      description: null,
      url: 'https://reuters.com/a-2',
      urlToImage: null,
      publishedAt: null,
    },
    { title: null, url: null }, // junk row → dropped
  ],
}

const tmdbFixture = {
  page: 1,
  results: [
    {
      id: 42,
      title: 'The Silent Algorithm',
      overview: 'A rogue recommendation engine.',
      poster_path: '/poster.jpg',
      release_date: '2026-09-01',
      vote_average: 8.1,
      popularity: 912.5,
      genre_ids: [878, 53],
    },
    { id: null, title: 'No id' }, // junk row → dropped
  ],
  total_results: 1,
}

function newsOk(payload: unknown): Response {
  return new Response(JSON.stringify(payload), { status: 200 })
}

beforeEach(() => {
  clearCache()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('news normalizer (NewsAPI → NewsItem)', () => {
  it('normalizes fixture articles and drops junk rows', async () => {
    vi.stubEnv('NEWS_API_KEY', 'test-key')
    vi.stubGlobal('fetch', vi.fn(async () => newsOk(newsApiFixture)))

    const page = await fetchNews({ categories: ['technology'], page: 1, pageSize: 12 })
    expect(page.source).toBe('live')
    expect(page.totalResults).toBe(3)
    expect(page.items).toHaveLength(2) // junk dropped

    const first = page.items[0] as NewsItem
    expect(first.id).toMatch(/^news:/)
    expect(first.type).toBe('news')
    expect(first.title).toBe('On-device AI chips arrive')
    expect(first.source).toBe('The Verge')
    expect(first.imageUrl).toBe('https://theverge.com/img.jpg')

    const second = page.items[1] as NewsItem
    expect(second.author).toBeNull() // null → null
    expect(second.description).toBe('') // null → ''
    expect(second.publishedAt).toBe('1970-01-01T00:00:00.000Z') // epoch fallback
  })

  it('maps the finance category to NewsAPI business and back', async () => {
    vi.stubEnv('NEWS_API_KEY', 'test-key')
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toContain('category=business')
      return newsOk({ status: 'ok', totalResults: 0, articles: [] })
    })
    vi.stubGlobal('fetch', fetchMock)

    const page = await fetchNews({ categories: ['finance'], page: 1, pageSize: 12 })
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(page.items).toEqual([])
  })

  it('throws UpstreamError on non-200 so handlers fall back', async () => {
    vi.stubEnv('NEWS_API_KEY', 'test-key')
    vi.stubGlobal('fetch', vi.fn(async () => new Response('rate limited', { status: 429 })))
    await expect(fetchNews({ categories: ['general'], page: 1, pageSize: 12 })).rejects.toThrow(
      /429/,
    )
  })

  it('throws UpstreamError when the key is missing (mock fallback path)', async () => {
    vi.stubEnv('NEWS_API_KEY', '')
    await expect(fetchNews({ categories: ['general'], page: 1, pageSize: 12 })).rejects.toThrow(
      /NEWS_API_KEY/,
    )
  })
})

describe('movies normalizer (TMDB → MovieItem)', () => {
  it('normalizes fixture results, maps genres, builds image urls', async () => {
    vi.stubEnv('TMDB_API_KEY', 'test-key')
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(tmdbFixture), { status: 200 })))

    const page = await fetchMovies({ categories: ['technology'], page: 1, pageSize: 12 })
    expect(page.source).toBe('live')
    expect(page.items).toHaveLength(1)

    const movie = page.items[0] as MovieItem
    expect(movie.id).toBe('movie:3hmwb') // djb2('42') base36 — deterministic
    expect(movie.type).toBe('movie')
    expect(movie.imageUrl).toBe('https://image.tmdb.org/t/p/w500/poster.jpg')
    expect(movie.genres).toEqual(['Science Fiction'])
    expect(movie.rating).toBeCloseTo(8.1)
    expect(movie.popularity).toBeCloseTo(912.5)
  })

  it('routes q to the search endpoint', async () => {
    vi.stubEnv('TMDB_API_KEY', 'test-key')
    const fetchMock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
      expect(String(input)).toContain('/search/movie?')
      expect(String(input)).toContain('query=dune')
      return new Response(JSON.stringify({ results: [], total_results: 0 }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    await searchMovies({ categories: ['general'], page: 1, pageSize: 12, query: 'dune' })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('throws UpstreamError without credentials', async () => {
    vi.stubEnv('TMDB_API_KEY', '')
    vi.stubEnv('TMDB_READ_ACCESS_TOKEN', '')
    await expect(
      fetchMovies({ categories: ['general'], page: 1, pageSize: 12 }),
    ).rejects.toThrow(/credentials/i)
  })
})

describe('social API (mock dataset)', () => {
  it('serves at least 60 realistic posts with required fields', () => {
    expect(MOCK_SOCIAL.length).toBeGreaterThanOrEqual(60)
    for (const post of MOCK_SOCIAL) {
      expect(post.author.handle).not.toBe('')
      expect(post.hashtag).not.toBe('')
      expect(post.likes).toBeGreaterThan(0)
      expect(post.author.avatarUrl).toMatch(/^https:/)
      expect(post.id).toMatch(/^social:/)
    }
  })

  it('filters by hashtag, searches, and paginates', () => {
    const finance = fetchSocial({ hashtags: ['finance'], page: 1, pageSize: 12 })
    expect(finance.items.length).toBeGreaterThan(0)
    expect(finance.items.every((p) => p.hashtag === 'finance')).toBe(true)

    const searched = fetchSocial({ hashtags: [], page: 1, pageSize: 200, query: 'poll' })
    expect(searched.items.every((p) => p.description.toLowerCase().includes('poll'))).toBe(true)

    const page1 = fetchSocial({ hashtags: [], page: 1, pageSize: 12 })
    const page2 = fetchSocial({ hashtags: [], page: 2, pageSize: 12 })
    expect(page1.items).toHaveLength(12)
    expect(page2.items).toHaveLength(12)
    expect(new Set(page1.items.map((p) => p.id))).toEqual(
      expect.not.arrayContaining(page2.items.map((p) => p.id)),
    )
    expect(page1.hasMore).toBe(true)
    expect(page2.hasMore).toBe(true)
  })

  it('builds deterministic mock fallback pages for news and movies', () => {
    const newsPage: ContentPage<NewsItem> = buildMockNewsPage(['finance'], 1, 12)
    expect(newsPage.source).toBe('mock')
    expect(newsPage.items.every((i) => i.category === 'finance')).toBe(true)

    const generalNews = buildMockNewsPage(['general'], 1, 12)
    expect(generalNews.items.length).toBeGreaterThan(0)

    const moviesPage = buildMockMoviesPage(['general'], 1, '', 12)
    expect(moviesPage.source).toBe('mock')
    expect(moviesPage.items).toHaveLength(12)

    const searched = buildMockMoviesPage(['general'], 1, 'algorithm', 12)
    expect(searched.items.map((m) => m.title)).toContain('The Silent Algorithm')
  })
})
