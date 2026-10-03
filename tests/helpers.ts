/**
 * Shared fixtures + MSW handler factories for integration tests (M5+).
 * Kept out of `*.test.*` so Vitest does not collect it as a suite.
 */
import { http, HttpResponse } from 'msw'
import type {
  Category,
  ContentItem,
  ContentPage,
  MovieItem,
  NewsItem,
  SocialItem,
} from '@/types'
import { makeStore, type AppStore } from '@/store'
import {
  hydratePreferences,
  markHydrated,
  type PreferencesState,
} from '@/features/preferences/preferencesSlice'

/** Fresh store with preferences pre-hydrated (onboarded by default). */
export function makeTestStore(
  preferences?: Partial<PreferencesState>,
): AppStore {
  const store = makeStore()
  store.dispatch(
    hydratePreferences({
      categories: ['technology'],
      darkMode: false,
      language: 'en',
      onboarded: true,
      ...preferences,
    }),
  )
  // Tests skip the Providers mount effect — release hydrated-gated UI here.
  store.dispatch(markHydrated())
  return store
}

/** Contract-complete ContentPage envelope (source marks fixtures as mock). */
export function page<T extends ContentItem>(items: T[]): ContentPage<T> {
  return {
    items,
    page: 1,
    pageSize: 12,
    totalResults: items.length,
    hasMore: false,
    source: 'mock',
  }
}

export function newsFixture(
  id: string,
  title: string,
  category: Category = 'technology',
): NewsItem {
  return {
    id,
    type: 'news',
    title,
    description: `${title} — context for the fixture.`,
    imageUrl: null,
    url: 'https://example.com/article',
    source: 'The Wire',
    category,
    publishedAt: '2026-10-01T10:00:00Z',
    author: 'A. Author',
  }
}

export function movieFixture(
  id: string,
  title: string,
  category: Category = 'technology',
): MovieItem {
  return {
    id,
    type: 'movie',
    title,
    description: `${title} — a fixture film.`,
    imageUrl: null,
    url: 'https://example.com/movie',
    source: 'TMDB',
    category,
    publishedAt: '2026-09-01T00:00:00Z',
    rating: 7.6,
    releaseDate: '2026-09-01',
    genres: ['Drama'],
    popularity: 120,
  }
}

export function socialFixture(id: string, description: string): SocialItem {
  return {
    id,
    type: 'social',
    title: description,
    description,
    imageUrl: null,
    url: 'https://example.com/post',
    source: '@fixture',
    category: 'technology',
    publishedAt: '2026-10-01T12:00:00Z',
    author: { handle: 'fixture', displayName: 'Fixture', avatarUrl: null },
    hashtag: 'technology',
    likes: 320,
    reposts: 40,
  }
}

/**
 * Feed endpoint handlers: record every request URL and return category-aware
 * fixtures so a preference change is observable in both requests and DOM.
 */
export function feedHandlers(captured: string[]) {
  return [
    http.get('*/api/news', ({ request }) => {
      captured.push(request.url)
      const category = new URL(request.url).searchParams.get('category') ?? ''
      const items = [newsFixture('news:tech', 'Tech story one')]
      if (category.includes('sports')) {
        items.push(newsFixture('news:sports', 'Sports story one', 'sports'))
      }
      return HttpResponse.json(page(items))
    }),
    http.get('*/api/movies', ({ request }) => {
      captured.push(request.url)
      return HttpResponse.json(page([movieFixture('movie:one', 'Signal Horizon')]))
    }),
    http.get('*/api/social', ({ request }) => {
      captured.push(request.url)
      return HttpResponse.json(page([socialFixture('social:one', 'A fresh dev thread')]))
    }),
  ]
}

/**
 * Search endpoint handlers (M7): echo the `q` param into fixture titles so
 * grouped results, highlighting, and no-results states are observable.
 */
export function searchHandlers(captured: string[]) {
  return [
    http.get('*/api/news', ({ request }) => {
      captured.push(request.url)
      const q = new URL(request.url).searchParams.get('q') ?? ''
      if (!q) return HttpResponse.json(page([]))
      return HttpResponse.json(page([newsFixture(`news:q-${q}`, `News hit for ${q}`)]))
    }),
    http.get('*/api/movies', ({ request }) => {
      captured.push(request.url)
      const q = new URL(request.url).searchParams.get('q') ?? ''
      if (!q) return HttpResponse.json(page([]))
      return HttpResponse.json(page([movieFixture(`movie:q-${q}`, `Movie hit for ${q}`)]))
    }),
    http.get('*/api/social', ({ request }) => {
      captured.push(request.url)
      const q = new URL(request.url).searchParams.get('q') ?? ''
      if (!q) return HttpResponse.json(page([]))
      return HttpResponse.json(page([socialFixture(`social:q-${q}`, `Social hit for ${q}`)]))
    }),
  ]
}

/**
 * Trending endpoint handler: echoes the requested type + category into the
 * fixture titles, making tab switches directly observable in the DOM.
 */
export function trendingHandlers(captured: string[]) {
  return [
    http.get('*/api/trending', ({ request }) => {
      const params = new URL(request.url).searchParams
      captured.push(request.url)
      const type = params.get('type') ?? 'all'
      const scope = params.get('category') ?? 'all topics'
      if (type === 'movie') {
        return HttpResponse.json(
          page([movieFixture(`movie:${scope}`, `Movie riser — ${scope}`)]),
        )
      }
      if (type === 'social') {
        return HttpResponse.json(
          page([socialFixture(`social:${scope}`, `Social riser — ${scope}`)]),
        )
      }
      if (type === 'news') {
        return HttpResponse.json(
          page([newsFixture(`news:${scope}`, `News riser — ${scope}`)]),
        )
      }
      return HttpResponse.json(
        page([newsFixture('news:all', `Everything rising — ${scope}`)]),
      )
    }),
  ]
}
