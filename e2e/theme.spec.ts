import { expect, test } from '@playwright/test'
import { login, waitForPersist } from './helpers'

/**
 * Dark mode (R12, PLAN.md M10): the header toggle flips `<html class="dark">`
 * and the choice survives a reload (device mirror + persisted preferences).
 */
test('theme toggle switches to dark mode and persists across reloads', async ({
  page,
}) => {
  await login(page)

  const root = page.locator('html')
  await expect(root).not.toHaveClass(/\bdark\b/)

  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  await expect(root).toHaveClass(/\bdark\b/)
  await expect(
    page.getByRole('button', { name: 'Switch to light theme' }),
  ).toBeVisible()

  // The persistence write is debounced — let it land before reloading.
  await waitForPersist(page, '"darkMode":true')
  await page.reload()
  await expect(root).toHaveClass(/\bdark\b/)
})
