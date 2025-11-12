/**
 * Description Translation Server Actions Tests
 * =============================================
 * Comprehensive unit tests for description translation CRUD operations.
 *
 * @module app/actions/description-translations.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getDescriptionTranslations,
  upsertDescriptionTranslation,
  deleteDescriptionTranslation,
  getAvailableLocales,
} from './description-translations'
import { getServerSupabaseWithCookies } from '@/lib/supabase/server-client'

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

vi.mock('@/lib/supabase/server-client', () => ({
  getServerSupabaseWithCookies: vi.fn(),
}))

// Mock sanitization library
vi.mock('@/lib/sanitization', () => ({
  sanitizeDescription: vi.fn((text: string) => text.trim().slice(0, 5000)),
  VALIDATION_LIMITS: {
    DESCRIPTION_MAX_LENGTH: 5000,
  },
}))

// Test data
const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
}

const mockDescriptionId = '00000000-0000-0000-0000-000000000002'
const mockCitySlug = 'amsterdam'

const mockTranslation = {
  description_id: mockDescriptionId,
  locale: 'en',
  text: 'This is a test description about a language community.',
  is_ai_translated: false,
  ai_model: null,
  ai_translated_at: null,
  reviewed_by: null,
  reviewed_at: null,
}

const mockLocales = [
  { code: 'en', native_name: 'English' },
  { code: 'nl', native_name: 'Nederlands' },
  { code: 'fr', native_name: 'Français' },
]

// Type for mock Supabase client
type MockSupabaseClient = {
  auth: {
    getUser: ReturnType<typeof vi.fn>
  }
  from: ReturnType<typeof vi.fn>
  [key: string]: unknown
}

// Helper to create mock Supabase client
function createMockSupabase(overrides = {}): MockSupabaseClient {
  const mockSupabase: MockSupabaseClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
    },
    from: vi.fn(),
    ...overrides,
  }

  vi.mocked(getServerSupabaseWithCookies).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof getServerSupabaseWithCookies>>)
  return mockSupabase
}

describe('getDescriptionTranslations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch translations successfully with valid parameters', async () => {
    const mockSupabase = createMockSupabase({
      from: vi.fn((table: string) => {
        if (table === 'descriptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: mockDescriptionId, city_id: 'city-1' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'description_translations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [mockTranslation],
                  error: null,
                }),
              }),
            }),
          }
        }
        return {}
      }),
    })

    const result = await getDescriptionTranslations(mockCitySlug, mockDescriptionId)

    expect(result).toEqual([mockTranslation])
    expect(mockSupabase.auth.getUser).toHaveBeenCalled()
  })

  it('should throw error for invalid city slug format', async () => {
    await expect(
      getDescriptionTranslations('Invalid@City!', mockDescriptionId)
    ).rejects.toThrow('Invalid city slug format')
  })

  it('should throw error for invalid UUID format', async () => {
    await expect(
      getDescriptionTranslations(mockCitySlug, 'invalid-uuid')
    ).rejects.toThrow('Invalid description ID format')
  })

  it('should throw error when user is not authenticated', async () => {
    createMockSupabase({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        }),
      },
    })

    await expect(
      getDescriptionTranslations(mockCitySlug, mockDescriptionId)
    ).rejects.toThrow('User not authenticated')
  })

  it('should throw error when description not found', async () => {
    createMockSupabase({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found', code: 'PGRST116' },
            }),
          }),
        }),
      })),
    })

    await expect(
      getDescriptionTranslations(mockCitySlug, mockDescriptionId)
    ).rejects.toThrow('Description not found or access denied')
  })

  it('should return empty array when no translations exist', async () => {
    createMockSupabase({
      from: vi.fn((table: string) => {
        if (table === 'descriptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: mockDescriptionId, city_id: 'city-1' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'description_translations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }
        }
        return {}
      }),
    })

    const result = await getDescriptionTranslations(mockCitySlug, mockDescriptionId)

    expect(result).toEqual([])
  })

  it('should handle database errors gracefully', async () => {
    createMockSupabase({
      from: vi.fn((table: string) => {
        if (table === 'descriptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: mockDescriptionId, city_id: 'city-1' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'description_translations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error', code: '42P01' },
                }),
              }),
            }),
          }
        }
        return {}
      }),
    })

    await expect(
      getDescriptionTranslations(mockCitySlug, mockDescriptionId)
    ).rejects.toThrow('Failed to fetch translations')
  })
})

describe('upsertDescriptionTranslation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create new translation successfully', async () => {
    const mockSupabase = createMockSupabase({
      from: vi.fn((table: string) => {
        if (table === 'descriptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: mockDescriptionId, city_id: 'city-1' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'locales') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { code: 'en' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'description_translations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn()
                .mockReturnValueOnce({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: null,
                      error: null,
                    }),
                  }),
                })
                .mockReturnValueOnce({}),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockTranslation,
                  error: null,
                }),
              }),
            }),
          }
        }
        return {}
      }),
    })

    const result = await upsertDescriptionTranslation(mockCitySlug, mockDescriptionId, {
      locale: 'en',
      text: 'This is a test description about a language community.',
    })

    expect(result).toEqual(mockTranslation)
    expect(mockSupabase.from).toHaveBeenCalledWith('description_translations')
  })

  it('should update existing translation successfully', async () => {
    const updatedTranslation = { ...mockTranslation, text: 'Updated text' }
    const mockSupabase = createMockSupabase({
      from: vi.fn((table: string) => {
        if (table === 'descriptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: mockDescriptionId, city_id: 'city-1' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'locales') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { code: 'en' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'description_translations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { description_id: mockDescriptionId, locale: 'en' },
                    error: null,
                  }),
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: updatedTranslation,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        return {}
      }),
    })

    const result = await upsertDescriptionTranslation(mockCitySlug, mockDescriptionId, {
      locale: 'en',
      text: 'Updated text',
    })

    expect(result).toEqual(updatedTranslation)
    expect(mockSupabase.from).toHaveBeenCalledWith('description_translations')
  })

  it('should throw error for invalid city slug', async () => {
    await expect(
      upsertDescriptionTranslation('Invalid@City', mockDescriptionId, {
        locale: 'en',
        text: 'Test',
      })
    ).rejects.toThrow('Invalid city slug format')
  })

  it('should throw error for invalid description ID', async () => {
    await expect(
      upsertDescriptionTranslation(mockCitySlug, 'invalid-id', {
        locale: 'en',
        text: 'Test',
      })
    ).rejects.toThrow('Invalid description ID format')
  })

  it('should validate locale format', async () => {
    await expect(
      upsertDescriptionTranslation(mockCitySlug, mockDescriptionId, {
        locale: 'invalid!',
        text: 'Test',
      })
    ).rejects.toThrow('Validation error')
  })

  it('should validate text is required', async () => {
    await expect(
      upsertDescriptionTranslation(mockCitySlug, mockDescriptionId, {
        locale: 'en',
        text: '',
      })
    ).rejects.toThrow('Validation error')
  })

  it('should throw error when locale not found', async () => {
    createMockSupabase({
      from: vi.fn((table: string) => {
        if (table === 'descriptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: mockDescriptionId, city_id: 'city-1' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'locales') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' },
                }),
              }),
            }),
          }
        }
        return {}
      }),
    })

    await expect(
      upsertDescriptionTranslation(mockCitySlug, mockDescriptionId, {
        locale: 'xx',
        text: 'Test',
      })
    ).rejects.toThrow('Locale "xx" not found')
  })

  it('should handle null data returned from update', async () => {
    createMockSupabase({
      from: vi.fn((table: string) => {
        if (table === 'descriptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: mockDescriptionId, city_id: 'city-1' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'locales') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { code: 'en' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'description_translations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { description_id: mockDescriptionId, locale: 'en' },
                    error: null,
                  }),
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: null,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        return {}
      }),
    })

    await expect(
      upsertDescriptionTranslation(mockCitySlug, mockDescriptionId, {
        locale: 'en',
        text: 'Test',
      })
    ).rejects.toThrow('No data returned from translation update')
  })

  it('should handle null data returned from insert', async () => {
    createMockSupabase({
      from: vi.fn((table: string) => {
        if (table === 'descriptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: mockDescriptionId, city_id: 'city-1' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'locales') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { code: 'en' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'description_translations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }
        }
        return {}
      }),
    })

    await expect(
      upsertDescriptionTranslation(mockCitySlug, mockDescriptionId, {
        locale: 'en',
        text: 'Test',
      })
    ).rejects.toThrow('No data returned from translation creation')
  })
})

describe('deleteDescriptionTranslation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete translation successfully', async () => {
    const mockSupabase = createMockSupabase({
      from: vi.fn((table: string) => {
        if (table === 'descriptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: mockDescriptionId, city_id: 'city-1' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'description_translations') {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  error: null,
                }),
              }),
            }),
          }
        }
        return {}
      }),
    })

    await expect(
      deleteDescriptionTranslation(mockCitySlug, mockDescriptionId, 'en')
    ).resolves.toBeUndefined()

    expect(mockSupabase.from).toHaveBeenCalledWith('description_translations')
  })

  it('should throw error for invalid city slug', async () => {
    await expect(
      deleteDescriptionTranslation('Invalid@', mockDescriptionId, 'en')
    ).rejects.toThrow('Invalid city slug format')
  })

  it('should throw error for invalid description ID', async () => {
    await expect(
      deleteDescriptionTranslation(mockCitySlug, 'invalid', 'en')
    ).rejects.toThrow('Invalid description ID format')
  })

  it('should throw error for missing locale', async () => {
    await expect(
      deleteDescriptionTranslation(mockCitySlug, mockDescriptionId, '')
    ).rejects.toThrow('Locale code is required')
  })

  it('should verify user has access before deletion', async () => {
    createMockSupabase({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        }),
      },
    })

    await expect(
      deleteDescriptionTranslation(mockCitySlug, mockDescriptionId, 'en')
    ).rejects.toThrow('User not authenticated')
  })

  it('should handle database errors on delete', async () => {
    createMockSupabase({
      from: vi.fn((table: string) => {
        if (table === 'descriptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: mockDescriptionId, city_id: 'city-1' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'description_translations') {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  error: { message: 'Delete failed', code: '23503' },
                }),
              }),
            }),
          }
        }
        return {}
      }),
    })

    await expect(
      deleteDescriptionTranslation(mockCitySlug, mockDescriptionId, 'en')
    ).rejects.toThrow('Failed to delete translation')
  })
})

describe('getAvailableLocales', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch all locales successfully', async () => {
    const mockSupabase = createMockSupabase({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockLocales,
            error: null,
          }),
        }),
      })),
    })

    const result = await getAvailableLocales(mockCitySlug)

    expect(result).toEqual(mockLocales)
    expect(mockSupabase.from).toHaveBeenCalledWith('locales')
  })

  it('should throw error for invalid city slug', async () => {
    await expect(getAvailableLocales('Invalid@!')).rejects.toThrow(
      'Invalid city slug format'
    )
  })

  it('should return empty array when no locales exist', async () => {
    createMockSupabase({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })),
    })

    const result = await getAvailableLocales(mockCitySlug)

    expect(result).toEqual([])
  })

  it('should handle database errors gracefully', async () => {
    createMockSupabase({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error', code: '42P01' },
          }),
        }),
      })),
    })

    await expect(getAvailableLocales(mockCitySlug)).rejects.toThrow(
      'Failed to fetch available languages'
    )
  })
})
