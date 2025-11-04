/**
 * Admin Layout Tests
 *
 * Tests for admin layout component with authentication and authorization check.
 *
 * NOTE: AdminLayout checks both authentication and authorization (admin/superuser role).
 *
 * @module app/admin/layout.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AdminLayout from './layout'

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  usePathname: vi.fn(() => '/en/admin'),
}))

vi.mock('@/lib/auth/client', () => ({
  createAuthClient: vi.fn(),
}))

// Helper function to create a mock Supabase client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockSupabaseClient = (user: any, userRole: string = 'admin') => ({
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
          data: { role: userRole },
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

// Test data
const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@example.com',
}

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', async () => {
    const { createAuthClient } = await import('@/lib/auth/client')
    vi.mocked(createAuthClient).mockReturnValue(createMockSupabaseClient(mockUser))

    render(<AdminLayout><div>Test Children</div></AdminLayout>)

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument()
  })

  it('should redirect to login if user not authenticated', async () => {
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

    const mockSupabaseClient = createMockSupabaseClient(null)
    // When user is null, auth check should return null
    mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const { createAuthClient } = await import('@/lib/auth/client')
    vi.mocked(createAuthClient).mockReturnValue(mockSupabaseClient)

    render(<AdminLayout><div>Test Children</div></AdminLayout>)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en/login')
    })
  })

  it('should render children if user is authenticated', async () => {
    const { createAuthClient } = await import('@/lib/auth/client')
    vi.mocked(createAuthClient).mockReturnValue(createMockSupabaseClient(mockUser, 'admin'))

    render(<AdminLayout><div data-testid="test-children">Test Admin Content</div></AdminLayout>)

    await waitFor(() => {
      expect(screen.getByTestId('test-children')).toBeInTheDocument()
    })
  })

  it('should redirect to login if user is not an admin', async () => {
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
    // User has operator role, not admin
    vi.mocked(createAuthClient).mockReturnValue(createMockSupabaseClient(mockUser, 'operator'))

    render(<AdminLayout><div>Test Children</div></AdminLayout>)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en/login')
    })
  })

  it('should handle auth errors and redirect to login', async () => {
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

    const mockSupabaseClient = createMockSupabaseClient(null)
    mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth error' },
    })

    const { createAuthClient } = await import('@/lib/auth/client')
    vi.mocked(createAuthClient).mockReturnValue(mockSupabaseClient)

    render(<AdminLayout><div>Test Children</div></AdminLayout>)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en/login')
    })
  })
})
