import { describe, expect, it } from 'vitest'
import {
  CATEGORIES,
  isCategory,
  isContentItem,
  isMovieItem,
  isNewsItem,
  isSocialItem,
  type ContentItem,
  type MovieItem,
  type NewsItem,
  type SocialItem,
} from '@/types'

describe('types/content', () => {
  it('exposes the canonical category list', () => {
    expect(CATEGORIES).toEqual([
      'technology', 'business', 'finance', 'sports',
      'entertainment', 'science', 'health', 'general',
    ])
  })

  it('validates categories', () => {
    expect(isCategory('technology')).toBe(true)
    expect(isCategory('TECHNOLOGY')).toBe(false)
    expect(isCategory('cryptocurrency')).toBe(false)
  })

  it('narrows ContentItem variants via type guards', () => {
    const news: NewsItem = {
      id: 'news:1', type: 'news', title: 't', description: '', imageUrl: null,
      url: 'https://x', source: 's', category: 'technology',
      publishedAt: '2026-10-01T00:00:00Z', author: null,
    }
    const movie: MovieItem = {
      id: 'movie:1', type: 'movie', title: 't', description: '', imageUrl: null,
      url: 'https://x', source: 'TMDB', category: 'entertainment',
      publishedAt: '2026-10-01T00:00:00Z', rating: 8, releaseDate: '2026-01-01',
      genres: ['Drama'], popularity: 100,
    }
    const social: SocialItem = {
      id: 'social:1', type: 'social', title: 't', description: '', imageUrl: null,
      url: 'https://x', source: '@a', category: 'technology',
      publishedAt: '2026-10-01T00:00:00Z',
      author: { handle: 'a', displayName: 'A', avatarUrl: null },
      hashtag: 'tech', likes: 1, reposts: 2,
    }
    const items: ContentItem[] = [news, movie, social]

    expect(items.filter(isNewsItem).map((i) => i.id)).toEqual(['news:1'])
    expect(items.filter(isMovieItem).map((i) => i.id)).toEqual(['movie:1'])
    expect(items.filter(isSocialItem).map((i) => i.author.handle)).toEqual(['a'])
  })

  it('accepts only http(s) links — javascript:/data: URLs are rejected', () => {
    const base: NewsItem = {
      id: 'news:guard', type: 'news', title: 't', description: '',
      imageUrl: null, url: 'https://example.com/a', source: 's',
      category: 'technology', publishedAt: '2026-10-01T00:00:00Z', author: null,
    }

    expect(isContentItem(base)).toBe(true)
    expect(isContentItem({ ...base, url: 'http://example.com/a' })).toBe(true)
    expect(isContentItem({ ...base, url: 'javascript:alert(1)' })).toBe(false)
    expect(isContentItem({ ...base, url: 'data:text/html,<script>' })).toBe(false)
    expect(isContentItem({ ...base, imageUrl: 'javascript:alert(1)' })).toBe(false)
  })
})
