'use client'

import { useEffect } from 'react'
import i18n from './index'
import { useAppSelector } from '@/store/hooks'

/**
 * Applies `preferences.language` to the i18next instance and `<html lang>`
 * whenever it changes (mounted once in Providers). Runs post-hydration so the
 * server-rendered English pass and the first client render match, then the
 * persisted language lands in one effect pass — no flash, no mismatch.
 */
export function LanguageSync() {
  const language = useAppSelector((state) => state.preferences.language)

  useEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language)
    if (document.documentElement.lang !== language) document.documentElement.lang = language
  }, [language])

  return null
}

export default LanguageSync
