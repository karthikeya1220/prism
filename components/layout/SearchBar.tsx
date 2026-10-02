'use client'

import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'

export interface SearchBarProps {
  className?: string
}

/**
 * Header search input. Holds the query locally for now — M7 wires it to the
 * store, debounces at 300 ms, and feeds the `q` param of every endpoint.
 * Pressing `/` anywhere outside a text field focuses the input.
 */
export function SearchBar({ className }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

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
    <div className={className}>
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
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search news, movies, posts…"
          autoComplete="off"
          className="h-10 w-full rounded-control border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-soft/80"
        />
      </div>
    </div>
  )
}

export default SearchBar
