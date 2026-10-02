/**
 * Root Redux store (PLAN.md §3): client-state slices + the RTK Query api
 * reducer/middleware. Created lazily and client-only via Providers
 * (components/Providers.tsx); persisted slices are rehydrated *after mount*
 * (see store/persistence.ts) so SSR markup and the first client render match.
 */
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { contentApi } from '@/features/feed/contentApi'
import preferencesReducer from '@/features/preferences/preferencesSlice'
import favoritesReducer from '@/features/favorites/favoritesSlice'
import layoutReducer from '@/features/layout/layoutSlice'
import { createPersistenceMiddleware } from './persistence'

export function makeStore() {
  const store = configureStore({
    reducer: {
      [contentApi.reducerPath]: contentApi.reducer,
      preferences: preferencesReducer,
      favorites: favoritesReducer,
      layout: layoutReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        contentApi.middleware,
        createPersistenceMiddleware().middleware,
      ),
  })
  setupListeners(store.dispatch)
  return store
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
