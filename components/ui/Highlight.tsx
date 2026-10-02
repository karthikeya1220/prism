/**
 * Renders `text` with every case-insensitive occurrence of `term` wrapped in
 * a <mark> (search result highlight, M7). No regex-escaping pitfalls: the
 * match is built with indexOf on lowercased strings, so user input can never
 * form a pattern. `term` shorter than 2 chars renders the text untouched.
 */
import type { JSX } from 'react'

export function Highlight({
  text,
  term,
}: {
  text: string
  term: string
}): JSX.Element {
  const needle = term.trim().toLowerCase()
  if (needle.length < 2) return <>{text}</>

  const parts: JSX.Element[] = []
  const lower = text.toLowerCase()
  let from = 0
  let at = lower.indexOf(needle)
  let key = 0
  while (at !== -1) {
    if (at > from) parts.push(<span key={key++}>{text.slice(from, at)}</span>)
    parts.push(<mark key={key++}>{text.slice(at, at + needle.length)}</mark>)
    from = at + needle.length
    at = lower.indexOf(needle, from)
  }
  if (from < text.length) parts.push(<span key={key++}>{text.slice(from)}</span>)
  return <>{parts}</>
}

export default Highlight
