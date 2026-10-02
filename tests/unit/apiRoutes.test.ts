/**
 * Route-handler contract tests (PLAN.md §4): param validation → 400, mock
 * fallback when upstream keys are missing, and the uniform ContentPage shape.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { clearCache } from '@/lib/cache'
import { GET as getNews } from '@/app/api/news/route'
import { GET as getMovies } from '@/app/api/movies/route'
import { GET as getSocial } from '@/app/api/social/route'
import { GET as getTrending } from '@/app/api/trending/route'
import type { ApiErrorBody, ContentItem, ContentPage, MovieItem, NewsItem, SocialItem } from '@/types'

function req(path: string): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`)
}

async function expectBadRequest(response: Response): Promise<void> {
  expect(response.status).toBe(400)
  const body = (await response.json()) as ApiErrorBody
  expect(body.error.code).toBe('BAD_REQUEST')
  expect(body.error.message).toBeTruthy()
}

describe('GET /api/news', () => {
  beforeEach(() => {
    clearCache()
    vi.stubEnv('NEWS_API_KEY', '')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('falls back to mock data when the key is missing', async () => {
    const page = (await (await getNews(req('/api/news?category=finance&page=1'))).json()) as
      ContentPage<NewsItem>
    expect(page.source).toBe('mock')
    expect(page.page).toBe(1)
    expect(page.pageSize).toBe(12)
    expect(page.items.length).toBeGreaterThan(0)
    expect(page.items.every((item) => item.category === 'finance')).toBe(true)
    expect(page.items.every((item) => item.id.startsWith('news:'))).toBe(true)
  })

  it('rejects a non-numeric page with 400 BAD_REQUEST', async () => {
    await expectBadRequest(await getNews(req('/api/news?page=abc')))
  })

  it('rejects an unknown category with 400 BAD_REQUEST', async () => {
    await expectBadRequest(await getNews(req('/api/news?category=cryptocurrency')))
  })

  it('serves an empty page past the fixture data', async () => {
    const page = (await (await getNews(req('/api/news?page=10'))).json()) as ContentPage<NewsItem>
    expect(page.items).toEqual([])
    expect(page.hasMore).toBe(false)
  })
})

describe('GET /api/movies', () => {
  beforeEach(() => {
    clearCache()
    vi.stubEnv('TMDB_API_KEY', '')
    vi.stubEnv('TMDB_READ_ACCESS_TOKEN', '')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('falls back to mock data when credentials are missing', async () => {
    const page = (await (await getMovies(req('/api/movies?category=technology'))).json()) as
      ContentPage<MovieItem>
    expect(page.source).toBe('mock')
    expect(page.pageSize).toBe(12)
    expect(page.items.every((item) => item.type === 'movie')).toBe(true)
    expect(page.items.every((item) => item.id.startsWith('movie:'))).toBe(true)
  })

  it('filters the mock fallback by search query', async () => {
    const page = (await (await getMovies(req('/api/movies?q=algorithm'))).json()) as
      ContentPage<MovieItem>
    expect(page.items.some((item) => item.title.includes('Algorithm'))).toBe(true)
  })
})

describe('GET /api/social', () => {
  it('filters by hashtag and paginates', async () => {
    const pageOne = (await (await getSocial(req('/api/social?hashtag=finance&page=1'))).json()) as
      ContentPage<SocialItem>
    expect(pageOne.source).toBe('live')
    expect(pageOne.items.length).toBeGreaterThan(0)
    expect(pageOne.items.every((post) => post.hashtag === 'finance')).toBe(true)
    expect(pageOne.items.every((post) => post.author.avatarUrl?.startsWith('https://'))).toBe(true)

    const pageTwo = (await (await getSocial(req('/api/social?hashtag=finance&page=2'))).json()) as
      ContentPage<SocialItem>
    const ids = new Set(pageOne.items.map((post) => post.id))
    expect(pageTwo.items.some((post) => ids.has(post.id))).toBe(false)
  })

  it('supports free-text search across the dataset', async () => {
    const page = (await (await getSocial(req('/api/social?q=poll'))).json()) as
      ContentPage<SocialItem>
    expect(page.items.length).toBeGreaterThan(0)
    expect(
      page.items.every((post) => post.description.toLowerCase().includes('poll')),
    ).toBe(true)
  })

  it('rejects an over-long query with 400 BAD_REQUEST', async () => {
    await expectBadRequest(await getSocial(req(`/api/social?q=${'a'.repeat(81)}`)))
  })
})

describe('GET /api/trending', () => {
  beforeEach(() => {
    clearCache()
    vi.stubEnv('NEWS_API_KEY', '')
    vi.stubEnv('TMDB_API_KEY', '')
    vi.stubEnv('TMDB_READ_ACCESS_TOKEN', '')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('returns a merged, scored cross-type page', async () => {
    const page = (await (await getTrending(req('/api/trending'))).json()) as ContentPage<ContentItem>
    expect(page.items.length).toBeGreaterThan(0)
    expect(page.hasMore).toBe(false)
    const types = new Set(page.items.map((item) => item.type))
    expect(types.size).toBeGreaterThan(1)
  })
})
