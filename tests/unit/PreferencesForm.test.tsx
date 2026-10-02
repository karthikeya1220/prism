import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import Providers from '@/components/Providers'
import PreferencesForm from '@/features/preferences/PreferencesForm'
import { MAX_CATEGORIES } from '@/features/preferences/preferencesSlice'

describe('PreferencesForm', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('reflects the selected categories as pressed chips', () => {
    render(
      <Providers>
        <PreferencesForm />
      </Providers>,
    )
    // Slice defaults: technology + entertainment.
    expect(screen.getByRole('button', { name: 'technology' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'entertainment' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'sports' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText(`2/${MAX_CATEGORIES}`)).toBeInTheDocument()
  })

  it('toggles a category on click', async () => {
    const user = userEvent.setup()
    render(
      <Providers>
        <PreferencesForm />
      </Providers>,
    )
    await user.click(screen.getByRole('button', { name: 'sports' }))
    expect(screen.getByRole('button', { name: 'sports' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(`3/${MAX_CATEGORIES}`)).toBeInTheDocument()
  })

  it('enforces the category cap and explains it', async () => {
    const user = userEvent.setup()
    render(
      <Providers>
        <PreferencesForm />
      </Providers>,
    )
    for (const name of ['business', 'finance', 'sports']) {
      await user.click(screen.getByRole('button', { name }))
    }
    expect(screen.getByText(`${MAX_CATEGORIES}/${MAX_CATEGORIES}`)).toBeInTheDocument()
    // Sixth topic is silently refused by the reducer.
    await user.click(screen.getByRole('button', { name: 'science' }))
    expect(screen.getByRole('button', { name: 'science' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Topic limit reached — clear one to swap it.')).toBeInTheDocument()
  })
})
