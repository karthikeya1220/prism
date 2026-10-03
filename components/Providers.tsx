'use client'

/**
 * Client-only provider tree: owns the Redux store instance so SSR renders a
 * fresh store per request, and wraps everything in the NextAuth SessionProvider.
 *
 * Session-dependent effects (in SessionEffects, declaration order):
 *
 * 1. Once the session resolves, hydrate persisted slices *for that account*
 *    (store/persistence.ts scopes the localStorage key per user — M11) so
 *    server markup and the first client render both use slice defaults.
 * 2. First visit: mirror the pre-paint script by adopting the OS color-scheme,
 *    and keep following it until the user saves an explicit choice.
 * 3. Own `<html class="dark">`: reads the store *after* effects 1–2 have
 *    dispatched, so the first application already matches what the pre-paint
 *    script set — the class is never visibly removed (no theme flash), and
 *    every later toggle flows through this single writer.
 *
 * While `status === 'loading'` all three wait, so nothing hydrates against the
 * wrong (guest) scope; the pre-paint script already set a sane theme.
 */
import { useEffect, useRef, useState } from 'react'
import { Provider } from 'react-redux'
import { SessionProvider, useSession } from 'next-auth/react'
import { setDarkMode } from '@/features/preferences/preferencesSlice'
import { makeStore, type AppStore } from '@/store'
import { hydrateFromStorage, loadPersistedState } from '@/store/persistence'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(makeStore)

  return (
    <SessionProvider>
      <Provider store={store}>
        <SessionEffects store={store} />
        {children}
      </Provider>
    </SessionProvider>
  )
}

/** Mount-time effects that need the resolved session (see file docs). */
function SessionEffects({ store }: { store: AppStore }) {
  const { status, data } = useSession()
  const userId = data?.user?.id ?? null
  // Skip the re-hydrate when userId is unchanged (session refetches only).
  const lastUserId = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (status === 'loading' || lastUserId.current === userId) return
    lastUserId.current = userId
    hydrateFromStorage(store.dispatch, userId)
  }, [store, status, userId])

  useEffect(() => {
    if (status === 'loading') return
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
  }, [store, status])

  useEffect(() => {
    if (status === 'loading') return
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
  }, [store, status])

  return null
}
