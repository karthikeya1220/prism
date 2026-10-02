/**
 * Unit: buildFeed is the pure core of the unified feed (PLAN.md §5) —
 * category filtering, per-type sorting, and the deterministic 2:1:1 interleave.
 */
import { describe, expect, it } from 'vitest'
import { buildFeed } from '@/features/feed/buildFeed'
import type { MovieItem, NewsItem, SocialItem } from '@/types'

const HOUR = 3_600_000
const BASE = Date.parse('2026-10-01T12:00:00Z')

function news(id: string, hoursAgo: number, category: NewsItem['category'] = 'technology'): NewsItem {
  return {
    id,
    type: 'news',
    title: id,
    description: '',
    imageUrl: null,
    url: 'https://x.test',
    source: 'Wire',
    category,
    publishedAt: new Date(BASE - hoursAgo * HOUR).toISOString(),
    author: null,
  }
}

function movie(id: string, popularity: number, category: MovieItem['category'] = 'technology'): MovieItem {
  return {
    id,
    type: 'movie',
    title: id,
    description: '',
    imageUrl: null,
    url: 'https://x.test',
    source: 'TMDB',
    category,
    publishedAt: '2026-09-01T00:00:00Z',
    rating: 7,
    releaseDate: '2026-09-01',
    genres: [],
    popularity,
  }
}

function social(id: string, hoursAgo: number): SocialItem {
  return {
    id,
    type: 'social',
    title: id,
    description: '',
    imageUrl: null,
    url: 'https://x.test',
    source: '@x',
    category: 'technology',
    publishedAt: new Date(BASE - hoursAgo * HOUR).toISOString(),
    author: { handle: 'x', displayName: 'X', avatarUrl: null },
    hashtag: 'technology',
    likes: 1,
    reposts: 0,
  }
}

describe('buildFeed', () => {
  it('interleaves news:movies:social 2:1:1 deterministically', () => {
    const feed = buildFeed({
      news: [news('n4', 1), news('n3', 2), news('n2', 3), news('n1', 4)],
      movies: [movie('m1', 90), movie('m2', 80)],
      social: [social('s1', 1), social('s2', 2)],
    })
    // Sorted first (news/social newest-first, movies popularity-first), then
    // patterned n,n,m,s — n4/n3 are the two newest stories, m1 the popular one.
    expect(feed.map((item) => item.id)).toEqual([
      'n4', 'n3', 'm1', 's1', 'n2', 'n1', 'm2', 's2',
    ])
  })

  it('skips exhausted streams instead of stalling', () => {
    const feed = buildFeed({
      news: [news('n1', 1)],
      movies: [],
      social: [social('s1', 1)],
    })
    expect(feed.map((item) => item.id)).toEqual(['n1', 's1'])
  })

  it('returns an empty feed when every stream is empty', () => {
    expect(buildFeed({ news: [], movies: [], social: [] })).toEqual([])
  })

  it('filters news/movies to the selected categories', () => {
    const feed = buildFeed({
      news: [news('n-tech', 1, 'technology'), news('n-sports', 1, 'sports')],
      movies: [movie('m-tech', 90, 'technology'), movie('m-sports', 80, 'sports')],
      social: [social('s1', 1)],
      categories: ['technology'],
    })
    const ids = feed.map((item) => item.id)
    expect(ids).toContain('n-tech')
    expect(ids).toContain('m-tech')
    expect(ids).not.toContain('n-sports')
    expect(ids).not.toContain('m-sports')
    // Social has no category preference to filter on yet.
    expect(ids).toContain('s1')
  })

  it('keeps every item when categories include general', () => {
    const feed = buildFeed({
      news: [news('n-tech', 1, 'technology'), news('n-sports', 1, 'sports')],
      movies: [],
      social: [],
      categories: ['general'],
    })
    expect(feed).toHaveLength(2)
  })
})
