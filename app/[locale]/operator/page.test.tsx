/**
 * Operator Dashboard Tests
 *
 * Tests for operator dashboard component with authentication and multi-city functionality.
 *
 * @module app/operator/page.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import OperatorDashboard from './page'

// Mock window.location
Object.defineProperty(window, 'location', {
  writable: true,
  value: { href: '' },
})

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
  usePathname: vi.fn(() => '/en/operator'),
}))

vi.mock('@/lib/auth/client', () => ({
  createAuthClient: vi.fn(),
}))

// Test data
const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'operator@example.com',
}

const mockCitiesData = [
  {
    role: 'operator',
    city_id: '00000000-0000-0000-0000-000000000002',
    cities: [
      {
        id: '00000000-0000-0000-0000-000000000002',
        slug: 'amsterdam',
        city_translations: [
          { name: 'Amsterdam', locale_code: 'en' }
        ]
      }
    ]
  }
]

// Helper function to create a mock Supabase client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockSupabaseClient = (user: any, citiesData = mockCitiesData) => ({
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
  from: vi.fn((table: string) => {
    if (table === 'city_users' && user) {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: citiesData,
            error: null,
          }),
        }),
      }
    }
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
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
} as any)

describe('OperatorDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.location.href = ''
  })

  it('should render loading state initially', async () => {
    const { createAuthClient } = await import('@/lib/auth/client')
    vi.mocked(createAuthClient).mockReturnValue(createMockSupabaseClient(mockUser))

    render(<OperatorDashboard />)

    expect(screen.getByText(/Operator Dashboard/i)).toBeInTheDocument()
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument()
  })

  it('should redirect if user not authenticated', async () => {
    const { createAuthClient } = await import('@/lib/auth/client')
    vi.mocked(createAuthClient).mockReturnValue(createMockSupabaseClient(null))

    render(<OperatorDashboard />)

    await waitFor(() => {
      expect(window.location.href).toBe('/en/login')
    })
  })

  it('should display user information after authentication', async () => {
    const { createAuthClient } = await import('@/lib/auth/client')
    vi.mocked(createAuthClient).mockReturnValue(createMockSupabaseClient(mockUser))

    render(<OperatorDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Operator Dashboard/i)).toBeInTheDocument()
      expect(screen.getAllByText(/Amsterdam/i).length).toBeGreaterThan(0)
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument()
    })
  })

  it('should handle authentication errors', async () => {
    const { createAuthClient } = await import('@/lib/auth/client')
    const mockSupabase = createMockSupabaseClient(null)
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth error' },
    })
    vi.mocked(createAuthClient).mockReturnValue(mockSupabase)

    render(<OperatorDashboard />)

    await waitFor(() => {
      expect(window.location.href).toBe('/en/login')
    })
  })
})
