import Link from 'next/link'
import { AuthCard } from '@/features/auth/AuthCard'
import { SignupForm } from '@/features/auth/SignupForm'
import { T } from '@/lib/i18n/T'

export const metadata = { title: 'Create account — Prism' }

interface SignupPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

/**
 * Sign-up page (PLAN.md M11): account creation + automatic sign-in, then a
 * full navigation to the dashboard (or the original ?callbackUrl=). Copy
 * renders through <T> islands so it follows the chosen language.
 */
export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams
  const callbackUrl = typeof params?.callbackUrl === 'string' ? params.callbackUrl : undefined
  return (
    <AuthCard
      title={<T ns="auth" k="createYourAccount" />}
      description={<T ns="auth" k="signupSubtitle" />}
      footer={
        <>
          <T ns="auth" k="haveAccount" />{' '}
          <Link
            href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login'}
            className="font-medium text-accent hover:underline"
          >
            <T ns="auth" k="signInLink" />
          </Link>
        </>
      }
    >
      <SignupForm callbackUrl={callbackUrl} />
    </AuthCard>
  )
}
