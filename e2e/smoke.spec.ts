import { expect, test } from '@playwright/test'

/**
 * Tooling smoke test: proves Playwright + the Next.js dev server render the
 * M5 app shell (sidebar, header controls, page content) and that the
 * first-run onboarding prompt appears once and dismisses. Replaced by real
 * user-flow tests in M10.
 */
test('app shell renders with navigation and theme controls', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Prism/i)

  // First-run onboarding dialog appears and can be completed.
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText(/Make Prism yours/i)
  await page.getByRole('button', { name: 'Start reading' }).click()
  await expect(dialog).toBeHidden()

  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: /your feed/i })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Trending' })).toBeVisible()
  await expect(
    page.getByRole('button', { name: /switch to (dark|light) theme/i }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeHidden()
})
