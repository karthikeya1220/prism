import Link from 'next/link'
import { AuthCard } from '@/features/auth/AuthCard'
import { LoginForm } from '@/features/auth/LoginForm'
import { T } from '@/lib/i18n/T'

export const metadata = { title: 'Sign in — Prism' }

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

/**
 * Sign-in page (PLAN.md M11). Sits outside the dashboard layout; the proxy
 * bounces already-signed-in visitors to the dashboard, and the target route
 * (if any) arrives as ?callbackUrl=. User-facing copy renders through <T>
 * islands so it follows the chosen interface language.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const callbackUrl = typeof params?.callbackUrl === 'string' ? params.callbackUrl : undefined
  return (
    <AuthCard
      title={<T ns="auth" k="welcomeBack" />}
      description={<T ns="auth" k="signInSubtitle" />}
      footer={
        <>
          <T ns="auth" k="newToPrism" />{' '}
          <Link
            href={callbackUrl ? `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/signup'}
            className="font-medium text-accent hover:underline"
          >
            <T ns="auth" k="createAccountLink" />
          </Link>
        </>
      }
    >
      <LoginForm callbackUrl={callbackUrl} />
    </AuthCard>
  )
}
