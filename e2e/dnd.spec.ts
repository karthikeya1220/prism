import { expect, test } from '@playwright/test'
import { login } from './helpers'

/**
 * Drag-and-drop reorder (R11, PLAN.md M10) through the keyboard sensor:
 * Space picks the first card up, ArrowRight moves it over its neighbour,
 * Space drops it, the manual order lands (Reset order appears), and Reset
 * restores the algorithmic order.
 */
test('keyboard drag reorders the feed and Reset order restores it', async ({
  page,
}) => {
  await login(page)

  const grid = page.getByRole('list', { name: 'Your feed' })
  const firstCard = grid.locator('> li').first()
  const initialTitle = (await firstCard.getByRole('heading').first().innerText())
    .trim()

  // The grip click only focuses (PointerSensor needs 6 px of movement).
  await page.getByRole('button', { name: /^Reorder / }).first().click()
  await page.keyboard.press('Space')
  await expect(page.getByText(/Picked up card/i)).toBeVisible()
  // The sensor attaches its window keydown listener on a macrotask.
  await page.waitForTimeout(150)

  await page.keyboard.press('ArrowRight')
  await expect(page.getByText(/moved over position/i)).toBeVisible()
  await page.keyboard.press('Space')
  await expect(page.getByText(/dropped at position/i)).toBeVisible()

  // The manual order swapped the first two cards and is now persisted.
  const newTitle = (await firstCard.getByRole('heading').first().innerText()).trim()
  expect(newTitle).not.toBe(initialTitle)
  const reset = page.getByRole('button', { name: /Reset order/i })
  await expect(reset).toBeVisible()

  // Reset clears the manual order and the original order comes back.
  await reset.click()
  await expect(reset).not.toBeVisible()
  const restoredTitle = (
    await firstCard.getByRole('heading').first().innerText()
  ).trim()
  expect(restoredTitle).toBe(initialTitle)
})
