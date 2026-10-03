import { randomBytes } from 'node:crypto'
import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration. E2E tests run against the Next.js dev server with
 * no API keys set, so route handlers serve mock data (see PLAN.md §4) and the
 * suite is hermetic. Port 3111 avoids colliding with other local dev servers.
 * NextAuth needs AUTH_SECRET: use the real one when set, otherwise a random
 * per-run secret (sessions only need to be consistent within one server run).
 */
const PORT = 3111
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // One worker everywhere: parallel workers contend for the dev server's
  // on-demand compiles, which intermittently starves auth redirects
  // (signOut POST) past the assertion timeout.
  workers: 1,
  // Parallel workers contend for the dev server's on-demand compiles; 10 s
  // absorbs navigation waits (login/signOut redirects) that 5 s occasionally
  // doesn't when several first-loads race.
  expect: { timeout: 10_000 },
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      AUTH_SECRET: process.env.AUTH_SECRET ?? randomBytes(32).toString('hex'),
    },
  },
})
