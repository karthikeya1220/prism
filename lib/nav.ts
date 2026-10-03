/**
 * Full-page navigation seam: auth transitions leave the SPA so the Redux
 * store re-hydrates under the new account scope (fresh RTK cache, fresh
 * preference key). Kept in one place so tests can assert the target without
 * fighting jsdom's non-configurable `window.location`.
 */
export function navigate(url: string): void {
  window.location.assign(url)
}
