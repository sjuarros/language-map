/**
 * @fileoverview Unit tests for neighborhood server actions
 * @description Tests all CRUD operations for neighborhood management with district linkage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getNeighborhoods,
  getNeighborhood,
  getDistrictsForNeighborhood,
  createNeighborhood,
  updateNeighborhood,
  deleteNeighborhood,
} from './neighborhoods'

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
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabase),
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

describe('neighborhoods', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
  })

  describe('getNeighborhoods', () => {
    it('should fetch neighborhoods successfully for a valid city', async () => {
      const mockNeighborhoods = [
        {
          id: 'neighborhood-1',
          city_id: 'city-1',
          district_id: 'district-1',
          slug: 'jordaan',
          is_active: true,
          translations: [
            { id: 't1', locale: 'en', name: 'Jordaan', description: 'Historic neighborhood' },
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

      // Mock the neighborhoods query
      const neighborhoodsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockNeighborhoods, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(neighborhoodsQuery)

      const result = await getNeighborhoods('amsterdam')

      expect(mockSupabase.from).toHaveBeenCalledWith('cities')
      expect(result).toEqual(mockNeighborhoods)
    })

    it('should throw error for invalid city slug format', async () => {
      await expect(getNeighborhoods('Invalid@City')).rejects.toThrow('Invalid city slug format')
    })

    it('should throw error when city is not found', async () => {
      const cityQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      }
      mockSupabase.from.mockReturnValueOnce(cityQuery)

      await expect(getNeighborhoods('nonexistent')).rejects.toThrow('Failed to fetch city')
    })

    it('should throw error when database query fails', async () => {
      const cityQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'city-id' }, error: null }),
      }
      const neighborhoodsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }
      mockSupabase.from.mockReturnValueOnce(cityQuery)
      mockSupabase.from.mockReturnValueOnce(neighborhoodsQuery)

      await expect(getNeighborhoods('amsterdam')).rejects.toThrow('Failed to fetch neighborhoods')
    })
  })

  describe('getNeighborhood', () => {
    it('should fetch a single neighborhood successfully', async () => {
      const mockNeighborhood = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'jordaan',
        is_active: true,
        district_id: 'district-1',
        translations: [
          { id: 't1', locale: 'en', name: 'Jordaan', description: 'Historic neighborhood' },
        ],
      }

      // Mock the city query
      const cityQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'city-id' }, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(cityQuery)

      // Mock the neighborhood query
      const neighborhoodQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockNeighborhood,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(neighborhoodQuery)

      const result = await getNeighborhood('amsterdam', '123e4567-e89b-12d3-a456-426614174000')

      expect(result).toEqual(mockNeighborhood)
    })

    it('should throw error for invalid neighborhood ID format', async () => {
      await expect(getNeighborhood('amsterdam', 'invalid-id')).rejects.toThrow('Invalid neighborhood ID format')
    })

    it('should throw error when neighborhood is not found', async () => {
      const cityQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'city-id' }, error: null }),
      }
      const neighborhoodQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      }
      mockSupabase.from.mockReturnValueOnce(cityQuery)
      mockSupabase.from.mockReturnValueOnce(neighborhoodQuery)

      await expect(getNeighborhood('amsterdam', '123e4567-e89b-12d3-a456-426614174999')).rejects.toThrow('Failed to fetch neighborhood')
    })
  })

  describe('getDistrictsForNeighborhood', () => {
    it('should fetch districts successfully for dropdown', async () => {
      const mockDistricts = [
        {
          id: 'district-1',
          slug: 'centrum',
          translations: [
            { locale: 'en', name: 'Center' },
            { locale: 'nl', name: 'Centrum' },
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

      // Mock the districts query
      const districtsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockDistricts,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(districtsQuery)

      const result = await getDistrictsForNeighborhood('amsterdam')

      expect(result).toEqual(mockDistricts)
      expect(mockSupabase.from).toHaveBeenCalledWith('districts')
    })

    it('should throw error when city is not found', async () => {
      const cityQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      }
      mockSupabase.from.mockReturnValueOnce(cityQuery)

      await expect(getDistrictsForNeighborhood('nonexistent')).rejects.toThrow('City')
    })
  })

  describe('createNeighborhood', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      })
    })

    it('should create a neighborhood successfully with all translations', async () => {
      const neighborhoodInput = {
        cityId: '123e4567-e89b-12d3-a456-426614174001',
        districtId: '123e4567-e89b-12d3-a456-426614174002',
        slug: 'new-neighborhood',
        isActive: true,
        name_en: 'New Neighborhood',
        description_en: 'A new neighborhood',
        name_nl: 'Nieuwe Buurt',
        description_nl: 'Een nieuwe buurt',
      }

      const mockCreatedNeighborhood = {
        id: '123e4567-e89b-12d3-a456-426614174010',
        city_id: '123e4567-e89b-12d3-a456-426614174001',
        district_id: '123e4567-e89b-12d3-a456-426614174002',
        slug: 'new-neighborhood',
        is_active: true,
      }

      let callCount = 0
      mockSupabase.from.mockImplementation((table) => {
        callCount++
        const query = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
        }

        // 1st call: city access
        if (callCount === 1 && table === 'city_users') {
          query.single = vi.fn().mockResolvedValue({ data: { city_id: '123e4567-e89b-12d3-a456-426614174001' }, error: null })
          return query
        }

        // 2nd call: district validation
        if (callCount === 2 && table === 'districts') {
          query.single = vi.fn().mockResolvedValue({ data: { id: '123e4567-e89b-12d3-a456-426614174002' }, error: null })
          return query
        }

        // 3rd call: neighborhood creation (insert)
        if (callCount === 3 && table === 'neighborhoods') {
          query.insert = vi.fn().mockReturnThis()
          query.select = vi.fn().mockReturnThis()
          query.single = vi.fn().mockResolvedValue({ data: mockCreatedNeighborhood, error: null })
          return query
        }

        // 4th call: translation insert (EN)
        if (callCount === 4 && table === 'neighborhood_translations') {
          query.insert = vi.fn().mockResolvedValue({ error: null })
          return query
        }

        // 5th call: translation insert (NL)
        if (callCount === 5 && table === 'neighborhood_translations') {
          query.insert = vi.fn().mockResolvedValue({ error: null })
          return query
        }

        // 6th call: rollback delete
        if (callCount === 6 && table === 'neighborhoods') {
          query.delete = vi.fn().mockReturnThis()
          query.eq = vi.fn().mockResolvedValue({ error: null })
          return query
        }

        return query
      })

      await createNeighborhood('amsterdam', neighborhoodInput)
    })

    it('should create a neighborhood with only English translation', async () => {
      const neighborhoodInput = {
        cityId: '123e4567-e89b-12d3-a456-426614174001',
        districtId: '123e4567-e89b-12d3-a456-426614174002',
        slug: 'english-only',
        isActive: true,
        name_en: 'English Neighborhood',
        description_en: 'English only',
      }

      const mockCreatedNeighborhood = {
        id: '123e4567-e89b-12d3-a456-426614174011',
        city_id: '123e4567-e89b-12d3-a456-426614174001',
        district_id: '123e4567-e89b-12d3-a456-426614174002',
        slug: 'english-only',
        is_active: true,
      }

      const cityAccessQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { city_id: '123e4567-e89b-12d3-a456-426614174001' }, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(cityAccessQuery)

      const districtQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: '123e4567-e89b-12d3-a456-426614174002' }, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(districtQuery)

      const neighborhoodInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCreatedNeighborhood,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(neighborhoodInsertQuery)

      const translationInsertQuery = {
        insert: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValueOnce(translationInsertQuery)

      const result = await createNeighborhood('amsterdam', neighborhoodInput)

      expect(result).toEqual(mockCreatedNeighborhood)
    })

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

      await expect(
        createNeighborhood('amsterdam', {
          cityId: '123e4567-e89b-12d3-a456-426614174001',
          districtId: '123e4567-e89b-12d3-a456-426614174002',
          slug: 'test',
          isActive: true,
          name_en: 'Test',
        })
      ).rejects.toThrow('Unauthorized')
    })

    it('should throw error when user does not have city access', async () => {
      const cityAccessQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(cityAccessQuery)

      await expect(
        createNeighborhood('amsterdam', {
          cityId: '123e4567-e89b-12d3-a456-426614174001',
          districtId: '123e4567-e89b-12d3-a456-426614174002',
          slug: 'test',
          isActive: true,
          name_en: 'Test',
        })
      ).rejects.toThrow('Insufficient permissions')
    })

    it('should throw error when invalid district is selected', async () => {
      const cityAccessQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { city_id: '123e4567-e89b-12d3-a456-426614174001' }, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(cityAccessQuery)

      const districtQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(districtQuery)

      await expect(
        createNeighborhood('amsterdam', {
          cityId: '123e4567-e89b-12d3-a456-426614174001',
          districtId: '123e4567-e89b-12d3-a456-426614174999', // Valid UUID format but doesn't exist
          slug: 'test',
          isActive: true,
          name_en: 'Test',
        })
      ).rejects.toThrow('Invalid district selected')
    })

    it('should rollback neighborhood creation when translation creation fails', async () => {
      const neighborhoodInput = {
        cityId: '123e4567-e89b-12d3-a456-426614174001',
        districtId: '123e4567-e89b-12d3-a456-426614174002',
        slug: 'test',
        isActive: true,
        name_en: 'Test',
      }

      const mockCreatedNeighborhood = { id: '123e4567-e89b-12d3-a456-426614174010', city_id: '123e4567-e89b-12d3-a456-426614174001', district_id: '123e4567-e89b-12d3-a456-426614174002', slug: 'test', is_active: true }

      let callCount = 0
      mockSupabase.from.mockImplementation((table) => {
        callCount++
        const query = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
        }

        // 1st call: city access
        if (callCount === 1 && table === 'city_users') {
          query.single = vi.fn().mockResolvedValue({ data: { city_id: '123e4567-e89b-12d3-a456-426614174001' }, error: null })
          return query
        }

        // 2nd call: district validation
        if (callCount === 2 && table === 'districts') {
          query.single = vi.fn().mockResolvedValue({ data: { id: '123e4567-e89b-12d3-a456-426614174002' }, error: null })
          return query
        }

        // 3rd call: neighborhood creation (insert)
        if (callCount === 3 && table === 'neighborhoods') {
          query.insert = vi.fn().mockReturnThis()
          query.select = vi.fn().mockReturnThis()
          query.single = vi.fn().mockResolvedValue({ data: mockCreatedNeighborhood, error: null })
          return query
        }

        // 4th call: translation insert (should fail)
        if (callCount === 4 && table === 'neighborhood_translations') {
          query.insert = vi.fn().mockResolvedValue({ error: { message: 'Translation error' } })
          return query
        }

        // 5th call: rollback delete
        if (callCount === 5 && table === 'neighborhoods') {
          query.delete = vi.fn().mockReturnThis()
          query.eq = vi.fn().mockResolvedValue({ error: null })
          return query
        }

        return query
      })

      await expect(createNeighborhood('amsterdam', neighborhoodInput)).rejects.toThrow('Failed to create translations')

      expect(mockSupabase.from).toHaveBeenCalledWith('neighborhood_translations')
    })
  })

  describe('updateNeighborhood', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      })
    })

    it('should update a neighborhood successfully', async () => {
      const neighborhoodInput = {
        cityId: '123e4567-e89b-12d3-a456-426614174001',
        districtId: '123e4567-e89b-12d3-a456-426614174003',
        slug: 'updated-neighborhood',
        isActive: false,
        name_en: 'Updated Neighborhood',
        description_en: 'Updated description',
      }

      const cityAccessQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { city_id: '123e4567-e89b-12d3-a456-426614174001' }, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(cityAccessQuery)

      const districtQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: '123e4567-e89b-12d3-a456-426614174003' }, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(districtQuery)

      const updateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(updateQuery)

      const deleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(deleteQuery)

      const insertQuery = {
        insert: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValueOnce(insertQuery)

      const result = await updateNeighborhood('amsterdam', '123e4567-e89b-12d3-a456-426614174010', neighborhoodInput)

      expect(result).toEqual({ success: true })
    })

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

      await expect(
        updateNeighborhood('amsterdam', '123e4567-e89b-12d3-a456-426614174010', {
          cityId: '123e4567-e89b-12d3-a456-426614174001',
          districtId: '123e4567-e89b-12d3-a456-426614174002',
          slug: 'test',
          isActive: true,
          name_en: 'Test',
        })
      ).rejects.toThrow('Unauthorized')
    })

    it('should throw error when translation update fails', async () => {
      const neighborhoodInput = {
        cityId: '123e4567-e89b-12d3-a456-426614174001',
        districtId: '123e4567-e89b-12d3-a456-426614174002',
        slug: 'test',
        isActive: true,
        name_en: 'Test',
      }

      let callCount = 0
      mockSupabase.from.mockImplementation((table) => {
        callCount++
        const query = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
        }

        // 1st call: city access
        if (callCount === 1 && table === 'city_users') {
          query.single = vi.fn().mockResolvedValue({ data: { city_id: '123e4567-e89b-12d3-a456-426614174001' }, error: null })
          return query
        }

        // 2nd call: district validation
        if (callCount === 2 && table === 'districts') {
          query.single = vi.fn().mockResolvedValue({ data: { id: '123e4567-e89b-12d3-a456-426614174002' }, error: null })
          return query
        }

        // 3rd call: update neighborhood
        if (callCount === 3 && table === 'neighborhoods') {
          query.update = vi.fn().mockReturnThis()
          query.eq = vi.fn().mockResolvedValue({ error: null })
          return query
        }

        // 4th call: delete existing translations
        if (callCount === 4 && table === 'neighborhood_translations') {
          query.delete = vi.fn().mockReturnThis()
          query.eq = vi.fn().mockResolvedValue({ error: null })
          return query
        }

        // 5th call: insert new translations (should fail)
        if (callCount === 5 && table === 'neighborhood_translations') {
          query.insert = vi.fn().mockResolvedValue({ error: { message: 'Translation update failed' } })
          return query
        }

        return query
      })

      await expect(updateNeighborhood('amsterdam', '123e4567-e89b-12d3-a456-426614174010', neighborhoodInput)).rejects.toThrow(
        'Failed to update translations'
      )
    })
  })

  describe('deleteNeighborhood', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      })
    })

    it('should delete a neighborhood successfully', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      const result = await deleteNeighborhood('amsterdam', 'neighborhood-1')

      expect(result).toEqual({ success: true })
      expect(mockSupabase.from).toHaveBeenCalledWith('neighborhoods')
    })

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

      await expect(deleteNeighborhood('amsterdam', 'neighborhood-1')).rejects.toThrow('Unauthorized')
    })

    it('should throw error when delete operation fails', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
        }),
      })

      await expect(deleteNeighborhood('amsterdam', 'neighborhood-1')).rejects.toThrow('Failed to delete neighborhood')
    })
  })
})
