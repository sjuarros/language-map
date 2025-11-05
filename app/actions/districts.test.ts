/**
 * @fileoverview Unit tests for district server actions
 * @description Tests all CRUD operations for district management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getDistricts,
  getDistrict,
  createDistrict,
  updateDistrict,
  deleteDistrict,
} from './districts'

// Mock types with improved type safety
type MockFunction<T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown> = ReturnType<typeof vi.fn<T>>

interface QueryChain extends Record<string, MockFunction> {
  select: MockFunction
  eq: MockFunction
  single: MockFunction
  order: MockFunction
  insert: MockFunction
  update: MockFunction
  delete: MockFunction
}

interface AuthQuery {
  getUser: MockFunction
}

// Query type for district queries (only select, eq, and single are used)
interface DistrictQuery {
  select: MockFunction
  eq: MockFunction
  single: MockFunction
}

// Query type for city_users queries (only select, eq, and single are used)
interface CityUsersQuery {
  select: MockFunction
  eq: MockFunction
  single: MockFunction
}

// Mock Supabase client with proper chaining and type safety
const createMockSupabase = () => {
  const chain: QueryChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  }

  const client: {
    auth: AuthQuery
    from: MockFunction
  } = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => {
      // Reset and return chain
      Object.keys(chain).forEach((key) => {
        if (vi.isMockFunction(chain[key])) {
          chain[key].mockClear()
        }
      })
      return { ...chain }
    }),
  }

  return client
}

let mockSupabase: ReturnType<typeof createMockSupabase>

// Mock the module dependencies
vi.mock('@/lib/database/client', () => ({
  getDatabaseClient: vi.fn(() => mockSupabase),
}))

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

describe('districts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
  })

  describe('getDistricts', () => {
    it('should fetch districts successfully for a valid city', async () => {
      const mockDistricts = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          city_id: '123e4567-e89b-12d3-a456-426614174001',
          slug: 'centrum',
          is_active: true,
          translations: [
            { id: '123e4567-e89b-12d3-a456-426614174002', locale: 'en', name: 'Center', description: 'City center' },
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
        order: vi.fn().mockResolvedValue({ data: mockDistricts, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(districtsQuery)

      const result = await getDistricts('amsterdam')

      expect(mockSupabase.from).toHaveBeenCalledWith('cities')
      expect(result).toEqual(mockDistricts)
    })

    it('should throw error for invalid city slug format', async () => {
      await expect(getDistricts('Invalid@City')).rejects.toThrow('Invalid city slug format')
    })

    it('should throw error when city is not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      })

      await expect(getDistricts('nonexistent')).rejects.toThrow('Failed to fetch city')
    })

    it('should throw error when database query fails', async () => {
      // Mock the city query
      const cityQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'city-id' }, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(cityQuery)

      // Mock the districts query to fail
      const districtsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }
      mockSupabase.from.mockReturnValueOnce(districtsQuery)

      await expect(getDistricts('amsterdam')).rejects.toThrow('Failed to fetch districts')
    })
  })

  describe('getDistrict', () => {
    it('should fetch a single district successfully', async () => {
      const mockDistrict = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'centrum',
        is_active: true,
        translations: [
          { id: '123e4567-e89b-12d3-a456-426614174002', locale: 'en', name: 'Center', description: 'City center' },
        ],
      }

      // Mock the city query
      const cityQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'city-id' }, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(cityQuery)

      // Mock the district query
      const districtQuery: DistrictQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockDistrict,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(districtQuery)

      const result = await getDistrict('amsterdam', '123e4567-e89b-12d3-a456-426614174000')

      expect(result).toEqual(mockDistrict)
    })

    it('should throw error for invalid district ID format', async () => {
      await expect(getDistrict('amsterdam', 'invalid-id')).rejects.toThrow('Invalid district ID format')
    })

    it('should throw error when district is not found', async () => {
      // Mock the city query
      const cityQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'city-id' }, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(cityQuery)

      // Mock the district query to return null
      const districtQuery: DistrictQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      }
      mockSupabase.from.mockReturnValueOnce(districtQuery)

      await expect(getDistrict('amsterdam', '123e4567-e89b-12d3-a456-426614174999')).rejects.toThrow('Failed to fetch district')
    })
  })

  describe('createDistrict', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: '123e4567-e89b-12d3-a456-426614174010' } },
      })
    })

    it('should create a district successfully with all translations', async () => {
      const districtInput = {
        cityId: '123e4567-e89b-12d3-a456-426614174001',
        slug: 'new-district',
        name_en: 'New District',
        description_en: 'A new district',
        name_nl: 'Nieuw District',
        description_nl: 'Een nieuw district',
      }

      const mockCreatedDistrict = {
        id: '123e4567-e89b-12d3-a456-426614174020',
        city_id: '123e4567-e89b-12d3-a456-426614174001',
        slug: 'new-district',
      }

      // Mock city_users query
      const cityUsersQuery: CityUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { city_id: '123e4567-e89b-12d3-a456-426614174001' }, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(cityUsersQuery)

      // Mock district insert
      const districtInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCreatedDistrict,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(districtInsertQuery)

      // Mock translation insert
      const translationInsertQuery = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(translationInsertQuery)

      const result = await createDistrict('amsterdam', districtInput)

      expect(result).toEqual(mockCreatedDistrict)
      expect(mockSupabase.from).toHaveBeenCalledWith('districts')
    })

    it('should create a district with only English translation', async () => {
      const districtInput = {
        cityId: '123e4567-e89b-12d3-a456-426614174001',
        slug: 'english-only',
        name_en: 'English District',
        description_en: 'English only',
      }

      const mockCreatedDistrict = {
        id: '123e4567-e89b-12d3-a456-426614174020',
        city_id: '123e4567-e89b-12d3-a456-426614174001',
        slug: 'english-only',
      }

      // Mock city_users query
      const cityUsersQuery: CityUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { city_id: '123e4567-e89b-12d3-a456-426614174001' }, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(cityUsersQuery)

      // Mock district insert
      const districtInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCreatedDistrict,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(districtInsertQuery)

      // Mock translation insert
      const translationInsertQuery = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(translationInsertQuery)

      const result = await createDistrict('amsterdam', districtInput)

      expect(result).toEqual(mockCreatedDistrict)
    })

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

      await expect(
        createDistrict('amsterdam', {
          cityId: '123e4567-e89b-12d3-a456-426614174001',
          slug: 'test',
          name_en: 'Test',
        })
      ).rejects.toThrow('Unauthorized')
    })

    it('should throw error when user does not have city access', async () => {
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

        // City access check - return no access
        if (callCount === 1 && table === 'city_users') {
          query.single = vi.fn().mockResolvedValue({ data: null, error: null })
          return query
        }

        return query
      })

      await expect(
        createDistrict('amsterdam', {
          cityId: '123e4567-e89b-12d3-a456-426614174001',
          slug: 'test',
          name_en: 'Test',
        })
      ).rejects.toThrow('Insufficient permissions')
    })

    it('should rollback district creation when translation creation fails', async () => {
      const districtInput = {
        cityId: '123e4567-e89b-12d3-a456-426614174001',
        slug: 'test',
        name_en: 'Test',
      }

      const mockCreatedDistrict = { id: '123e4567-e89b-12d3-a456-426614174020', city_id: '123e4567-e89b-12d3-a456-426614174001', slug: 'test' }

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
          query.select = vi.fn().mockReturnThis()
          query.eq = vi.fn().mockReturnThis()
          query.single = vi.fn().mockResolvedValue({ data: { city_id: '123e4567-e89b-12d3-a456-426614174001' }, error: null })
          return query
        }

        // 2nd call: district creation (insert)
        if (callCount === 2 && table === 'districts') {
          query.insert = vi.fn().mockReturnThis()
          query.select = vi.fn().mockReturnThis()
          query.single = vi.fn().mockResolvedValue({ data: mockCreatedDistrict, error: null })
          return query
        }

        // 3rd call: translation insert (should fail)
        if (callCount === 3 && table === 'district_translations') {
          query.insert = vi.fn().mockResolvedValue({ error: { message: 'Translation error' } })
          return query
        }

        // 4th call: rollback delete
        if (callCount === 4 && table === 'districts') {
          query.delete = vi.fn().mockReturnThis()
          query.eq = vi.fn().mockResolvedValue({ error: null })
          return query
        }

        return query
      })

      await expect(createDistrict('amsterdam', districtInput)).rejects.toThrow('Failed to create translations')

      expect(mockSupabase.from).toHaveBeenCalledWith('district_translations')
    })
  })

  describe('updateDistrict', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: '123e4567-e89b-12d3-a456-426614174010' } },
      })
    })

    it('should update a district successfully', async () => {
      const districtInput = {
        cityId: '123e4567-e89b-12d3-a456-426614174001',
        slug: 'updated-district',
        name_en: 'Updated District',
        description_en: 'Updated description',
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
          query.select = vi.fn().mockReturnThis()
          query.eq = vi.fn().mockReturnThis()
          query.single = vi.fn().mockResolvedValue({ data: { city_id: '123e4567-e89b-12d3-a456-426614174001' }, error: null })
          return query
        }

        // 2nd call: update district
        if (callCount === 2 && table === 'districts') {
          query.update = vi.fn().mockReturnThis()
          query.eq = vi.fn().mockResolvedValue({ error: null })
          return query
        }

        // 3rd call: delete existing translations
        if (callCount === 3 && table === 'district_translations') {
          query.delete = vi.fn().mockReturnThis()
          query.eq = vi.fn().mockResolvedValue({ error: null })
          return query
        }

        // 4th call: insert new translations
        if (callCount === 4 && table === 'district_translations') {
          query.insert = vi.fn().mockResolvedValue({ error: null })
          return query
        }

        return query
      })

      const result = await updateDistrict('amsterdam', '123e4567-e89b-12d3-a456-426614174000', districtInput)

      expect(result).toEqual({ success: true })
    })

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

      await expect(
        updateDistrict('amsterdam', '123e4567-e89b-12d3-a456-426614174000', {
          cityId: '123e4567-e89b-12d3-a456-426614174001',
          slug: 'test',
          name_en: 'Test',
        })
      ).rejects.toThrow('Unauthorized')
    })

    it('should throw error when translation update fails', async () => {
      const districtInput = {
        cityId: '123e4567-e89b-12d3-a456-426614174001',
        slug: 'test',
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
          query.select = vi.fn().mockReturnThis()
          query.eq = vi.fn().mockReturnThis()
          query.single = vi.fn().mockResolvedValue({ data: { city_id: '123e4567-e89b-12d3-a456-426614174001' }, error: null })
          return query
        }

        // 2nd call: update district
        if (callCount === 2 && table === 'districts') {
          query.update = vi.fn().mockReturnThis()
          query.eq = vi.fn().mockResolvedValue({ error: null })
          return query
        }

        // 3rd call: delete existing translations
        if (callCount === 3 && table === 'district_translations') {
          query.delete = vi.fn().mockReturnThis()
          query.eq = vi.fn().mockResolvedValue({ error: null })
          return query
        }

        // 4th call: insert new translations (should fail)
        if (callCount === 4 && table === 'district_translations') {
          query.insert = vi.fn().mockResolvedValue({ error: { message: 'Insert failed' } })
          return query
        }

        return query
      })

      await expect(updateDistrict('amsterdam', '123e4567-e89b-12d3-a456-426614174000', districtInput)).rejects.toThrow(
        'Failed to update translations'
      )
    })
  })

  describe('deleteDistrict', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: '123e4567-e89b-12d3-a456-426614174010' } },
      })
    })

    it('should delete a district successfully', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      const result = await deleteDistrict('amsterdam', '123e4567-e89b-12d3-a456-426614174000')

      expect(result).toEqual({ success: true })
      expect(mockSupabase.from).toHaveBeenCalledWith('districts')
    })

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

      await expect(deleteDistrict('amsterdam', '123e4567-e89b-12d3-a456-426614174000')).rejects.toThrow('Unauthorized')
    })

    it('should throw error when delete operation fails', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
        }),
      })

      await expect(deleteDistrict('amsterdam', '123e4567-e89b-12d3-a456-426614174000')).rejects.toThrow('Failed to delete district')
    })
  })
})
