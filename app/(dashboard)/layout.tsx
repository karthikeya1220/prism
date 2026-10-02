import type { ReactNode } from 'react'
import AppShell from '@/components/layout/AppShell'

/**
 * Dashboard route group: every authenticated-view page shares the app shell
 * (sidebar, header, transitions). Lives in a route group so the shell never
 * wraps future non-dashboard routes (e.g. an auth screen).
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>
}
