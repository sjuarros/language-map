/**
 * Admin Dashboard Tests
 *
 * Tests for admin dashboard with multi-city selector functionality.
 *
 * @module app/admin/page.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AdminDashboard from './page'

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  })),
}))

vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('en'),
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/auth/client', () => ({
  createAuthClient: vi.fn(),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: { children: React.ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  CardHeader: ({ children, ...props }: { children: React.ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: { children: React.ReactNode }) => (
    <h3 {...props}>{children}</h3>
  ),
  CardDescription: ({ children, ...props }: { children: React.ReactNode }) => (
    <p {...props}>{children}</p>
  ),
  CardContent: ({ children, ...props }: { children: React.ReactNode }) => (
    <div {...props}>{children}</div>
  ),
}))

// Test data
const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@example.com',
}

const mockCities = [
  {
    id: 'city-1',
    slug: 'amsterdam',
    name: 'Amsterdam',
    country_id: 'country-1',
  },
  {
    id: 'city-2',
    slug: 'paris',
    name: 'Paris',
    country_id: 'country-2',
  },
]

const mockUserCities = [
  {
    role: 'admin' as const,
    city: mockCities[0],
  },
  {
    role: 'admin' as const,
    city: mockCities[1],
  },
]

// Helper function to create a mock Supabase client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockSupabaseClient = (user: any, userCities: any = [], languageCount: number = 0) => {
  return {
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
    from: vi.fn().mockImplementation((table: string) => {
      // User profile query
      if (table === 'user_profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: user ? { role: 'admin' } : null,
                error: null,
              }),
            }),
          }),
        }
      }

      // City users query (for getting user's accessible cities)
      if (table === 'city_users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: userCities,
              error: null,
            }),
          }),
        }
      }

      // Languages query (for counting languages in first city)
      if (table === 'languages') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                count: languageCount,
              }),
            }),
          }),
        }
      }

      // Default empty mock
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      }
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
  } as any
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

    render(<AdminDashboard />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en/login')
    })
  })

  it('should show no city access message if user has no city grants', async () => {
    const { createAuthClient } = await import('@/lib/auth/client')
    vi.mocked(createAuthClient).mockReturnValue(createMockSupabaseClient(mockUser, []))

    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument()
      expect(screen.getByText(/No City Access/i)).toBeInTheDocument()
      expect(screen.getByText(/Contact a superuser to grant you access to cities/i)).toBeInTheDocument()
    })
  })

  it('should display city selector for users with multiple city access', async () => {
    const { createAuthClient } = await import('@/lib/auth/client')
    vi.mocked(createAuthClient).mockReturnValue(createMockSupabaseClient(mockUser, mockUserCities, 50))

    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument()
      expect(screen.getAllByText(/amsterdam/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/paris/i).length).toBeGreaterThan(0)
      expect(screen.getByText(/Select City/i)).toBeInTheDocument()
      expect(screen.getByText(/You have access to 2 cities/i)).toBeInTheDocument()
    })
  })

  it('should display stats for single city access', async () => {
    const singleCityUser = [
      {
        role: 'admin' as const,
        city: mockCities[0],
      },
    ]

    const { createAuthClient } = await import('@/lib/auth/client')
    vi.mocked(createAuthClient).mockReturnValue(createMockSupabaseClient(mockUser, singleCityUser, 25))

    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument()
      expect(screen.getAllByText(/amsterdam/i)).toHaveLength(2)
      expect(screen.getByText(/25/i)).toBeInTheDocument() // Language count
      expect(screen.getByText(/5/i)).toBeInTheDocument() // User count
    })
  })

  it('should handle database errors gracefully', async () => {
    const mockSupabase = createMockSupabaseClient(mockUser, [])
    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        }
      }
      // Return default mocks for other tables
      return vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      }))
    })

    const { createAuthClient } = await import('@/lib/auth/client')
    vi.mocked(createAuthClient).mockReturnValue(mockSupabase)

    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument()
      expect(screen.getByText(/Error/i)).toBeInTheDocument()
    })
  })
})
