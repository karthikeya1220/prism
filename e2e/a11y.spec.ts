import axe from 'axe-core'
import { expect, type Page, test } from '@playwright/test'
import { login } from './helpers'

/** Minimal axe types (no `any`) for the results we assert on. */
interface AxeViolation {
  id: string
  impact: string | null
  help: string
  nodes: { target: (string | number[])[] }[]
}

interface AxeRunResult {
  violations: AxeViolation[]
}

/** Shape of the `window.axe` global injected via `page.addScriptTag`. */
interface AxeGlobal {
  run: (ctx: Document, opts: Record<string, unknown>) => Promise<AxeRunResult>
}

/**
 * Inject axe-core into the current page and run it against the document,
 * returning violation summaries (rule id, impact, help, first target).
 */
async function scan(page: Page): Promise<string[]> {
  await page.addScriptTag({ content: axe.source })
  const violations = await page.evaluate(async (): Promise<string[]> => {
    const axeGlobal = (window as unknown as { axe: AxeGlobal }).axe
    const res = await axeGlobal.run(document, {
      resultTypes: ['violations'],
    })
    return res.violations.map(
      (v) =>
        `${v.id} (${v.impact ?? 'unknown'}): ${v.help} → ${JSON.stringify(
          v.nodes[0]?.target ?? [],
        )}`,
    )
  })
  return violations
}

test.describe('accessibility', () => {
  test('login page passes axe-core', async ({ page }) => {
    // Settle framer-motion entrances: axe sampling mid fade-in reports a
    // false color-contrast failure (the element's opacity is < 1).
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/login')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(await scan(page)).toEqual([])
  })

  test('dashboard pages pass axe-core', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await login(page)

    const pages = [
      {
        path: '/',
        ready: () => expect(page.locator('[data-feed-id]').first()).toBeVisible(),
      },
      {
        path: '/trending',
        ready: () => expect(page.getByRole('tablist')).toBeVisible(),
      },
      {
        path: '/favorites',
        ready: () =>
          expect(
            page.getByRole('heading', { level: 1, name: 'Favorites' }),
          ).toBeVisible(),
      },
      {
        path: '/settings',
        ready: () =>
          expect(
            page.getByRole('heading', { level: 1, name: 'Settings' }),
          ).toBeVisible(),
      },
      {
        path: '/search?q=telescope',
        ready: () => expect(page.getByRole('heading', { name: 'News' })).toBeVisible(),
      },
    ] as const

    for (const { path, ready } of pages) {
      await page.goto(path)
      await ready()
      expect(await scan(page), `axe violations on ${path}`).toEqual([])
    }
  })
})
