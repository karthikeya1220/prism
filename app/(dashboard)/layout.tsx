import type { ReactNode } from 'react'
import AppShell from '@/components/layout/AppShell'
import OnboardingDialog from '@/features/preferences/OnboardingDialog'

/**
 * Dashboard route group: every authenticated-view page shares the app shell
 * (sidebar, header, transitions). Lives in a route group so the shell never
 * wraps future non-dashboard routes (e.g. an auth screen). The first-run
 * onboarding prompt mounts here so it guards every dashboard route — not
 * just the feed — and sits outside AppShell so page transitions never
 * remount it mid-exit.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <OnboardingDialog />
    </>
  )
}
