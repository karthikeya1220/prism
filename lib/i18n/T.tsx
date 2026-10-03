'use client'

import { useTranslation, type KeyOf, type Ns } from './index'

export interface TProps<N extends Ns> {
  /** Resource namespace holding the key (e.g. `'pages'`). */
  ns: N
  /** Dot-path key inside that namespace (e.g. `'feed.title'`). */
  k: KeyOf<N> & string
  /** Interpolation variables for `{{placeholders}}`. */
  vars?: Record<string, string | number>
}

/**
 * Tiny client island for translating text inside server-rendered pages —
 * server components can't call hooks, so they embed `<T ns="pages"
 * k="feed.title" />` wherever a string belongs. Follows the active language
 * like any other `useTranslation` consumer (switches after hydration).
 */
export function T<N extends Ns>({ ns, k, vars }: TProps<N>) {
  const { t } = useTranslation(ns)
  // The call site is checked against `KeyOf<N>`; inside, the deferred generic
  // key type and t's own generic overloads don't unify, so narrow once here.
  const translate = t as unknown as (
    key: string,
    options?: Record<string, string | number>,
  ) => string
  return <>{translate(k, vars)}</>
}

export default T
