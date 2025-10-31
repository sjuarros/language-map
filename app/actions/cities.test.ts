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

    const { createServerClient } = await import('@supabase/ssr')
    vi.mocked(createServerClient).mockResolvedValue(mockSupabase)

    const result = await createCity({
      slug: 'amsterdam',
      country: 'Netherlands',
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

    expect(result.id).toBe(mockCity.id)
    expect(result.slug).toBe('amsterdam')
  })

  it('should throw error for invalid slug format', async () => {
    await expect(
      createCity({
        slug: 'Invalid-City', // Invalid: uppercase letters
        country: 'Netherlands',
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
    ).rejects.toThrow('Slug must contain only lowercase letters')
  })

  it('should throw error for invalid coordinates', async () => {
    await expect(
      createCity({
        slug: 'test-city',
        country: 'Test',
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
    ).rejects.toThrow('Latitude must be between -90 and 90')
  })

  it('should throw error if user not authenticated', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        }),
      },
    }

    const { createServerClient } = await import('@supabase/ssr')
    vi.mocked(createServerClient).mockResolvedValue(mockSupabase)

    await expect(
      createCity({
        slug: 'test-city',
        country: 'Test',
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
    ).rejects.toThrow('Authentication required')
  })

  it('should throw error if user is not superuser', async () => {
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

    const { createServerClient } = await import('@supabase/ssr')
    vi.mocked(createServerClient).mockResolvedValue(mockSupabase)

    await expect(
      createCity({
        slug: 'test-city',
        country: 'Test',
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
    ).rejects.toThrow('Insufficient permissions to create cities')
  })

  it('should throw error if city slug already exists', async () => {
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

    const { createServerClient } = await import('@supabase/ssr')
    vi.mocked(createServerClient).mockResolvedValue(mockSupabase)

    await expect(
      createCity({
        slug: 'existing-city',
        country: 'Test',
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
    ).rejects.toThrow('A city with this slug already exists')
  })
})
