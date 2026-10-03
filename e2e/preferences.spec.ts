import { expect, test } from '@playwright/test'
import { login, waitForPersist } from './helpers'

/**
 * Preferences (R1, PLAN.md M10): picking a topic in Settings updates the
 * counter, persists across a reload, and the feed then includes content from
 * the new topic (mock fallback honors `?category=`).
 */
test('topic picked in Settings persists and feeds new content', async ({
  page,
}) => {
  await login(page)

  // Client-side nav: a full load re-creates the store, and clicking a chip
  // before the session resolves would be clobbered by rehydration.
  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Settings' })
    .click()
  await expect(page).toHaveURL(/\/settings$/)

  const science = page.getByRole('button', { name: 'science', exact: true })
  await expect(science).toHaveAttribute('aria-pressed', 'false')
  await science.click()
  await expect(science).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('3/5')).toBeVisible()

  // Saved per user — still selected after a full reload (wait out the debounce).
  await waitForPersist(page, '"science"')
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'science', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')

  // The feed refetches with the new category set.
  await page.goto('/')
  await expect(
    page.getByText('Webb telescope spots possible water vapor on exoplanet'),
  ).toBeVisible()
})
