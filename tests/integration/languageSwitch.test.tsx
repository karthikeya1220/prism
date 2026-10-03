/**
 * Language switching (M13): the Settings language select dispatches
 * `setLanguage`, `LanguageSync` applies it to i18next and `<html lang>`, and
 * visible copy re-renders in Hindi (then back to English).
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { afterEach, describe, expect, it } from 'vitest'
import SettingsPanel from '@/features/preferences/SettingsPanel'
import LanguageSync from '@/lib/i18n/LanguageSync'
import i18n from '@/lib/i18n'
import { makeTestStore } from '../helpers'

afterEach(async () => {
  document.documentElement.lang = 'en'
  await i18n.changeLanguage('en')
})

describe('language switch', () => {
  it('applies Hindi live, updates the store + <html lang>, and can switch back', async () => {
    const user = userEvent.setup()
    const store = makeTestStore()
    render(
      <Provider store={store}>
        <LanguageSync />
        <SettingsPanel />
      </Provider>,
    )

    const select = screen.getByLabelText('Interface language')
    expect(select).toHaveValue('en')
    expect(screen.getByRole('heading', { name: 'Language' })).toBeInTheDocument()

    await user.selectOptions(select, 'hi')

    await waitFor(() => expect(i18n.language).toBe('hi'))
    expect(store.getState().preferences.language).toBe('hi')
    expect(document.documentElement.lang).toBe('hi')
    expect(screen.getByLabelText('इंटरफ़ेस भाषा')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'भाषा' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'डिफ़ॉल्ट पर लौटें' })).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('इंटरफ़ेस भाषा'), 'en')

    await waitFor(() => expect(i18n.language).toBe('en'))
    expect(store.getState().preferences.language).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(screen.getByRole('heading', { name: 'Language' })).toBeInTheDocument()
  })

  it('re-renders header chrome through the same instance', async () => {
    const user = userEvent.setup()
    const store = makeTestStore({ language: 'hi' })
    render(
      <Provider store={store}>
        <LanguageSync />
        <SettingsPanel />
      </Provider>,
    )

    // Store starts in Hindi — LanguageSync converges the instance on mount.
    await waitFor(() => expect(i18n.language).toBe('hi'))
    expect(screen.getByRole('heading', { name: 'भाषा' })).toBeInTheDocument()

    const select = screen.getByLabelText('इंटरफ़ेस भाषा')
    await user.selectOptions(select, 'en')
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Language' })).toBeInTheDocument())
  })
})
