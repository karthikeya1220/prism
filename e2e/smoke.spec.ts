import { expect, test } from '@playwright/test'

/**
 * Tooling smoke test: proves Playwright + the Next.js dev server render the
 * M4 app shell (sidebar, header controls, page content). Replaced by real
 * user-flow tests in M10.
 */
test('app shell renders with navigation and theme controls', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Prism/i)
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: /your feed/i })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Trending' })).toBeVisible()
  await expect(
    page.getByRole('button', { name: /switch to (dark|light) theme/i }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeHidden()
})
