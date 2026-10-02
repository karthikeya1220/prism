/**
 * Generic value debounce (PLAN.md §5: client debounce for search). Returns
 * `value` unchanged until no new value has arrived for `delay` ms, then the
 * latest value settles through. Zero extra dependencies (rule 9).
 */
import { useEffect, useState } from 'react'

/** Mirror `value` into state, deferred by `delay` ms of quiet. */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

export default useDebounce
