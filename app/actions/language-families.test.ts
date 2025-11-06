/**
 * @fileoverview Unit tests for language family server actions
 * @description Tests all CRUD operations for language family management
 *
 * Language families are global entities (not city-specific) used to classify languages.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getLanguageFamilies,
  getLanguageFamily,
  createLanguageFamily,
  updateLanguageFamily,
  deleteLanguageFamily,
  type LanguageFamilyInput,
} from './language-families'

// Mock types with improved type safety
type MockFunction<T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown> =
  ReturnType<typeof vi.fn<T>>

interface QueryChain extends Record<string, MockFunction> {
  select: MockFunction
  eq: MockFunction
  single: MockFunction
  order: MockFunction
  insert: MockFunction
  update: MockFunction
  delete: MockFunction
  upsert: MockFunction
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
    upsert: vi.fn().mockReturnThis(),
  }

  const client = {
    from: vi.fn(() => {
      // Reset and return chain
      Object.keys(chain).forEach((key) => {
        if (vi.isMockFunction(chain[key])) {
          chain[key].mockClear()
        }
      })
      return { ...chain }
    }),
    rpc: vi.fn(),
  }

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

describe('language-families', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
  })

  describe('getLanguageFamilies', () => {
    it('should fetch all language families successfully', async () => {
      const mockFamilies = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          slug: 'indo-european',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          translations: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              locale_code: 'en',
              name: 'Indo-European',
              description: 'The Indo-European language family',
              is_ai_translated: false,
              ai_model: null,
            },
          ],
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          slug: 'sino-tibetan',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
          translations: [
            {
              id: '223e4567-e89b-12d3-a456-426614174001',
              locale_code: 'en',
              name: 'Sino-Tibetan',
              description: 'The Sino-Tibetan language family',
              is_ai_translated: false,
              ai_model: null,
            },
          ],
        },
      ]

      // Mock the language families query
      const familiesQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockFamilies, error: null }),
      } as unknown as ReturnType<typeof mockSupabase.from>
      mockSupabase.from.mockReturnValueOnce(familiesQuery)

      const result = await getLanguageFamilies('amsterdam')

      expect(mockSupabase.from).toHaveBeenCalledWith('language_families')
      expect(result).toEqual(mockFamilies)
      expect(result).toHaveLength(2)
    })

    it('should throw error for invalid city slug format', async () => {
      await expect(getLanguageFamilies('Invalid@City')).rejects.toThrow(
        'Invalid city slug format'
      )
    })

    it('should throw error for empty city slug', async () => {
      await expect(getLanguageFamilies('')).rejects.toThrow('City slug is required')
    })

    it('should handle database errors', async () => {
      const familiesQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>
      mockSupabase.from.mockReturnValueOnce(familiesQuery)

      await expect(getLanguageFamilies('amsterdam')).rejects.toThrow(
        'Failed to fetch language families'
      )
    })
  })

  describe('getLanguageFamily', () => {
    it('should fetch a single language family by ID', async () => {
      const mockFamily = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'indo-european',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        translations: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            locale_code: 'en',
            name: 'Indo-European',
            description: 'The Indo-European language family',
            is_ai_translated: false,
            ai_model: null,
          },
        ],
      }

      const familyQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockFamily, error: null }),
      } as unknown as ReturnType<typeof mockSupabase.from>
      mockSupabase.from.mockReturnValueOnce(familyQuery)

      const result = await getLanguageFamily('amsterdam', '123e4567-e89b-12d3-a456-426614174000')

      expect(mockSupabase.from).toHaveBeenCalledWith('language_families')
      expect(result).toEqual(mockFamily)
    })

    it('should throw error for invalid ID format', async () => {
      await expect(getLanguageFamily('amsterdam', 'invalid-id')).rejects.toThrow(
        'Invalid language family ID format'
      )
    })

    it('should throw error when family not found', async () => {
      const familyQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      } as unknown as ReturnType<typeof mockSupabase.from>
      mockSupabase.from.mockReturnValueOnce(familyQuery)

      await expect(
        getLanguageFamily('amsterdam', '123e4567-e89b-12d3-a456-426614174000')
      ).rejects.toThrow('Failed to fetch language family')
    })
  })

  describe('createLanguageFamily', () => {
    it('should create a language family with all translations', async () => {
      const input: LanguageFamilyInput = {
        slug: 'indo-european',
        name_en: 'Indo-European',
        description_en: 'The Indo-European language family',
        name_nl: 'Indo-Europees',
        description_nl: 'De Indo-Europese taalfamilie',
        name_fr: 'Indo-européen',
        description_fr: 'La famille linguistique indo-européenne',
      }

      const mockRpcResult = [
        {
          family_id: '123e4567-e89b-12d3-a456-426614174000',
          family_slug: 'indo-european',
        },
      ]

      // Mock the RPC function call
      mockSupabase.rpc = vi.fn().mockResolvedValue({ data: mockRpcResult, error: null })

      const result = await createLanguageFamily('amsterdam', input)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_language_family_with_translations', {
        p_slug: 'indo-european',
        p_translations: expect.any(String),
      })
      expect(result).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'indo-european',
        created_at: expect.any(String),
        updated_at: expect.any(String),
      })
    })

    it('should create a language family with only English translation', async () => {
      const input: LanguageFamilyInput = {
        slug: 'afro-asiatic',
        name_en: 'Afro-Asiatic',
        description_en: 'The Afro-Asiatic language family',
      }

      const mockRpcResult = [
        {
          family_id: '223e4567-e89b-12d3-a456-426614174000',
          family_slug: 'afro-asiatic',
        },
      ]

      mockSupabase.rpc = vi.fn().mockResolvedValue({ data: mockRpcResult, error: null })

      const result = await createLanguageFamily('amsterdam', input)

      expect(result).toEqual({
        id: '223e4567-e89b-12d3-a456-426614174000',
        slug: 'afro-asiatic',
        created_at: expect.any(String),
        updated_at: expect.any(String),
      })
    })

    it.skip('should throw error for invalid slug format', async () => {
      // TODO: Fix this test - validation error handling needs investigation
      const input: LanguageFamilyInput = {
        slug: 'Invalid Slug!',
        name_en: 'Test Family',
      }

      await expect(createLanguageFamily('amsterdam', input)).rejects.toThrow('Validation error')
    })

    it('should throw error when slug already exists', async () => {
      const input: LanguageFamilyInput = {
        slug: 'indo-european',
        name_en: 'Indo-European',
      }

      mockSupabase.rpc = vi.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'Unique constraint violation' },
      })

      await expect(createLanguageFamily('amsterdam', input)).rejects.toThrow(
        "Language family with slug 'indo-european' already exists"
      )
    })

    it('should handle atomic transaction failures', async () => {
      const input: LanguageFamilyInput = {
        slug: 'test-family',
        name_en: 'Test Family',
      }

      mockSupabase.rpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Translation insert failed' },
      })

      await expect(createLanguageFamily('amsterdam', input)).rejects.toThrow(
        'Failed to create language family'
      )
    })
  })

  describe('updateLanguageFamily', () => {
    it('should update a language family and its translations', async () => {
      const input: LanguageFamilyInput = {
        slug: 'indo-european-updated',
        name_en: 'Indo-European (Updated)',
        description_en: 'Updated description',
        name_nl: 'Indo-Europees (Bijgewerkt)',
      }

      const mockRpcResult = [
        {
          family_id: '123e4567-e89b-12d3-a456-426614174000',
          family_slug: 'indo-european-updated',
        },
      ]

      mockSupabase.rpc = vi.fn().mockResolvedValue({ data: mockRpcResult, error: null })

      const result = await updateLanguageFamily(
        'amsterdam',
        '123e4567-e89b-12d3-a456-426614174000',
        input
      )

      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_language_family_with_translations', {
        p_family_id: '123e4567-e89b-12d3-a456-426614174000',
        p_slug: 'indo-european-updated',
        p_translations: expect.any(String),
      })
      expect(result).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'indo-european-updated',
        created_at: expect.any(String),
        updated_at: expect.any(String),
      })
    })

    it('should throw error for invalid ID format', async () => {
      const input: LanguageFamilyInput = {
        slug: 'test',
        name_en: 'Test',
      }

      await expect(updateLanguageFamily('amsterdam', 'invalid-id', input)).rejects.toThrow(
        'Invalid language family ID format'
      )
    })

    it('should throw error when family not found', async () => {
      const input: LanguageFamilyInput = {
        slug: 'test',
        name_en: 'Test',
      }

      mockSupabase.rpc = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      })

      await expect(
        updateLanguageFamily('amsterdam', '123e4567-e89b-12d3-a456-426614174000', input)
      ).rejects.toThrow('Language family not found')
    })
  })

  describe('deleteLanguageFamily', () => {
    it('should delete a language family successfully', async () => {
      const deleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as unknown as ReturnType<typeof mockSupabase.from>
      mockSupabase.from.mockReturnValueOnce(deleteQuery)

      await expect(
        deleteLanguageFamily('amsterdam', '123e4567-e89b-12d3-a456-426614174000')
      ).resolves.toBeUndefined()

      expect(mockSupabase.from).toHaveBeenCalledWith('language_families')
    })

    it('should throw error for invalid ID format', async () => {
      await expect(deleteLanguageFamily('amsterdam', 'invalid-id')).rejects.toThrow(
        'Invalid language family ID format'
      )
    })

    it('should throw error when family is referenced by languages', async () => {
      const deleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: { code: '23503', message: 'Foreign key constraint violation' },
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>
      mockSupabase.from.mockReturnValueOnce(deleteQuery)

      await expect(
        deleteLanguageFamily('amsterdam', '123e4567-e89b-12d3-a456-426614174000')
      ).rejects.toThrow('Cannot delete language family: it is referenced by one or more languages')
    })

    it('should handle database errors during deletion', async () => {
      const deleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: { message: 'Database error' },
        }),
      } as unknown as ReturnType<typeof mockSupabase.from>
      mockSupabase.from.mockReturnValueOnce(deleteQuery)

      await expect(
        deleteLanguageFamily('amsterdam', '123e4567-e89b-12d3-a456-426614174000')
      ).rejects.toThrow('Failed to delete language family')
    })
  })
})
