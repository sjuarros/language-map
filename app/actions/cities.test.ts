/**
 * City Server Actions Tests
 *
 * Tests for city-related server actions.
 *
 * @module app/actions/cities.test
 */

import { describe, it, expect, vi } from 'vitest'
import { createCity } from './cities'

// Mock the Supabase client and related modules
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('en'),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
  })),
}))

// Mock the database abstraction layer
vi.mock('@/lib/database/client', () => ({
  getDatabaseAdminClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server-client', () => ({
  getServerSupabaseWithCookies: vi.fn(),
}))

// Test data
const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'superuser@example.com',
}

const mockCity = {
  id: '12345678-1234-1234-1234-123456789012',
  slug: 'amsterdam',
}

describe('createCity', () => {
  it('should create a city successfully', async () => {
    const mockAuthSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    }

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn()
        // First call: check user role
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'superuser' },
                error: null,
              }),
            }),
          }),
        })
        // Second call: check existing city
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        })
        // Third call: create city
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockCity,
                error: null,
              }),
            }),
          }),
        })
        // Fourth call: insert translations
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    const { getServerSupabaseWithCookies } = await import('@/lib/supabase/server-client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getServerSupabaseWithCookies).mockReturnValue(mockAuthSupabase as any)

    const result = await createCity({
      slug: 'amsterdam',
      country_id: '550e8400-e29b-41d4-a716-446655440000',
      center_lat: 52.3676,
      center_lng: 4.9041,
      default_zoom: 10,
      name_en: 'Amsterdam',
      description_en: 'Capital city of the Netherlands',
      name_nl: 'Amsterdam',
      description_nl: 'Hoofdstad van Nederland',
      name_fr: 'Amsterdam',
      description_fr: 'Capitale des Pays-Bas',
    })

    if (result.success) {
      expect(result.data.id).toBe(mockCity.id)
      expect(result.data.slug).toBe('amsterdam')
    } else {
      throw new Error('Expected success but got error: ' + result.error)
    }
  })

  it('should return error for invalid slug format', async () => {
    const result = await createCity({
      slug: 'Invalid-City', // Invalid: uppercase letters
      country_id: '550e8400-e29b-41d4-a716-446655440000',
      center_lat: 52.3676,
      center_lng: 4.9041,
      default_zoom: 10,
      name_en: 'Amsterdam',
      description_en: 'Capital city',
      name_nl: 'Amsterdam',
      description_nl: 'Hoofdstad',
      name_fr: 'Amsterdam',
      description_fr: 'Capitale',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/Slug must contain only lowercase letters/)
    }
  })

  it('should return error for invalid coordinates', async () => {
    const result = await createCity({
      slug: 'test-city',
      country_id: '550e8400-e29b-41d4-a716-446655440000',
      center_lat: 999, // Invalid: out of range
      center_lng: 4.9041,
      default_zoom: 10,
      name_en: 'Test',
      description_en: 'Test',
      name_nl: 'Test',
      description_nl: 'Test',
      name_fr: 'Test',
      description_fr: 'Test',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/Latitude must be between -90 and 90/)
    }
  })

  it('should return error if user not authenticated', async () => {
    const mockAuthSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        }),
      },
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    const { getServerSupabaseWithCookies } = await import('@/lib/supabase/server-client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue({} as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getServerSupabaseWithCookies).mockReturnValue(mockAuthSupabase as any)

    const result = await createCity({
      slug: 'test-city',
      country_id: '550e8400-e29b-41d4-a716-446655440000',
      center_lat: 52.3676,
      center_lng: 4.9041,
      default_zoom: 10,
      name_en: 'Test',
      description_en: 'Test',
      name_nl: 'Test',
      description_nl: 'Test',
      name_fr: 'Test',
      description_fr: 'Test',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Authentication required')
    }
  })

  it('should return error if user is not superuser', async () => {
    const mockAuthSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    }

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
              data: { role: 'admin' }, // Not superuser
              error: null,
            }),
          }),
        }),
      }),
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    const { getServerSupabaseWithCookies } = await import('@/lib/supabase/server-client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getServerSupabaseWithCookies).mockReturnValue(mockAuthSupabase as any)

    const result = await createCity({
      slug: 'test-city',
      country_id: '550e8400-e29b-41d4-a716-446655440000',
      center_lat: 52.3676,
      center_lng: 4.9041,
      default_zoom: 10,
      name_en: 'Test',
      description_en: 'Test',
      name_nl: 'Test',
      description_nl: 'Test',
      name_fr: 'Test',
      description_fr: 'Test',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Insufficient permissions to create cities')
    }
  })

  it('should return error if city slug already exists', async () => {
    const mockAuthSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    }

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn()
        // First call: check user role
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'superuser' },
                error: null,
              }),
            }),
          }),
        })
        // Second call: check existing city (returns existing city)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'existing-id' },
                error: null,
              }),
            }),
          }),
        }),
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    const { getServerSupabaseWithCookies } = await import('@/lib/supabase/server-client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getServerSupabaseWithCookies).mockReturnValue(mockAuthSupabase as any)

    const result = await createCity({
      slug: 'existing-city',
      country_id: '550e8400-e29b-41d4-a716-446655440000',
      center_lat: 52.3676,
      center_lng: 4.9041,
      default_zoom: 10,
      name_en: 'Test',
      description_en: 'Test',
      name_nl: 'Test',
      description_nl: 'Test',
      name_fr: 'Test',
      description_fr: 'Test',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('A city with this slug already exists')
    }
  })
})
