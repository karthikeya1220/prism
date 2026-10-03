import type { ReactNode } from 'react'
import Brand from '@/components/layout/Brand'

export interface AuthCardProps {
  /** Heading — a string or an i18n `<T>` island on server pages. */
  title: ReactNode
  /** Subheading — a string or an i18n `<T>` island on server pages. */
  description: ReactNode
  /** The auth form (client component). */
  children: ReactNode
  /** Link row under the card (e.g. “Create an account”). */
  footer: ReactNode
}

/**
 * Centered shell for the login/signup pages: brand mark, card with the form,
 * and a footer link. Kept outside the dashboard layout (no nav chrome) so the
 * auth flow reads as its own surface.
 */
export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Brand />
        </div>
        <div className="rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
          <h1 className="text-title font-semibold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink-soft">{description}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-4 text-center text-sm text-ink-soft">{footer}</p>
      </div>
    </main>
  )
}
