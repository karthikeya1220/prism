import { expect, test } from '@playwright/test'
import { login, waitForPersist } from './helpers'

/**
 * Favorites (R8, PLAN.md M10): heart a card on the feed, find it grouped on
 * the favorites page, remove it into the undo toast, restore via Undo, and
 * confirm persistence across a reload (plus the empty state when the last
 * favorite goes).
 */
test('favorite, remove with undo, and persist across reloads', async ({
  page,
}) => {
  await login(page)

  // Heart the first feed card; recover its title from the accessible label.
  const favorite = page
    .getByRole('button', { name: /^Add .+ to favorites$/ })
    .first()
  const label = (await favorite.getAttribute('aria-label')) ?? ''
  const title = label.replace(/^Add /, '').replace(/ to favorites$/, '')
  expect(title).not.toBe('')
  await favorite.click()
  await expect(
    page.getByRole('button', { name: `Remove ${title} from favorites` }),
  ).toBeVisible()

  // The item lands on the favorites page.
  await page.getByRole('link', { name: 'Favorites' }).click()
  await expect(page).toHaveURL(/\/favorites$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Favorites' })).toBeVisible()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()

  // Removing drops it into the undo toast; Undo brings it straight back.
  await page.getByRole('button', { name: `Remove ${title} from favorites` }).click()
  await expect(page.getByText(/Removed/)).toBeVisible()
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(
    page.getByRole('button', { name: `Remove ${title} from favorites` }),
  ).toBeVisible()

  // Persisted per user — still there after a reload (wait out the debounce).
  await waitForPersist(page, title)
  await page.reload()
  await expect(
    page.getByRole('button', { name: `Remove ${title} from favorites` }),
  ).toBeVisible()

  // Removing the only favorite proves the empty state.
  await page.getByRole('button', { name: `Remove ${title} from favorites` }).click()
  await page.getByRole('button', { name: 'Dismiss notification' }).click()
  await expect(page.getByText('No favorites yet')).toBeVisible()
})
