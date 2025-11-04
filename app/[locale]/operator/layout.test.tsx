/**
 * Operator Layout Tests
 *
 * Tests for operator layout component with authentication and role checking.
 *
 * @module app/operator/layout.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import OperatorLayout from './layout'

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  usePathname: vi.fn(() => '/en/operator'),
}))

vi.mock('@/lib/auth/client', () => ({
  createAuthClient: vi.fn(),
}))

vi.mock('@/lib/auth/authorization', () => ({
  isOperator: vi.fn(),
}))

vi.mock('@/components/auth/logout-button', () => ({
  LogoutButton: () => <button>Logout</button>,
}))

// Test data
const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'operator@example.com',
}

// Helper function to create a mock Supabase client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockSupabaseClient = (user: any, role?: string) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user },
      error: null,
    }),
    getSession: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    admin: {
      getUserById: vi.fn(),
      createUser: vi.fn(),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: role ? { role } : null,
          error: null,
        }),
      }),
    }),
  }),
  supabaseUrl: 'http://localhost:54331',
  supabaseKey: 'mock-key',
  realtime: {
    channel: vi.fn(),
  },
  storage: {
    from: vi.fn(),
  },
  rpc: vi.fn(),
  removeChannel: vi.fn(),
  removeAllChannels: vi.fn(),
  getChannels: vi.fn(),
  channel: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any)

describe('OperatorLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', async () => {
    const { createAuthClient } = await import('@/lib/auth/client')
    vi.mocked(createAuthClient).mockReturnValue(createMockSupabaseClient(mockUser, 'operator'))

    const { isOperator } = await import('@/lib/auth/authorization')
    vi.mocked(isOperator).mockReturnValue(true)

    render(<OperatorLayout><div>Test Children</div></OperatorLayout>)

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument()
  })

  it('should redirect if user not authenticated', async () => {
    const mockPush = vi.fn()
    const { useRouter } = await import('next/navigation')
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    })

    const { createAuthClient } = await import('@/lib/auth/client')
    vi.mocked(createAuthClient).mockReturnValue(createMockSupabaseClient(null))

    render(<OperatorLayout><div>Test Children</div></OperatorLayout>)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en/login?redirectTo=/operator')
    })
  })

  it('should redirect to home if user is not operator', async () => {
    const mockPush = vi.fn()
    const { useRouter } = await import('next/navigation')
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    })

    const { createAuthClient } = await import('@/lib/auth/client')
    vi.mocked(createAuthClient).mockReturnValue(createMockSupabaseClient(mockUser, 'admin'))

    const { isOperator } = await import('@/lib/auth/authorization')
    vi.mocked(isOperator).mockReturnValue(false)

    render(<OperatorLayout><div>Test Children</div></OperatorLayout>)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en/')
    })
  })

  it('should render children if user is operator', async () => {
    const { createAuthClient } = await import('@/lib/auth/client')
    vi.mocked(createAuthClient).mockReturnValue(createMockSupabaseClient(mockUser, 'operator'))

    const { isOperator } = await import('@/lib/auth/authorization')
    vi.mocked(isOperator).mockReturnValue(true)

    render(<OperatorLayout><div data-testid="test-children">Test Operator Content</div></OperatorLayout>)

    await waitFor(() => {
      expect(screen.getByTestId('test-children')).toBeInTheDocument()
      expect(screen.getByText(/Language Map - Operator/i)).toBeInTheDocument()
    })
  })

  it('should render children if user is admin', async () => {
    const { createAuthClient } = await import('@/lib/auth/client')
    vi.mocked(createAuthClient).mockReturnValue(createMockSupabaseClient(mockUser, 'admin'))

    const { isOperator } = await import('@/lib/auth/authorization')
    vi.mocked(isOperator).mockReturnValue(true)

    render(<OperatorLayout><div data-testid="test-children">Test Admin Content</div></OperatorLayout>)

    await waitFor(() => {
      expect(screen.getByTestId('test-children')).toBeInTheDocument()
      expect(screen.getByText(/Language Map - Operator/i)).toBeInTheDocument()
    })
  })

  it('should render children if user is superuser', async () => {
    const { createAuthClient } = await import('@/lib/auth/client')
    vi.mocked(createAuthClient).mockReturnValue(createMockSupabaseClient(mockUser, 'superuser'))

    const { isOperator } = await import('@/lib/auth/authorization')
    vi.mocked(isOperator).mockReturnValue(true)

    render(<OperatorLayout><div data-testid="test-children">Test Superuser Content</div></OperatorLayout>)

    await waitFor(() => {
      expect(screen.getByTestId('test-children')).toBeInTheDocument()
      expect(screen.getByText(/Language Map - Operator/i)).toBeInTheDocument()
    })
  })
})
