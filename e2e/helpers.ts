import { expect, type Page } from '@playwright/test'

/** Demo credentials seeded in lib/auth/users.ts (documented in README). */
export const DEMO_USER = { email: 'demo@prism.app', password: 'PrismDemo!2026' }

export interface LoginOptions {
  /** Keep the first-run onboarding dialog open (for tests that assert it). */
  keepOnboarding?: boolean
}

/**
 * Sign in through the real /login form. Resolves once the browser has left
 * the login page; dismisses the first-run onboarding dialog afterwards
 * (fresh context → demo user is not onboarded) unless asked to keep it.
 */
export async function login(
  page: Page,
  credentials: { email: string; password: string } = DEMO_USER,
  options: LoginOptions = {},
): Promise<void> {
  await page.goto('/login')
  await fillLoginForm(page, credentials)
  await expect(page).not.toHaveURL(/\/login/)
  if (!options.keepOnboarding) await dismissOnboarding(page)
}

/** Fill + submit the login form without asserting the resulting URL. */
export async function fillLoginForm(
  page: Page,
  credentials: { email: string; password: string } = DEMO_USER,
): Promise<void> {
  await page.getByLabel(/email/i).fill(credentials.email)
  await page.getByLabel(/^password/i).fill(credentials.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

/**
 * The demo account is fresh per browser context, so first-run onboarding
 * appears shortly after login (once the session + storage hydrate). Wait for
 * it — checking too early races the dialog render — then Escape dismisses it.
 * The dismissal persists via a debounced (250 ms) storage write, so wait for
 * the flag too: a quick page reload right after would resurrect the dialog.
 */
export async function dismissOnboarding(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog')
  try {
    await dialog.waitFor({ state: 'visible', timeout: 10_000 })
  } catch {
    return // Already onboarded (no dialog ever appeared).
  }
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await page.waitForFunction(() =>
    Object.keys(localStorage)
      .filter((key) => key.startsWith('pcd:state:v1'))
      .some((key) => {
        try {
          return (
            (JSON.parse(localStorage.getItem(key) ?? '') as { preferences?: { onboarded?: boolean } })
              .preferences?.onboarded === true
          )
        } catch {
          return false
        }
      }),
  )
}

/**
 * Store writes are debounced 250 ms (store/persistence.ts); a reload racing
 * the pending write silently reverts the change. Wait until some persisted
 * `pcd:` payload contains `needle` first.
 */
export async function waitForPersist(page: Page, needle: string): Promise<void> {
  await page.waitForFunction((n) => {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key?.startsWith('pcd:') && (localStorage.getItem(key) ?? '').includes(n)) {
        return true
      }
    }
    return false
  }, needle)
}
