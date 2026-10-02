/**
 * TMDB adapter → MovieItem normalization (PLAN.md §4). Genre/category mapping,
 * discovery + trending endpoints, and TMDB payload quirks stay in this module.
 */
import type { ContentPage, MovieItem } from '@/types'
import { hashId } from '../hash'
import { UpstreamError } from '../upstream'

const TMDB_BASE = 'https://api.themoviedb.org/3'

/** Our Category → TMDB genre ids (action=28 etc.). */
const GENRE_IDS: Record<string, number> = {
  technology: 878, // science fiction as tech proxy
  business: 10752, // war/politics proxy — closest narrative fit
  finance: 10752,
  sports: 99, // documentary proxy
  entertainment: 10751, // family
  science: 99, // documentary
  health: 18, // drama
  general: 18,
}

interface TmdbMovie {
  id?: number
  title?: string | null
  overview?: string | null
  poster_path?: string | null
  release_date?: string | null
  vote_average?: number | null
  vote_count?: number | null
  popularity?: number | null
  genre_ids?: number[] | null
}

interface TmdbListResponse {
  results?: TmdbMovie[]
  total_results?: number
}

/** Reverse lookup: TMDB genre id → human-readable genre label. */
const GENRE_LABELS: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
  10752: 'War', 37: 'Western',
}

function bearerHeaders(): HeadersInit | undefined {
  const token = process.env.TMDB_READ_ACCESS_TOKEN
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

function appendKey(params: URLSearchParams): void {
  const key = process.env.TMDB_API_KEY
  if (key) params.set('api_key', key)
}

async function tmdbGet(path: string, params: URLSearchParams): Promise<TmdbListResponse> {
  appendKey(params)
  const response = await fetch(`${TMDB_BASE}${path}?${params}`, {
    cache: 'no-store',
    headers: bearerHeaders(),
  })
  if (!response.ok) {
    throw new UpstreamError(`TMDB responded ${response.status}`, response.status)
  }
  return (await response.json()) as TmdbListResponse
}

function normalize(movie: TmdbMovie, category: MovieItem['category']): MovieItem | null {
  const id = movie.id
  const title = movie.title?.trim()
  if (!id || !title) return null
  return {
    id: hashId('movie', String(id)),
    type: 'movie',
    title,
    description: movie.overview?.trim() || '',
    imageUrl: movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : null,
    url: `https://www.themoviedb.org/movie/${id}`,
    source: 'TMDB',
    category,
    publishedAt: movie.release_date?.trim() || new Date(0).toISOString(),
    rating: movie.vote_average ?? 0,
    releaseDate: movie.release_date?.trim() || '',
    genres: (movie.genre_ids ?? []).flatMap((g) =>
      GENRE_LABELS[g] ? [GENRE_LABELS[g]] : [],
    ),
    popularity: movie.popularity ?? 0,
  }
}

async function fetchList(
  path: 'discover' | 'search/movie' | 'trending',
  options: { categories: string[]; page: number; pageSize: number; query?: string },
): Promise<ContentPage<MovieItem>> {
  const { categories, page, pageSize, query } = options
  const key = process.env.TMDB_API_KEY || process.env.TMDB_READ_ACCESS_TOKEN
  if (!key) throw new UpstreamError('TMDB credentials are not configured')

  const category = categories[0] ?? 'general'
  const params = new URLSearchParams({
    page: String(page),
    include_adult: 'false',
    language: 'en-US',
  })
  if (query) {
    params.set('query', query)
  } else if (path !== 'trending') {
    // TMDB comma = AND, pipe = OR — we want *any* of the selected categories.
    const genreIds = categories.map((c) => GENRE_IDS[c]).filter((id): id is number => Boolean(id))
    params.set('with_genres', (genreIds.length > 0 ? genreIds : [GENRE_IDS.general]).join('|'))
    params.set('sort_by', 'popularity.desc')
  }

  const tmdbPath = path === 'trending' ? '/trending/movie/week' : `/${path}`
  const data = await tmdbGet(tmdbPath, params)
  const results = data.results ?? []
  const items = results.flatMap((m) => {
    const normalized = normalize(m, category as MovieItem['category'])
    return normalized ? [normalized] : []
  })

  return {
    items,
    page,
    pageSize,
    totalResults: data.total_results ?? items.length,
    hasMore: Boolean(data.total_results) && page * pageSize < (data.total_results ?? 0),
    source: 'live',
  }
}

/** Discover by category (mapped to genres), sorted by popularity. */
export function fetchMovies(options: {
  categories: string[]
  page: number
  pageSize: number
}): Promise<ContentPage<MovieItem>> {
  return fetchList('discover', options)
}

/** Search TMDB by title; category is reflected on results for feed filtering. */
export function searchMovies(options: {
  categories: string[]
  page: number
  pageSize: number
  query: string
}): Promise<ContentPage<MovieItem>> {
  return fetchList('search/movie', options)
}

/** Weekly trending movies (used by /api/trending). */
export function fetchTrendingMovies(options: {
  categories: string[]
  page: number
  pageSize: number
}): Promise<ContentPage<MovieItem>> {
  return fetchList('trending', options)
}
