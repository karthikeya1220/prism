'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'

export interface SearchBarProps {
  className?: string
}

/** Below this length (after trimming) the query is considered empty. */
export const MIN_QUERY_LENGTH = 2

/**
 * Header search input (M7, R9/R10): the trimmed query syncs to `/search?q=`
 * after a 400 ms debounce (useDebounce) and at least MIN_QUERY_LENGTH
 * characters. `/` focuses the input from anywhere outside a text field,
 * Escape clears it, and Enter flushes the debounce for an immediate search.
 * URL→input sync happens render-side (adjust-on-prop-change) so external
 * navigations — back/forward, suggestion links — are followed without a
 * remount: typing never loses focus or caret position. Every sync is a
 * `history.replaceState`-style URL update (router.replace) so each keystroke
 * pause never piles up back-button entries.
 */
export function SearchBar({ className }: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get('q') ?? ''

  const [query, setQuery] = useState(urlQuery)
  /** Last URL value this bar has reconciled with (adjust-on-change guard). */
  const [syncedUrlQuery, setSyncedUrlQuery] = useState(urlQuery)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounced = useDebounce(query, 400)

  // React's "adjusting state when a prop changes" pattern: follow the URL
  // only when it changed from outside — a change that matches the local
  // draft (live query or still-settling debounce) is our own sync landing,
  // so it must not clobber in-flight typing. The input never remounts, so
  // focus and caret position survive every URL update.
  if (syncedUrlQuery !== urlQuery) {
    setSyncedUrlQuery(urlQuery)
    const matchesLocal = urlQuery === query.trim() || urlQuery === debounced.trim()
    if (!matchesLocal) setQuery(urlQuery)
  }

  // Debounced sync: only act on settled, trimmed, long-enough queries.
  // `debounced !== query` means the value is stale (e.g. the query was just
  // adopted from the URL, or cleared) — let it catch up, never re-push.
  useEffect(() => {
    const trimmed = debounced.trim()
    if (trimmed.length < MIN_QUERY_LENGTH) return
    if (trimmed === urlQuery.trim()) return
    if (trimmed !== query.trim()) return
    router.replace(`/search?q=${encodeURIComponent(trimmed)}`)
  }, [debounced, query, router, urlQuery])

  const clear = () => {
    setQuery('')
    inputRef.current?.focus()
    if (urlQuery) router.replace('/search')
  }

  // Flush the pending debounce on Enter (or submit) for an instant search.
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (trimmed.length < MIN_QUERY_LENGTH) return
    if (trimmed === urlQuery.trim()) return
    router.replace(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <form
      role="search"
      onSubmit={submit}
      className={className}
    >
      <label htmlFor="global-search" className="sr-only">
        Search news, movies, and posts
      </label>
      <div className="relative">
        <Search
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
        />
        <input
          id="global-search"
          ref={inputRef}
          type="search"
          role="searchbox"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') clear()
          }}
          placeholder="Search news, movies, posts…"
          autoComplete="off"
          aria-describedby="global-search-hint"
          className="h-10 w-full rounded-control border border-line bg-surface pl-9 pr-9 text-sm text-ink placeholder:text-ink-soft"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-ink-soft transition-colors hover:bg-line/60 hover:text-ink"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
        <p id="global-search-hint" className="sr-only">
          Press Enter to search now. Results update automatically after a short
          pause. Press Escape to clear.
        </p>
      </div>
    </form>
  )
}

/**
 * Same bar, safe to drop into the server-rendered Header: useSearchParams
 * needs a Suspense boundary during static prerender.
 */
export function SearchBarWithFallback(props: SearchBarProps) {
  return (
    <Suspense fallback={<SearchBarFallback className={props.className} />}>
      <SearchBar {...props} />
    </Suspense>
  )
}

/** Static stand-in that keeps header metrics identical while hydrating. */
function SearchBarFallback({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="h-10 w-full rounded-control border border-line bg-surface" />
    </div>
  )
}

export default SearchBarWithFallback
