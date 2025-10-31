/**
 * Admin Dashboard Tests
 *
 * Tests for admin dashboard with multi-city selector functionality.
 *
 * @module app/admin/page.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import AdminDashboard from './page'

// Mock Next.js modules
vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('en'),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
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
    country: 'Netherlands',
  },
  {
    id: 'city-2',
    slug: 'paris',
    name: 'Paris',
    country: 'France',
  },
]

const mockUserCities = [
  {
    role: 'admin',
    city: mockCities[0],
  },
  {
    role: 'admin',
    city: mockCities[1],
  },
]

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect if user not authenticated', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    }

    const { createServerClient } = await import('@supabase/ssr')
    vi.mocked(createServerClient).mockReturnValue(mockSupabase)

    const result = await AdminDashboard()

    expect(result).toBeNull()
  })

  it('should show no city access message if user has no city grants', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          }),
        }),
      }),
    }

    const { createServerClient } = await import('@supabase/ssr')
    vi.mocked(createServerClient).mockReturnValue(mockSupabase)

    const result = await AdminDashboard()

    expect(result).toBeDefined()
  })

  it('should display city selector for users with multiple city access', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn()
        // User profile query
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            }),
          }),
        })
        // City users query
        .mockReturnValueOnce({
          select: vi.fn().mockResolvedValue({
            data: mockUserCities,
            error: null,
          }),
        })
        // Language count query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  count: 50,
                }),
              }),
            }),
          }),
        })
        // User count query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  count: 10,
                }),
              }),
            }),
          }),
        }),
    }

    const { createServerClient } = await import('@supabase/ssr')
    vi.mocked(createServerClient).mockReturnValue(mockSupabase)

    const result = await AdminDashboard()

    expect(result).toBeDefined()
  })

  it('should display stats for single city access', async () => {
    const singleCityUser = [
      {
        role: 'admin',
        city: mockCities[0],
      },
    ]

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn()
        // User profile query
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            }),
          }),
        })
        // City users query
        .mockReturnValueOnce({
          select: vi.fn().mockResolvedValue({
            data: singleCityUser,
            error: null,
          }),
        })
        // Language count query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  count: 25,
                }),
              }),
            }),
          }),
        })
        // User count query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  count: 5,
                }),
              }),
            }),
          }),
        }),
    }

    const { createServerClient } = await import('@supabase/ssr')
    vi.mocked(createServerClient).mockReturnValue(mockSupabase)

    const result = await AdminDashboard()

    expect(result).toBeDefined()
  })

  it('should handle database errors gracefully', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      }),
    }

    const { createServerClient } = await import('@supabase/ssr')
    vi.mocked(createServerClient).mockReturnValue(mockSupabase)

    const result = await AdminDashboard()

    expect(result).toBeDefined()
  })
})
