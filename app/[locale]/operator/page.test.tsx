/**
 * Operator Dashboard Tests
 *
 * Tests for operator dashboard component with authentication and multi-city functionality.
 *
 * @module app/operator/page.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import type { User } from '@supabase/supabase-js'
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

vi.mock('@/lib/auth/authorization', () => ({
  isOperator: vi.fn((role) => role === 'operator'),
}))

// Mock AuthContext
let mockUseAuthReturn: {
  user: User | null
  loading: boolean
  authorized: boolean
} = {
  user: null,
  loading: true,
  authorized: false,
}

vi.mock('@/components/auth/AuthContext', async () => {
  const actual = await vi.importActual('@/components/auth/AuthContext')
  return {
    ...actual,
    useAuth: () => mockUseAuthReturn,
  }
})

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

    // Reset mock auth return
    mockUseAuthReturn = {
      user: null,
      loading: true,
      authorized: false,
    }
  })

  it('should render loading state initially', async () => {
    // Set loading to true
    mockUseAuthReturn = {
      user: null,
      loading: true,
      authorized: false,
    }

    render(<OperatorDashboard />)

    expect(screen.getByText(/Operator Dashboard/i)).toBeInTheDocument()
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument()
  })

  it('should render loading state when not authenticated', async () => {
    // Simulate not authenticated (layout handles redirect, page just shows loading)
    mockUseAuthReturn = {
      user: null,
      loading: true,
      authorized: false,
    }

    render(<OperatorDashboard />)

    expect(screen.getByText(/Operator Dashboard/i)).toBeInTheDocument()
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument()
  })

  it('should display user information after authentication', async () => {
    const { createAuthClient } = await import('@/lib/auth/client')
    vi.mocked(createAuthClient).mockReturnValue(createMockSupabaseClient(mockUser))

    // Set user as authenticated
    mockUseAuthReturn = {
      user: mockUser as User,
      loading: false,
      authorized: true,
    }

    render(<OperatorDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Operator Dashboard/i)).toBeInTheDocument()
      expect(screen.getAllByText(/Amsterdam/i).length).toBeGreaterThan(0)
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument()
    })
  })

  it('should handle authentication errors by showing loading', async () => {
    // Simulate authentication error
    mockUseAuthReturn = {
      user: null,
      loading: true,
      authorized: false,
    }

    render(<OperatorDashboard />)

    expect(screen.getByText(/Operator Dashboard/i)).toBeInTheDocument()
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument()
  })
})
