/**
 * Unit Tests for Language Server Actions
 * ========================================
 * Comprehensive tests for language CRUD operations with error handling and validation.
 *
 * @module app/actions/languages.test
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import {
  getLanguages,
  getLanguage,
  createLanguage,
  updateLanguage,
  deleteLanguage,
  getLanguageFamiliesForSelect,
  getCountriesForSelect,
  getTaxonomyValuesForSelect,
} from './languages'

// Mock Next.js cache module
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock Supabase server client
vi.mock('@/lib/supabase/server-client', () => ({
  getServerSupabaseWithCookies: vi.fn(),
}))

// Import mocked modules
import { revalidatePath } from 'next/cache'
import { getServerSupabaseWithCookies } from '@/lib/supabase/server-client'

/**
 * Mock Supabase client factory
 * Creates a chainable mock that supports all Supabase query builder methods
 */
function createMockSupabaseClient() {
  const mockClient = {
    from: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    order: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123', role: 'operator' } },
        error: null,
      }),
    },
  }

  // Make all query builder methods chainable by returning the mock client
  mockClient.from.mockReturnValue(mockClient)
  mockClient.select.mockReturnValue(mockClient)
  mockClient.insert.mockReturnValue(mockClient)
  mockClient.update.mockReturnValue(mockClient)
  mockClient.delete.mockReturnValue(mockClient)
  mockClient.eq.mockReturnValue(mockClient)
  mockClient.order.mockReturnValue(mockClient)

  return mockClient
}

describe('Language Server Actions', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
    ;(getServerSupabaseWithCookies as Mock).mockResolvedValue(mockSupabase)
  })

  describe('getLanguages', () => {
    it('should fetch languages successfully', async () => {
      // Arrange
      const mockCity = { id: 'city-1' }

      // Note: Supabase join queries use aliases (e.g., translations:language_family_translations)
      // This means the result will have 'translations' property, not 'language_family_translations'
      const mockLanguages = [
        {
          id: 'lang-1',
          endonym: 'English',
          iso_639_3_code: 'eng',
          speaker_count: null,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          language_family: {
            id: 'fam-1',
            slug: 'indo-european',
            // Supabase alias 'translations:' makes this property called 'translations'
            translations: [
              { locale_code: 'en', name: 'Indo-European' }
            ]
          },
          country_of_origin: {
            id: 'country-1',
            iso_code_2: 'GB',
            iso_code_3: 'GBR',
            // Same here - alias 'translations:' creates 'translations' property
            translations: [
              { locale_code: 'en', name: 'United Kingdom' }
            ]
          },
          translations: [
            { id: 't-1', locale_code: 'en', name: 'English', is_ai_translated: false }
          ],
          taxonomies: [],
        },
      ]

      // Mock city lookup, then languages query
      mockSupabase.single.mockResolvedValueOnce({ data: mockCity, error: null })
      mockSupabase.order.mockResolvedValueOnce({ data: mockLanguages, error: null })

      // Act
      const result = await getLanguages('amsterdam', 'en')

      // Assert - result has been processed to filter and structure translations
      // The processing transforms the nested structure to have filtered translations
      expect(result).toEqual(mockLanguages)
      expect(mockSupabase.from).toHaveBeenCalledWith('cities')
      expect(mockSupabase.from).toHaveBeenCalledWith('languages')
    })

    it('should throw error when citySlug is invalid', async () => {
      // Arrange & Act & Assert
      await expect(getLanguages('', 'en')).rejects.toThrow('City slug is required')
    })

    it('should throw error when locale is invalid', async () => {
      // Arrange & Act & Assert
      await expect(getLanguages('amsterdam', '')).rejects.toThrow('Locale is required')
    })

    it('should return empty array when no languages found', async () => {
      // Arrange
      const mockCity = { id: 'city-1' }

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockCity, error: null })
        .mockResolvedValueOnce({ data: null, error: null })

      // Act
      const result = await getLanguages('amsterdam', 'en')

      // Assert
      expect(result).toEqual([])
    })

    it('should throw error when database query fails', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      })

      // Act & Assert
      await expect(getLanguages('amsterdam', 'en')).rejects.toThrow(
        'Failed to fetch city "amsterdam": Database connection failed'
      )
    })
  })

  describe('getLanguage', () => {
    it('should fetch a single language successfully', async () => {
      // Arrange
      const mockLanguage = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        endonym: 'English',
        iso_639_3_code: 'eng',
        translations: [{ name: 'English', locale_code: 'en' }],
        language_family_id: 'fam-1',
        country_of_origin_id: 'country-1',
        speaker_count: 1500000000,
        taxonomies: [{ taxonomy_value_id: 'tax-1' }],
      }

      mockSupabase.single.mockResolvedValue({ data: mockLanguage, error: null })

      // Act
      const result = await getLanguage('amsterdam', '550e8400-e29b-41d4-a716-446655440000')

      // Assert
      expect(result).toEqual(mockLanguage)
      expect(mockSupabase.from).toHaveBeenCalledWith('languages')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '550e8400-e29b-41d4-a716-446655440000')
    })

    it('should throw error when id is invalid UUID', async () => {
      // Arrange & Act & Assert
      await expect(getLanguage('amsterdam', 'invalid-id')).rejects.toThrow('Invalid language ID format')
    })

    it('should throw not found error when language does not exist', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({ data: null, error: null })

      // Act & Assert
      await expect(getLanguage('amsterdam', '550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(
        'Language not found'
      )
    })
  })

  describe('createLanguage', () => {
    it('should create language with translations and taxonomies successfully', async () => {
      // Arrange
      const formData = {
        iso_639_3_code: 'eng',
        endonym: 'English',
        name_en: 'English',
        name_nl: 'Engels',
        name_fr: 'Anglais',
        language_family_id: '550e8400-e29b-41d4-a716-446655440001',
        country_of_origin_id: '550e8400-e29b-41d4-a716-446655440002',
        speaker_count: 1500000000,
        taxonomy_value_ids: [
          '550e8400-e29b-41d4-a716-446655440003',
          '550e8400-e29b-41d4-a716-446655440004',
        ],
      }

      const mockCity = { id: 'city-1', slug: 'amsterdam' }
      const mockLanguage = { id: '550e8400-e29b-41d4-a716-446655440000', ...formData }

      // Mock city lookup (first from().select().eq().single() call)
      let callCount = 0
      mockSupabase.single.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // City lookup
          return Promise.resolve({ data: mockCity, error: null })
        } else {
          // Language insert with select().single()
          return Promise.resolve({ data: mockLanguage, error: null })
        }
      })

      // Make insert chainable for the language insert, and resolves for translations/taxonomies
      let insertCallCount = 0
      mockSupabase.insert.mockImplementation(() => {
        insertCallCount++
        if (insertCallCount === 1) {
          // Language insert - needs to chain to .select()
          return mockSupabase
        } else {
          // Translations and taxonomies - resolve directly
          return Promise.resolve({ data: null, error: null })
        }
      })

      // Act
      const result = await createLanguage('amsterdam', formData)

      // Assert
      expect(result).toEqual(mockLanguage)
      expect(mockSupabase.insert).toHaveBeenCalledTimes(3) // language + translations + taxonomies
      expect(revalidatePath).toHaveBeenCalledWith('/[locale]/operator/amsterdam/languages')
    })

    it('should throw validation error for missing endonym', async () => {
      // Arrange
      const formData = {
        iso_639_3_code: 'eng',
        endonym: '', // Missing required field
        name_en: 'English',
        name_nl: '',
        name_fr: '',
        language_family_id: '',
        country_of_origin_id: '',
        speaker_count: undefined,
        taxonomy_value_ids: [],
      }

      // Act & Assert
      await expect(createLanguage('amsterdam', formData)).rejects.toThrow()
    })

    it('should rollback language creation if translations fail', async () => {
      // Arrange
      const formData = {
        iso_639_3_code: 'eng',
        endonym: 'English',
        name_en: 'English',
        name_nl: 'Engels',
        name_fr: 'Anglais',
        language_family_id: '',
        country_of_origin_id: '',
        speaker_count: undefined,
        taxonomy_value_ids: [],
      }

      const mockCity = { id: 'city-1', slug: 'amsterdam' }
      const mockLanguage = { id: '550e8400-e29b-41d4-a716-446655440000', ...formData }

      // Mock city lookup and language insert
      let singleCallCount = 0
      mockSupabase.single.mockImplementation(() => {
        singleCallCount++
        if (singleCallCount === 1) {
          return Promise.resolve({ data: mockCity, error: null })
        } else {
          return Promise.resolve({ data: mockLanguage, error: null })
        }
      })

      // Mock translation insert failure (first insert succeeds for language, second fails for translations)
      let insertCallCount = 0
      mockSupabase.insert.mockImplementation(() => {
        insertCallCount++
        if (insertCallCount === 1) {
          // Language insert - needs to be chainable
          return mockSupabase
        } else {
          // Translation insert - fails
          return Promise.resolve({
            data: null,
            error: { message: 'Translation insert failed' },
          })
        }
      })

      // Mock eq() to be chainable for city fetch, but resolve for rollback delete
      let eqCallCount = 0
      mockSupabase.eq.mockImplementation(() => {
        eqCallCount++
        if (eqCallCount === 1) {
          // City fetch: from('cities').select().eq().single() - must be chainable
          return mockSupabase
        } else {
          // Rollback delete: from('languages').delete().eq() - resolves
          return Promise.resolve({ error: null })
        }
      })

      // Mock rollback delete - must be chainable
      mockSupabase.delete.mockReturnValue(mockSupabase)

      // Act & Assert
      await expect(createLanguage('amsterdam', formData)).rejects.toThrow(
        'Failed to create translations'
      )
      expect(mockSupabase.delete).toHaveBeenCalled() // Rollback happened
    })

    it('should sanitize inputs before database insertion', async () => {
      // Arrange
      const formData = {
        iso_639_3_code: 'eng', // Lowercase required by validation
        endonym: '  English  ', // Should be trimmed
        name_en: '<script>alert("xss")</script>English', // Should remove HTML
        name_nl: '',
        name_fr: '',
        language_family_id: '',
        country_of_origin_id: '',
        speaker_count: undefined,
        taxonomy_value_ids: [],
      }

      const mockCity = { id: 'city-1', slug: 'amsterdam' }

      // Mock both single() calls (city lookup and language insert)
      let singleCallCount = 0
      mockSupabase.single.mockImplementation(() => {
        singleCallCount++
        if (singleCallCount === 1) {
          return Promise.resolve({ data: mockCity, error: null })
        } else {
          return Promise.resolve({ data: { id: '550e8400-e29b-41d4-a716-446655440000' }, error: null })
        }
      })

      mockSupabase.insert.mockReturnValue(mockSupabase) // Make insert chainable

      // Act
      await createLanguage('amsterdam', formData)

      // Assert
      expect(mockSupabase.insert).toHaveBeenCalled()
      // Check that the insert was called with sanitized data
      const insertCall = (mockSupabase.insert as Mock).mock.calls[0][0]
      expect(insertCall.iso_639_3_code).toBe('eng')
      expect(insertCall.endonym).toBe('English') // trimmed
    })
  })

  describe('updateLanguage', () => {
    it('should update language successfully', async () => {
      // Arrange
      const formData = {
        iso_639_3_code: 'eng',
        endonym: 'English (Updated)',
        name_en: 'English',
        name_nl: 'Engels',
        name_fr: 'Anglais',
        language_family_id: '550e8400-e29b-41d4-a716-446655440001',
        country_of_origin_id: '550e8400-e29b-41d4-a716-446655440002',
        speaker_count: 1600000000,
        taxonomy_value_ids: ['550e8400-e29b-41d4-a716-446655440003'],
      }

      const mockExistingLanguage = { id: '550e8400-e29b-41d4-a716-446655440000', city_id: 'city-1' }
      const mockUpdatedLanguage = { id: '550e8400-e29b-41d4-a716-446655440000', ...formData }

      // Mock the single() calls (fetch existing and update result)
      let singleCallCount = 0
      mockSupabase.single.mockImplementation(() => {
        singleCallCount++
        if (singleCallCount === 1) {
          return Promise.resolve({ data: mockExistingLanguage, error: null })
        } else {
          return Promise.resolve({ data: mockUpdatedLanguage, error: null })
        }
      })

      // Make update chainable for the language update operation
      mockSupabase.update.mockReturnValue(mockSupabase)

      // Make delete chainable for deleting old translations/taxonomies
      mockSupabase.delete.mockReturnValue(mockSupabase)

      // Mock eq() to be chainable for initial fetch and update, but resolve for deletes
      let eqCallCount = 0
      mockSupabase.eq.mockImplementation(() => {
        eqCallCount++
        if (eqCallCount === 1 || eqCallCount === 2) {
          // First: from('languages').select().eq().single() - fetch existing
          // Second: from('languages').update().eq().select().single() - update language
          return mockSupabase
        } else {
          // Third and beyond: delete operations for translations and taxonomies
          return Promise.resolve({ error: null })
        }
      })

      mockSupabase.insert.mockResolvedValue({ data: null, error: null }) // Insert new translations/taxonomies

      // Act
      const result = await updateLanguage('amsterdam', '550e8400-e29b-41d4-a716-446655440000', formData)

      // Assert
      expect(result).toEqual(mockUpdatedLanguage)
      expect(mockSupabase.update).toHaveBeenCalled()
      expect(mockSupabase.delete).toHaveBeenCalledTimes(2) // translations + taxonomies
      expect(mockSupabase.insert).toHaveBeenCalledTimes(2) // translations + taxonomies
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('should throw error when language does not exist', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({ data: null, error: null })

      const formData = {
        iso_639_3_code: 'eng',
        endonym: 'English',
        name_en: 'English',
        name_nl: '',
        name_fr: '',
        language_family_id: '',
        country_of_origin_id: '',
        speaker_count: undefined,
        taxonomy_value_ids: [],
      }

      // Act & Assert
      await expect(
        updateLanguage('amsterdam', '550e8400-e29b-41d4-a716-446655440000', formData)
      ).rejects.toThrow('Language not found')
    })
  })

  describe('deleteLanguage', () => {
    it('should delete language successfully', async () => {
      // Arrange
      const mockLanguage = { id: '550e8400-e29b-41d4-a716-446655440000', city_id: 'city-1' }

      mockSupabase.single.mockResolvedValue({ data: mockLanguage, error: null })

      // Make delete chainable and resolve at the end
      mockSupabase.delete.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockResolvedValue({ error: null })

      // Act
      await deleteLanguage('amsterdam', '550e8400-e29b-41d4-a716-446655440000')

      // Assert
      expect(mockSupabase.delete).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/[locale]/operator/amsterdam/languages')
    })

    it('should succeed when language does not exist (idempotent)', async () => {
      // Arrange
      // Mock successful delete operation even if language doesn't exist
      mockSupabase.delete.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockResolvedValue({ error: null })

      // Act
      // Should not throw - deleteLanguage is idempotent
      await deleteLanguage('amsterdam', '550e8400-e29b-41d4-a716-446655440000')

      // Assert
      expect(mockSupabase.delete).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/[locale]/operator/amsterdam/languages')
    })

    it('should throw error when delete operation fails', async () => {
      // Arrange
      const mockLanguage = { id: '550e8400-e29b-41d4-a716-446655440000', city_id: 'city-1' }

      mockSupabase.single.mockResolvedValue({ data: mockLanguage, error: null })

      // Make delete chainable and fail at the end
      mockSupabase.delete.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockResolvedValue({ error: { message: 'Foreign key constraint violation' } })

      // Act & Assert
      await expect(deleteLanguage('amsterdam', '550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow('Failed to delete language')
    })
  })

  describe('getLanguageFamiliesForSelect', () => {
    it('should fetch language families successfully', async () => {
      // Arrange
      const mockFamilies = [
        {
          id: 'fam-1',
          slug: 'indo-european',
          translations: [{ name: 'Indo-European' }],
        },
        {
          id: 'fam-2',
          slug: 'sino-tibetan',
          translations: [{ name: 'Sino-Tibetan' }],
        },
      ]

      // Mock order to return the data directly (no .single() call)
      mockSupabase.order.mockResolvedValue({ data: mockFamilies, error: null })

      // Act
      const result = await getLanguageFamiliesForSelect('amsterdam', 'en')

      // Assert
      expect(result).toEqual(mockFamilies)
      expect(mockSupabase.from).toHaveBeenCalledWith('language_families')
    })

    it('should return empty array when no families found', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({ data: null, error: null })

      // Act
      const result = await getLanguageFamiliesForSelect('amsterdam', 'en')

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('getCountriesForSelect', () => {
    it('should fetch countries successfully', async () => {
      // Arrange
      const mockCountries = [
        {
          id: 'country-1',
          iso_code: 'GB',
          translations: [{ name: 'United Kingdom' }],
        },
        {
          id: 'country-2',
          iso_code: 'FR',
          translations: [{ name: 'France' }],
        },
      ]

      mockSupabase.order.mockResolvedValue({ data: mockCountries, error: null })

      // Act
      const result = await getCountriesForSelect('amsterdam', 'en')

      // Assert
      expect(result).toEqual(mockCountries)
      expect(mockSupabase.from).toHaveBeenCalledWith('countries')
    })

    it('should return empty array when no countries found', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({ data: null, error: null })

      // Act
      const result = await getCountriesForSelect('amsterdam', 'en')

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('getTaxonomyValuesForSelect', () => {
    it('should fetch taxonomy types and values successfully', async () => {
      // Arrange
      const mockCity = { id: 'city-1' }
      const mockTaxonomies = [
        {
          id: 'type-1',
          slug: 'community-size',
          is_required: true,
          allow_multiple: false,
          translations: [{ name: 'Community Size' }],
          values: [
            {
              id: 'val-1',
              slug: 'small',
              color_hex: '#FFA500',
              icon_name: null,
              translations: [{ name: 'Small' }],
            },
          ],
        },
      ]

      // Mock city lookup, then taxonomy query
      mockSupabase.single.mockResolvedValueOnce({ data: mockCity, error: null })
      mockSupabase.order.mockResolvedValue({ data: mockTaxonomies, error: null })

      // Act
      const result = await getTaxonomyValuesForSelect('amsterdam', 'en')

      // Assert
      expect(result).toEqual(mockTaxonomies)
      expect(mockSupabase.from).toHaveBeenCalledWith('cities')
      expect(mockSupabase.from).toHaveBeenCalledWith('taxonomy_types')
    })

    it('should return empty array when no taxonomies found', async () => {
      // Arrange
      const mockCity = { id: 'city-1' }

      mockSupabase.single.mockResolvedValueOnce({ data: mockCity, error: null })
      mockSupabase.order.mockResolvedValue({ data: null, error: null })

      // Act
      const result = await getTaxonomyValuesForSelect('amsterdam', 'en')

      // Assert
      expect(result).toEqual([])
    })
  })
})
