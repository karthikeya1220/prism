import { expect, test } from '@playwright/test'
import { DEMO_USER, dismissOnboarding, fillLoginForm, login } from './helpers'

/**
 * Auth flow E2E (PLAN.md M11): route protection + callbackUrl round-trip,
 * wrong-password error handling, logout, and the signed-in bounce off /login —
 * all against the real proxy, NextAuth route handlers, and demo user store.
 */

test('unauthenticated visits are redirected to /login with a callbackUrl', async ({
  page,
}) => {
  await page.goto('/settings')
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fsettings/)
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
})

test('wrong password shows an inline error and stays on the login page', async ({
  page,
}) => {
  await page.goto('/login')
  await fillLoginForm(page, { email: DEMO_USER.email, password: 'definitely-wrong' })

  // Scoped to the form alert — Next's route announcer also uses role="alert".
  await expect(page.getByRole('alert').filter({ hasText: /incorrect email or password/i })).toBeVisible()
  await expect(page).toHaveURL(/\/login/)
})

test('login returns to the requested route and the menu shows the account', async ({
  page,
}) => {
  await page.goto('/trending')
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Ftrending/)

  await fillLoginForm(page)
  await expect(page).toHaveURL(/\/trending$/)
  await dismissOnboarding(page)

  // Account menu reflects the session (email is immutable for the demo user).
  await page.getByRole('button', { name: /account menu for/i }).click()
  await expect(page.getByRole('menu')).toBeVisible()
  await expect(page.getByText(DEMO_USER.email)).toBeVisible()
})

test('logout returns to /login and re-protects the dashboard', async ({ page }) => {
  await login(page)

  await page.getByRole('button', { name: /account menu for/i }).click()
  await page.getByRole('menuitem', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login/)

  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
})

test('signed-in visitors are bounced off /login to the dashboard', async ({ page }) => {
  await login(page)
  await page.goto('/login')
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1, name: /your feed/i })).toBeVisible()
})

test('profile edits update the account menu', async ({ page }) => {
  await login(page)
  await page.goto('/profile')

  const nameInput = page.getByLabel(/display name/i)
  await nameInput.fill('E2E Explorer')
  // The radio input is visually hidden inside the chip — click the chip
  // (label), the way a real pointer does; the click bubbles to the input.
  await page.locator('label:has(input[value="🚀"])').click()
  await expect(page.getByRole('radio', { name: 'Avatar 🚀' })).toBeChecked()
  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByText('Profile saved.')).toBeVisible()

  await page.getByRole('button', { name: /account menu for e2e explorer/i }).click()
  await expect(page.getByText('E2E Explorer')).toBeVisible()
})
