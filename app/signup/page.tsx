import Link from 'next/link'
import { AuthCard } from '@/features/auth/AuthCard'
import { SignupForm } from '@/features/auth/SignupForm'

export const metadata = { title: 'Create account — Prism' }

interface SignupPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

/**
 * Sign-up page (PLAN.md M11): account creation + automatic sign-in, then a
 * full navigation to the dashboard (or the original ?callbackUrl=).
 */
export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams
  const callbackUrl = typeof params?.callbackUrl === 'string' ? params.callbackUrl : undefined
  return (
    <AuthCard
      title="Create your account"
      description="Save favorites, topics, and layout — per account."
      footer={
        <>
          Already have an account?{' '}
          <Link
            href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login'}
            className="font-medium text-accent hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm callbackUrl={callbackUrl} />
    </AuthCard>
  )
}
