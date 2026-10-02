/**
 * Integration: first-run onboarding prompt — appears for a new user, takes
 * category input inline, and permanently records completion (persisted flag).
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { beforeEach, describe, expect, it } from 'vitest'
import OnboardingDialog from '@/features/preferences/OnboardingDialog'
import { makeTestStore } from '../helpers'

describe('onboarding dialog', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('prompts a first-run user for topics and completes on Start reading', async () => {
    const user = userEvent.setup()
    const store = makeTestStore({ onboarded: false, categories: ['technology'] })

    render(
      <Provider store={store}>
        <OnboardingDialog />
      </Provider>,
    )

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAccessibleName('Make Prism yours')
    // Category chips are offered inline.
    expect(screen.getByRole('button', { name: 'sports' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Start reading' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(store.getState().preferences.onboarded).toBe(true)
    expect(store.getState().preferences.categories).toEqual(['technology'])
  })

  it('dismisses with Escape and remembers that onboarding happened', async () => {
    const user = userEvent.setup()
    const store = makeTestStore({ onboarded: false })

    render(
      <Provider store={store}>
        <OnboardingDialog />
      </Provider>,
    )
    await screen.findByRole('dialog')

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(store.getState().preferences.onboarded).toBe(true)

    // A rerender with the completed flag never re-opens the prompt.
    render(
      <Provider store={store}>
        <OnboardingDialog />
      </Provider>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('stays hidden for an already-onboarded user', () => {
    render(
      <Provider store={makeTestStore({ onboarded: true })}>
        <OnboardingDialog />
      </Provider>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
