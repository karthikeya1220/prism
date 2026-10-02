'use client'

/**
 * Client-only provider tree: owns the Redux store instance so SSR renders a
 * fresh store per request. Three mount-time effects run in declaration order:
 *
 * 1. Hydrate persisted slices *after* mount (store/persistence.ts) so server
 *    markup and the first client render both use slice defaults.
 * 2. First visit: mirror the pre-paint script by adopting the OS color-scheme,
 *    and keep following it until the user saves an explicit choice.
 * 3. Own `<html class="dark">`: reads the store *after* effects 1–2 have
 *    dispatched, so the first application already matches what the pre-paint
 *    script set — the class is never visibly removed (no theme flash), and
 *    every later toggle flows through this single writer.
 */
import { useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import { setDarkMode } from '@/features/preferences/preferencesSlice'
import { makeStore } from '@/store'
import { hydrateFromStorage, loadPersistedState } from '@/store/persistence'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(makeStore)

  useEffect(() => {
    hydrateFromStorage(store.dispatch)
  }, [store])

  useEffect(() => {
    const mq =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null
    const hasChoice = () => Boolean(loadPersistedState()?.preferences)
    if (mq && !hasChoice()) store.dispatch(setDarkMode(mq.matches))
    const onSystemChange = (e: MediaQueryListEvent) => {
      if (!hasChoice()) store.dispatch(setDarkMode(e.matches))
    }
    mq?.addEventListener('change', onSystemChange)
    return () => mq?.removeEventListener('change', onSystemChange)
  }, [store])

  useEffect(() => {
    const apply = (dark: boolean) =>
      document.documentElement.classList.toggle('dark', dark)
    let current = store.getState().preferences.darkMode
    apply(current)
    return store.subscribe(() => {
      const next = store.getState().preferences.darkMode
      if (next !== current) {
        current = next
        apply(next)
      }
    })
  }, [store])

  return <Provider store={store}>{children}</Provider>
}
