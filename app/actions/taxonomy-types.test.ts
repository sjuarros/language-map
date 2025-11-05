/**
 * @fileoverview Unit tests for taxonomy type server actions
 * @description Tests all CRUD operations for taxonomy type management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getTaxonomyTypes,
  getTaxonomyType,
  createTaxonomyType,
  updateTaxonomyType,
  deleteTaxonomyType,
} from './taxonomy-types'

// Mock Supabase client with proper chaining
const createMockSupabase = () => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  }

  interface MockClient {
    auth: {
      getUser: ReturnType<typeof vi.fn>
    }
    from: ReturnType<typeof vi.fn>
  }

  const client = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => {
      // Reset and return chain
      Object.keys(chain).forEach((key) => {
        if (vi.isMockFunction(chain[key as keyof typeof chain])) {
          chain[key as keyof typeof chain].mockClear()
        }
      })
      return { ...chain }
    }),
  } as MockClient

  return client
}

let mockSupabase: ReturnType<typeof createMockSupabase>

// Mock the module dependencies
vi.mock('@/lib/supabase/server-client', () => ({
  getServerSupabaseWithCookies: vi.fn(() => mockSupabase),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

describe('taxonomy-types', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
  })

  describe('getTaxonomyTypes', () => {
    it('should fetch taxonomy types successfully for a valid city', async () => {
      const mockTaxonomyTypes = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          city_id: '123e4567-e89b-12d3-a456-426614174001',
          slug: 'size',
          is_required: true,
          allow_multiple: false,
          use_for_map_styling: true,
          use_for_filtering: true,
          display_order: 0,
          translations: [
            {
              id: '123e4567-e89b-12d3-a456-426614174002',
              locale_code: 'en',
              name: 'Community Size',
              description: 'Size of the language community',
            },
          ],
        },
      ]

      // Mock the city query
      const cityQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'city-id' }, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(cityQuery)

      // Mock the taxonomy types query
      const taxonomyTypesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockTaxonomyTypes, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(taxonomyTypesQuery)

      const result = await getTaxonomyTypes('amsterdam')

      expect(mockSupabase.from).toHaveBeenCalledWith('cities')
      expect(result).toEqual(mockTaxonomyTypes)
    })

    it('should throw error for invalid city slug format', async () => {
      await expect(getTaxonomyTypes('Invalid@City')).rejects.toThrow('Invalid city slug format')
    })

    it('should throw error when city is not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      })

      await expect(getTaxonomyTypes('nonexistent')).rejects.toThrow('Failed to fetch city')
    })

    it('should throw error when database query fails', async () => {
      // Mock the city query
      const cityQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'city-id' }, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(cityQuery)

      // Mock the taxonomy types query with error
      const taxonomyTypesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
      }
      mockSupabase.from.mockReturnValueOnce(taxonomyTypesQuery)

      await expect(getTaxonomyTypes('amsterdam')).rejects.toThrow('Failed to fetch taxonomy types')
    })

    it('should throw error for missing city slug', async () => {
      await expect(getTaxonomyTypes('')).rejects.toThrow('City slug is required')
    })
  })

  describe('getTaxonomyType', () => {
    it('should fetch a single taxonomy type successfully', async () => {
      const mockTaxonomyType = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        city_id: '123e4567-e89b-12d3-a456-426614174001',
        slug: 'size',
        is_required: true,
        allow_multiple: false,
        use_for_map_styling: true,
        use_for_filtering: true,
        display_order: 0,
        translations: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            locale_code: 'en',
            name: 'Community Size',
            description: 'Size of the language community',
          },
        ],
      }

      // Mock the city query
      const cityQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'city-id' }, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(cityQuery)

      // Mock the taxonomy type query
      const taxonomyTypeQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTaxonomyType, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(taxonomyTypeQuery)

      const result = await getTaxonomyType('amsterdam', '123e4567-e89b-12d3-a456-426614174000')

      expect(mockSupabase.from).toHaveBeenCalledWith('cities')
      expect(result).toEqual(mockTaxonomyType)
    })

    it('should throw error for invalid UUID format', async () => {
      await expect(getTaxonomyType('amsterdam', 'invalid-uuid')).rejects.toThrow(
        'Invalid taxonomy type ID format'
      )
    })

    it('should throw error when taxonomy type is not found', async () => {
      // Mock the city query
      const cityQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'city-id' }, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(cityQuery)

      // Mock the taxonomy type query with no result
      const taxonomyTypeQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(taxonomyTypeQuery)

      await expect(
        getTaxonomyType('amsterdam', '123e4567-e89b-12d3-a456-426614174000')
      ).rejects.toThrow('Taxonomy type not found')
    })
  })

  describe('createTaxonomyType', () => {
    const validInput = {
      cityId: '123e4567-e89b-12d3-a456-426614174000',
      slug: 'size',
      isRequired: true,
      allowMultiple: false,
      useForMapStyling: true,
      useForFiltering: true,
      displayOrder: 0,
      name_en: 'Community Size',
      description_en: 'Size of the language community',
      name_nl: 'Gemeenschapsgrootte',
      description_nl: 'Grootte van de taalgemeenschap',
    }

    it('should create a taxonomy type successfully', async () => {
      // Mock auth user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      // Mock city access check
      const cityAccessQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { city_id: 'city-id' }, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(cityAccessQuery)

      // Mock taxonomy type creation
      const taxonomyTypeInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'new-taxonomy-type-id' },
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(taxonomyTypeInsertQuery)

      // Mock translation creation
      const translationInsertQuery = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(translationInsertQuery)

      await createTaxonomyType('amsterdam', validInput)

      expect(mockSupabase.from).toHaveBeenCalledWith('taxonomy_types')
      expect(mockSupabase.from).toHaveBeenCalledWith('taxonomy_type_translations')
    })

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(createTaxonomyType('amsterdam', validInput)).rejects.toThrow('Unauthorized')
    })

    it('should throw error when user does not have city access', async () => {
      // Mock auth user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      // Mock city access check - no access
      const cityAccessQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(cityAccessQuery)

      await expect(createTaxonomyType('amsterdam', validInput)).rejects.toThrow(
        'Insufficient permissions'
      )
    })

    it('should rollback on translation creation failure', async () => {
      // Mock auth user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      // Mock city access check
      const cityAccessQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { city_id: 'city-id' }, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(cityAccessQuery)

      // Mock taxonomy type creation
      const taxonomyTypeInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'new-taxonomy-type-id' },
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(taxonomyTypeInsertQuery)

      // Mock translation creation failure
      const translationInsertQuery = {
        insert: vi.fn().mockResolvedValue({ error: { message: 'Insert failed' } }),
      }
      mockSupabase.from.mockReturnValueOnce(translationInsertQuery)

      // Mock delete on rollback
      const deleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(deleteQuery)

      await expect(createTaxonomyType('amsterdam', validInput)).rejects.toThrow(
        'Failed to create translations'
      )
    })

    it('should validate input with zod schema', async () => {
      // Mock auth user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      // Mock city access check
      const cityAccessQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { city_id: 'city-id' }, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(cityAccessQuery)

      const invalidInput = {
        ...validInput,
        slug: 'Invalid Slug!', // Invalid slug format
      }

      await expect(createTaxonomyType('amsterdam', invalidInput)).rejects.toThrow()
    })
  })

  describe('updateTaxonomyType', () => {
    const validInput = {
      cityId: '123e4567-e89b-12d3-a456-426614174000',
      slug: 'size',
      isRequired: true,
      allowMultiple: false,
      useForMapStyling: true,
      useForFiltering: true,
      displayOrder: 0,
      name_en: 'Community Size Updated',
      description_en: 'Updated description',
      name_nl: 'Gemeenschapsgrootte',
      description_nl: 'Grootte van de taalgemeenschap',
    }

    it('should update a taxonomy type successfully', async () => {
      // Mock auth user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      // Mock city access check
      const cityAccessQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { city_id: 'city-id' }, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(cityAccessQuery)

      // Mock taxonomy type update
      const taxonomyTypeUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(taxonomyTypeUpdateQuery)

      // Mock translation deletion
      const translationDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(translationDeleteQuery)

      // Mock translation insertion
      const translationInsertQuery = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(translationInsertQuery)

      await updateTaxonomyType('amsterdam', '123e4567-e89b-12d3-a456-426614174000', validInput)

      expect(mockSupabase.from).toHaveBeenCalledWith('taxonomy_types')
      expect(mockSupabase.from).toHaveBeenCalledWith('taxonomy_type_translations')
    })

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(
        updateTaxonomyType('amsterdam', '123e4567-e89b-12d3-a456-426614174000', validInput)
      ).rejects.toThrow('Unauthorized')
    })

    it('should throw error when translation update fails', async () => {
      // Mock auth user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      // Mock city access check
      const cityAccessQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { city_id: 'city-id' }, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(cityAccessQuery)

      // Mock taxonomy type update
      const taxonomyTypeUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(taxonomyTypeUpdateQuery)

      // Mock translation deletion
      const translationDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(translationDeleteQuery)

      // Mock translation insertion failure
      const translationInsertQuery = {
        insert: vi.fn().mockResolvedValue({ error: { message: 'Insert failed' } }),
      }
      mockSupabase.from.mockReturnValueOnce(translationInsertQuery)

      await expect(
        updateTaxonomyType('amsterdam', '123e4567-e89b-12d3-a456-426614174000', validInput)
      ).rejects.toThrow('Failed to update translations')
    })
  })

  describe('deleteTaxonomyType', () => {
    it('should delete a taxonomy type successfully', async () => {
      // Mock auth user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      // Mock taxonomy type deletion
      const deleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(deleteQuery)

      await deleteTaxonomyType('amsterdam', '123e4567-e89b-12d3-a456-426614174000')

      expect(mockSupabase.from).toHaveBeenCalledWith('taxonomy_types')
    })

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(
        deleteTaxonomyType('amsterdam', '123e4567-e89b-12d3-a456-426614174000')
      ).rejects.toThrow('Unauthorized')
    })

    it('should throw error when deletion fails', async () => {
      // Mock auth user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      // Mock taxonomy type deletion failure
      const deleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      }
      mockSupabase.from.mockReturnValueOnce(deleteQuery)

      await expect(
        deleteTaxonomyType('amsterdam', '123e4567-e89b-12d3-a456-426614174000')
      ).rejects.toThrow('Failed to delete taxonomy type')
    })
  })
})
