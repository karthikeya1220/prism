import Link from 'next/link'
import { AuthCard } from '@/features/auth/AuthCard'
import { LoginForm } from '@/features/auth/LoginForm'

export const metadata = { title: 'Sign in — Prism' }

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

/**
 * Sign-in page (PLAN.md M11). Sits outside the dashboard layout; the proxy
 * bounces already-signed-in visitors to the dashboard, and the target route
 * (if any) arrives as ?callbackUrl=.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const callbackUrl = typeof params?.callbackUrl === 'string' ? params.callbackUrl : undefined
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your personalized feed."
      footer={
        <>
          New to Prism?{' '}
          <Link
            href={callbackUrl ? `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/signup'}
            className="font-medium text-accent hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm callbackUrl={callbackUrl} />
    </AuthCard>
  )
}
