import { expect, test } from '@playwright/test'
import { login } from './helpers'

/**
 * Cross-category search (R9/R10, PLAN.md M10): the header bar debounces into
 * the URL, the search page groups mock results by source, filter chips narrow
 * the groups, and clearing returns to the min-chars empty state.
 */
test('search bar debounces into /search and groups results by source', async ({
  page,
}) => {
  await login(page)

  await page.getByRole('searchbox').fill('robotics')
  await expect(page).toHaveURL(/\/search\?q=robotics$/)

  // Mock news fallback matches the query; movies/social have no match.
  await expect(
    page.getByText('Open-source robotics stack hits v2 with real-time control'),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'News' })).toBeVisible()

  // Filter chips reflect per-source counts; narrowing hides other groups.
  await expect(page.getByRole('button', { name: 'News (1)' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Movies (0)' })).toBeVisible()
  await page.getByRole('button', { name: 'Movies (0)' }).click()
  await expect(page.getByText(/No movies matched/)).toBeVisible()
  await expect(
    page.getByText('Open-source robotics stack hits v2 with real-time control'),
  ).toHaveCount(0)

  // Clearing the bar drops back to the min-chars empty state.
  await page.getByRole('button', { name: 'Clear search' }).click()
  await expect(page).toHaveURL(/\/search$/)
  await expect(page.getByText('Type at least two characters')).toBeVisible()
})
