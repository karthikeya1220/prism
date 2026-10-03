/**
 * Integration: auth forms + account menu against mocked next-auth (PLAN.md
 * M11) — validation UX, the sign-in/sign-up handoff (redirectTo + full-page
 * navigate), profile save via PATCH, and the real sign-out menu action.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { signIn, signOut, useSession } from 'next-auth/react'
import { LoginForm } from '@/features/auth/LoginForm'
import { SignupForm } from '@/features/auth/SignupForm'
import { ProfileForm } from '@/features/auth/ProfileForm'
import { AccountMenu } from '@/components/layout/AccountMenu'
import { navigate } from '@/lib/nav'
import { server } from '@/mocks/server'

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))
vi.mock('@/lib/nav', () => ({ navigate: vi.fn() }))

const session = {
  user: {
    id: 'user_demo',
    name: 'Demo User',
    email: 'demo@prism.app',
    avatar: '🦊' as string | null,
  },
  expires: '2099-01-01T00:00:00Z',
}

function mockAuthenticatedSession(update = vi.fn()) {
  vi.mocked(useSession).mockReturnValue({ data: session, status: 'authenticated', update })
}

async function fillLoginForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/email/i), 'demo@prism.app')
  await user.type(screen.getByLabelText(/^password/i), 'PrismDemo!2026')
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows field errors and does not call signIn when empty', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
    expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    expect(signIn).not.toHaveBeenCalled()
  })

  it('rejects a malformed email before touching the network', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText(/email/i), 'not-an-email')
    await user.type(screen.getByLabelText(/^password/i), 'longenough1')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument()
    expect(signIn).not.toHaveBeenCalled()
  })

  it('surfaces invalid credentials and keeps the user on the form', async () => {
    const user = userEvent.setup()
    vi.mocked(signIn).mockResolvedValue({
      error: 'CredentialsSignin',
      code: 'credentials',
      status: 401,
      ok: false,
      url: null,
    })
    render(<LoginForm callbackUrl="/settings" />)

    await fillLoginForm(user)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrect email or password/i)
    expect(signIn).toHaveBeenCalledWith(
      'credentials',
      expect.objectContaining({
        email: 'demo@prism.app',
        password: 'PrismDemo!2026',
        redirect: false,
        redirectTo: '/settings',
      }),
    )
    expect(navigate).not.toHaveBeenCalled()
  })

  it('navigates to the callback target after a successful sign-in', async () => {
    const user = userEvent.setup()
    vi.mocked(signIn).mockResolvedValue({
      error: undefined,
      code: undefined,
      status: 200,
      ok: true,
      url: 'http://localhost:3000/trending',
    })
    render(<LoginForm callbackUrl="/trending" />)

    await fillLoginForm(user)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith('http://localhost:3000/trending'),
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('SignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates all three fields client-side', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)

    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText(/display name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    expect(signIn).not.toHaveBeenCalled()
  })

  it('shows the server’s duplicate-email error and stops', async () => {
    const user = userEvent.setup()
    server.use(
      http.post('*/api/auth/signup', () =>
        HttpResponse.json(
          { error: { code: 'BAD_REQUEST', message: 'An account with this email already exists.' } },
          { status: 400 },
        ),
      ),
    )
    render(<SignupForm />)

    await user.type(screen.getByLabelText(/display name/i), 'Jordan Lee')
    await user.type(screen.getByLabelText(/email/i), 'demo@prism.app')
    await user.type(screen.getByLabelText(/^password/i), 'longenough1')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/i)
    expect(signIn).not.toHaveBeenCalled()
  })

  it('creates the account, then signs in and navigates', async () => {
    const user = userEvent.setup()
    const bodies: unknown[] = []
    server.use(
      http.post('*/api/auth/signup', async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({
          user: { id: 'user_new', email: 'new@prism.app', name: 'New User', avatar: '🚀' },
        })
      }),
    )
    vi.mocked(signIn).mockResolvedValue({
      error: undefined,
      code: undefined,
      status: 200,
      ok: true,
      url: 'http://localhost:3000/',
    })
    render(<SignupForm />)

    await user.type(screen.getByLabelText(/display name/i), 'New User')
    await user.type(screen.getByLabelText(/email/i), 'new@prism.app')
    await user.type(screen.getByLabelText(/^password/i), 'longenough1')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      name: 'New User',
      email: 'new@prism.app',
      password: 'longenough1',
    })
    expect(signIn).toHaveBeenCalledWith(
      'credentials',
      expect.objectContaining({ email: 'new@prism.app', redirect: false }),
    )
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('http://localhost:3000/'))
  })
})

describe('ProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('saves name + avatar via PATCH and refreshes the session', async () => {
    const user = userEvent.setup()
    const update = vi.fn()
    mockAuthenticatedSession(update)
    let patchBody: unknown
    server.use(
      http.patch('*/api/profile', async ({ request }) => {
        patchBody = await request.json()
        return HttpResponse.json({
          user: { id: 'user_demo', email: 'demo@prism.app', name: 'Renamed', avatar: '🚀' },
        })
      }),
    )
    render(<ProfileForm />)

    const nameInput = screen.getByLabelText(/display name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Renamed')
    await user.click(screen.getByRole('radio', { name: 'Avatar 🚀' }))
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(await screen.findByText('Profile saved.')).toBeInTheDocument()
    expect(patchBody).toEqual({ name: 'Renamed', avatar: '🚀' })
    expect(update).toHaveBeenCalled()
  })

  it('blocks an empty display name before any request', async () => {
    const user = userEvent.setup()
    const update = vi.fn()
    mockAuthenticatedSession(update)
    let patchHits = 0
    server.use(
      http.patch('*/api/profile', () => {
        patchHits += 1
        return HttpResponse.json({ user: {} })
      }),
    )
    render(<ProfileForm />)

    await user.clear(screen.getByLabelText(/display name/i))
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(await screen.findByText(/display name is required/i)).toBeInTheDocument()
    expect(patchHits).toBe(0)
    expect(update).not.toHaveBeenCalled()
  })
})

describe('AccountMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the session identity and links to the profile page', async () => {
    const user = userEvent.setup()
    mockAuthenticatedSession()
    render(<AccountMenu />)

    await user.click(screen.getByRole('button', { name: /account menu for demo user/i }))

    expect(await screen.findByRole('menu')).toBeInTheDocument()
    expect(screen.getByText('demo@prism.app')).toBeInTheDocument()
    const profile = screen.getByRole('menuitem', { name: 'Profile' })
    expect(profile).toHaveAttribute('href', '/profile')
  })

  it('signs out to /login from the menu', async () => {
    const user = userEvent.setup()
    mockAuthenticatedSession()
    render(<AccountMenu />)

    await user.click(screen.getByRole('button', { name: /account menu for demo user/i }))
    await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }))

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' })
  })
})
