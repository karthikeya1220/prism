/**
 * RTK Query API slice for all content endpoints (PLAN.md §3/§4): getNews,
 * getMovies, getSocial, getTrending, and search. Infinite scroll is implemented
 * the standard way per endpoint: page is excluded from the cache key
 * (serializeQueryArgs), later pages merge into the first entry, and
 * forceRefetch fires the network request only when the page changes.
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { ApiErrorBody, ContentItem, ContentPage, MovieItem, NewsItem, SocialItem } from '@/types'

export type ContentTag = { type: 'Content'; id: string }

/** Filters shared by the feed endpoints; page drives infinite scroll. */
export interface FeedArgs {
  categories?: string[]
  hashtags?: string[]
  q?: string
  page?: number
}

/** Slice requested from /api/trending; category narrows one section. */
export interface TrendingArgs {
  type?: 'news' | 'movie' | 'social' | 'all'
  category?: string
}

/** One source's slice of a cross-type search (M7): items + server-side total. */
export interface SearchSourceSlice<T extends ContentItem> {
  items: T[]
  /** Upstream total for this source; falls back to the page size. */
  totalResults: number
  /** True when this source failed — the other sources still render. */
  failed: boolean
}

/** Grouped result of one search across all three content sources. */
export interface SearchBundle {
  news: SearchSourceSlice<NewsItem>
  movies: SearchSourceSlice<MovieItem>
  social: SearchSourceSlice<SocialItem>
}

function emptySlice<T extends ContentItem>(): SearchSourceSlice<T> {
  return { items: [], totalResults: 0, failed: false }
}

function sliceOf<T extends ContentItem>(result: PageResult<T>): SearchSourceSlice<T> {
  if ('data' in result) {
    return {
      items: result.data.items,
      totalResults: result.data.totalResults,
      failed: false,
    }
  }
  return { items: [], totalResults: 0, failed: true }
}

type PageResult<T extends ContentItem> =
  | { data: ContentPage<T> }
  | { error: FetchBaseQueryError }

async function fetchPage<T extends ContentItem>(
  path: 'news' | 'movies' | 'social',
  args: FeedArgs,
  signal: AbortSignal | undefined,
): Promise<PageResult<T>> {
  const params = new URLSearchParams()
  if (path === 'social') {
    if (args.hashtags?.length) params.set('hashtag', args.hashtags.join(','))
  } else if (args.categories?.length) {
    params.set('category', args.categories.join(','))
  }
  if (args.q) params.set('q', args.q)
  params.set('page', String(args.page ?? 1))

  try {
    const response = await fetch(`/api/${path}?${params}`, { signal })
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as ApiErrorBody | null
      return { error: { status: response.status, data: body } }
    }
    return { data: (await response.json()) as ContentPage<T> }
  } catch (error) {
    return { error: { status: 'FETCH_ERROR', error: String(error) } }
  }
}

/**
 * Shared infinite-scroll endpoint config: one cache entry per filter set
 * (page excluded from the key), pages merged append-only with dedupe.
 */
function infiniteScrollQuery<T extends ContentItem>(path: 'news' | 'movies' | 'social') {
  return {
    queryFn: async (args: FeedArgs, ctx: { signal: AbortSignal }): Promise<PageResult<T>> =>
      fetchPage<T>(path, args, ctx.signal),
    serializeQueryArgs: ({ endpointName, queryArgs }: { endpointName: string; queryArgs: FeedArgs }) => ({
      endpointName,
      categories: queryArgs.categories,
      hashtags: queryArgs.hashtags,
      q: queryArgs.q,
    }),
    merge: (current: ContentPage<T>, incoming: ContentPage<T>) => {
      const seen = new Set(current.items.map((item) => item.id))
      current.items.push(...incoming.items.filter((item) => !seen.has(item.id)))
      current.page = incoming.page
      current.hasMore = incoming.hasMore
      current.totalResults = incoming.totalResults
      current.source = incoming.source
    },
    forceRefetch: ({ currentArg, previousArg }: { currentArg?: FeedArgs; previousArg?: FeedArgs }) =>
      currentArg?.page !== previousArg?.page,
    providesTags: ['Content'] as const,
  }
}

export const contentApi = createApi({
  reducerPath: 'contentApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Content'],
  endpoints: (builder) => ({
    /** News feed (infinite scroll). */
    getNews: builder.query<ContentPage<NewsItem>, FeedArgs>(
      infiniteScrollQuery<NewsItem>('news'),
    ),
    /** Movie recommendations (infinite scroll). */
    getMovies: builder.query<ContentPage<MovieItem>, FeedArgs>(
      infiniteScrollQuery<MovieItem>('movies'),
    ),
    /** Social posts (infinite scroll). */
    getSocial: builder.query<ContentPage<SocialItem>, FeedArgs>(
      infiniteScrollQuery<SocialItem>('social'),
    ),

    /** Trending section: pre-scored mix, optionally sliced by type + category. */
    getTrending: builder.query<ContentPage<ContentItem>, TrendingArgs>({
      query: (args) => {
        const params = new URLSearchParams()
        if (args?.type && args.type !== 'all') params.set('type', args.type)
        if (args?.category) params.set('category', args.category)
        const qs = params.toString()
        return qs ? `/trending?${qs}` : '/trending'
      },
      providesTags: ['Content'],
    }),

    /**
     * Cross-type search (M7): fires news/movies/social in parallel on one
     * shared abort signal and returns grouped per-source slices. Each `q`
     * gets its own cache entry, and RTK Query aborts superseded requests —
     * fast typing can never render an older query's results.
     */
    search: builder.query<SearchBundle, { q: string }>({
      queryFn: async ({ q }, { signal }) => {
        const trimmed = q.trim()
        if (!trimmed) {
          return {
            data: {
              news: emptySlice<NewsItem>(),
              movies: emptySlice<MovieItem>(),
              social: emptySlice<SocialItem>(),
            },
          }
        }
        const [news, movies, social] = await Promise.all([
          fetchPage<NewsItem>('news', { q: trimmed, page: 1 }, signal),
          fetchPage<MovieItem>('movies', { q: trimmed, page: 1 }, signal),
          fetchPage<SocialItem>('social', { q: trimmed, page: 1 }, signal),
        ])
        return {
          data: {
            news: sliceOf(news),
            movies: sliceOf(movies),
            social: sliceOf(social),
          },
        }
      },
      providesTags: ['Content'],
    }),
  }),
})

export const {
  useGetNewsQuery,
  useGetMoviesQuery,
  useGetSocialQuery,
  useGetTrendingQuery,
  useSearchQuery,
} = contentApi
