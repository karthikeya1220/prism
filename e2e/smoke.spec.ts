import { expect, test } from '@playwright/test'

/**
 * Tooling smoke test: proves Playwright + the Next.js dev server work and the
 * app shell renders. Replaced by real user-flow tests in M10.
 */
test('dashboard home page renders', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Prism/i)
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: /prism/i })).toBeVisible()
})
