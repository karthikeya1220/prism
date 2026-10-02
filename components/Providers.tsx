'use client'

/**
 * Client-only provider tree: owns the Redux store instance so SSR renders a
 * fresh store per request. Persisted slices hydrate in an effect *after* mount
 * (store/persistence.ts) — server markup and the first client render both use
 * slice defaults, so hydration can never mismatch.
 */
import { useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import { makeStore } from '@/store'
import { hydrateFromStorage } from '@/store/persistence'

export default function Providers({ children }: { children: React.ReactNode }) {
  // Lazy state initializer: one store per component instance, created during
  // render without touching refs (react-hooks/refs safe, SSR safe).
  const [store] = useState(makeStore)

  useEffect(() => {
    hydrateFromStorage(store.dispatch)
  }, [store])

  return <Provider store={store}>{children}</Provider>
}
