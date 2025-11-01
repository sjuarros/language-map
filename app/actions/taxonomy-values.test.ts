/* eslint-disable @typescript-eslint/no-explicit-any -- Test mocks require 'any' type for flexibility */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the database client
vi.mock('@/lib/database/client', () => ({
  getDatabaseClient: vi.fn(() => createMockClient() as any)
}))

// Helper function to create a consistent mock client
function createMockClient() {
  return {
    from: vi.fn((table: string) => {
      if (table === 'cities') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'city-1', slug: 'amsterdam' },
                error: null
              })
            })
          })
        }
      }
      if (table === 'taxonomy_values') {
        return createTaxonomyValuesMock()
      }
      if (table === 'taxonomy_value_translations') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        }
      }
      if (table === 'city_users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { city_id: 'city-1' },
                  error: null
                })
              })
            })
          })
        }
      }
      if (table === 'taxonomy_types') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'type-1',
                  slug: 'size',
                  city_id: 'city-1',
                  translations: [
                    { locale_code: 'en', name: 'Community Size' },
                    { locale_code: 'nl', name: 'Gemeenschapsgrootte' }
                  ]
                },
                error: null
              })
            })
          })
        }
      }
      return {
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn() }) }),
        insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn() }) }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn() }) }) }),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
      }
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })
    }
  }
}


// Create a mock for taxonomy_values table operations
function createTaxonomyValuesMock() {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          data: [
            {
              id: 'value-1',
              taxonomy_type_id: 'type-1',
              slug: 'small',
              color_hex: '#FFA500',
              icon_name: 'Circle',
              icon_size_multiplier: 1.0,
              display_order: 0,
              translations: [
                { id: 't1', locale_code: 'en', name: 'Small', description: 'Small community', is_ai_translated: false, reviewed_at: null },
                { id: 't2', locale_code: 'nl', name: 'Klein', description: 'Kleine gemeenschap', is_ai_translated: false, reviewed_at: null }
              ]
            }
          ],
          error: null
        }),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'value-1',
            taxonomy_type_id: 'type-1',
            slug: 'small',
            color_hex: '#FFA500',
            icon_name: 'Circle',
            icon_size_multiplier: 1.0,
            display_order: 0,
            translations: [
              { id: 't1', locale_code: 'en', name: 'Small', description: 'Small community', is_ai_translated: false, reviewed_at: null }
            ],
            taxonomy_type: {
              id: 'type-1',
              slug: 'size',
              city_id: 'city-1',
              translations: [
                { locale_code: 'en', name: 'Community Size' }
              ]
            }
          },
          error: null
        })
      })
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'value-1', slug: 'small', taxonomy_type_id: 'type-1' },
          error: null
        })
      })
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'value-1', slug: 'medium', taxonomy_type_id: 'type-1' },
            error: null
          })
        })
      })
    }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null })
    })
  }
}

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

// Mock requireAuth
vi.mock('@/lib/auth/requireAuth', () => ({
  requireAuth: vi.fn(async () => ({ id: 'user-1', role: 'operator' }))
}))

import {
  getTaxonomyValues,
  getTaxonomyValue,
  createTaxonomyValue,
  updateTaxonomyValue,
  deleteTaxonomyValue,
  getTaxonomyTypeForValues
} from './taxonomy-values'

describe('taxonomy-values', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTaxonomyValues', () => {
    it('should fetch taxonomy values for a taxonomy type', async () => {
      const values = await getTaxonomyValues('amsterdam', 'type-1')

      expect(values).toHaveLength(1)
      expect(values[0].slug).toBe('small')
    })

    it('should handle database errors', async () => {
      const { getDatabaseClient } = await import('@/lib/database/client')
      const mockClient = createMockClient() as any
      // Override taxonomy_values to return error
      mockClient.from = vi.fn((table: string) => {
        if (table === 'cities') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'city-1', slug: 'amsterdam' },
                  error: null
                })
              })
            })
          }
        }
        if (table === 'taxonomy_values') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
              })
            })
          }
        }
        return {
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn() }) }),
          insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn() }) }),
          update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn() }) }) }),
          delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
        }
      })
      
      vi.mocked(getDatabaseClient).mockReturnValue(mockClient)

      await expect(getTaxonomyValues('amsterdam', 'type-1')).rejects.toThrow('Failed to fetch taxonomy values: Database error')
    })
  })

  describe('getTaxonomyValue', () => {
    it('should fetch a single taxonomy value', async () => {
      const { getDatabaseClient } = await import('@/lib/database/client')
      const mockClient = createMockClient() as any
      // Make taxonomy_values single() return the expected data
      mockClient.from = vi.fn((table: string) => {
        if (table === 'cities') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: { id: 'city-1', slug: 'amsterdam' },
                  error: null
                }))
              }))
            }))
          }
        }
        if (table === 'taxonomy_values') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: {
                    id: 'value-1',
                    slug: 'small',
                    color_hex: '#FFA500',
                    icon_name: 'Circle',
                    icon_size_multiplier: 1.0,
                    display_order: 0,
                    translations: [],
                    taxonomy_type: {
                      id: 'type-1',
                      slug: 'size',
                      city_id: 'city-1',
                      translations: []
                    }
                  },
                  error: null
                }))
              }))
            }))
          }
        }
        if (table === 'taxonomy_types') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: {
                    id: 'type-1',
                    slug: 'size',
                    city_id: 'city-1',
                    translations: []
                  },
                  error: null
                }))
              }))
            }))
          }
        }
        return {
          select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn() })) }))
        }
      })
      
      vi.mocked(getDatabaseClient).mockReturnValue(mockClient)

      const value = await getTaxonomyValue('amsterdam', 'value-1')

      expect(value.slug).toBe('small')
    })

    it('should throw error when value not found', async () => {
      const { getDatabaseClient } = await import('@/lib/database/client')
      const mockClient = createMockClient() as any
      mockClient.from = vi.fn((table: string) => {
        if (table === 'cities') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: { id: 'city-1', slug: 'amsterdam' },
                  error: null
                }))
              }))
            }))
          }
        }
        if (table === 'taxonomy_values') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: null,
                  error: { message: 'Not found' }
                }))
              }))
            }))
          }
        }
        return {
          select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn() })) }))
        }
      })
      
      vi.mocked(getDatabaseClient).mockReturnValue(mockClient)

      await expect(getTaxonomyValue('amsterdam', 'invalid-id')).rejects.toThrow('Failed to fetch taxonomy value: Not found')
    })
  })

  describe('createTaxonomyValue', () => {
    it('should create a taxonomy value with translations', async () => {
      const { getDatabaseClient } = await import('@/lib/database/client')
      const mockClient = createMockClient() as any
      
      vi.mocked(getDatabaseClient).mockReturnValue(mockClient)

      const input = {
        taxonomy_type_id: '550e8400-e29b-41d4-a716-446655440000',
        slug: 'small',
        color_hex: '#FFA500',
        icon_size_multiplier: 1.0,
        display_order: 0,
        translations: [
          { locale_code: 'en', name: 'Small' },
          { locale_code: 'nl', name: 'Klein' }
        ]
      }

      const result = await createTaxonomyValue('amsterdam', input)

      expect(result.id).toBe('value-1')
    })

    it('should rollback on translation failure', async () => {
      const { getDatabaseClient } = await import('@/lib/database/client')
      const mockClient = createMockClient() as any
      // Override the translation insert to fail
      mockClient.from = vi.fn((table: string) => {
        if (table === 'cities') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'city-1', slug: 'amsterdam' },
                  error: null
                })
              })
            })
          }
        }
        if (table === 'city_users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { city_id: 'city-1' },
                    error: null
                  })
                })
              })
            })
          }
        }
        if (table === 'taxonomy_value_translations') {
          return {
            insert: vi.fn().mockResolvedValue({ error: { message: 'Translation error' } })
          }
        }
        if (table === 'taxonomy_values') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'value-1', slug: 'small', taxonomy_type_id: '550e8400-e29b-41d4-a716-446655440000' },
                  error: null
                })
              })
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            })
          }
        }
        return {
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn() }) }),
          insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn() }) }),
          update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn() }) }) }),
          delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
        }
      })
      
      vi.mocked(getDatabaseClient).mockReturnValue(mockClient)

      const input = {
        taxonomy_type_id: '550e8400-e29b-41d4-a716-446655440000',
        slug: 'small',
        color_hex: '#FFA500',
        icon_size_multiplier: 1.0,
        display_order: 0,
        translations: [
          { locale_code: 'en', name: 'Small' }
        ]
      }

      await expect(createTaxonomyValue('amsterdam', input)).rejects.toThrow('Failed to create translations: Translation error')
    })

    it('should validate slug format', async () => {
      const input = {
        taxonomy_type_id: '550e8400-e29b-41d4-a716-446655440000',
        slug: 'Invalid Slug!', // Invalid: contains spaces and uppercase
        color_hex: '#FFA500',
        icon_size_multiplier: 1.0,
        display_order: 0,
        translations: []
      }

      await expect(createTaxonomyValue('amsterdam', input)).rejects.toThrow('Slug must contain only lowercase letters, numbers, and hyphens')
    })

    it('should validate color hex format', async () => {
      const input = {
        taxonomy_type_id: '550e8400-e29b-41d4-a716-446655440000',
        slug: 'small',
        color_hex: 'invalid', // Invalid hex color
        icon_size_multiplier: 1.0,
        display_order: 0,
        translations: []
      }

      await expect(createTaxonomyValue('amsterdam', input)).rejects.toThrow('Color must be a valid hex color')
    })

    it('should validate icon size multiplier range', async () => {
      const input = {
        taxonomy_type_id: '550e8400-e29b-41d4-a716-446655440000',
        slug: 'small',
        color_hex: '#FFA500',
        icon_size_multiplier: 5.0, // Too large
        display_order: 0,
        translations: []
      }

      await expect(createTaxonomyValue('amsterdam', input)).rejects.toThrow('Icon size multiplier must be at most 3.0')
    })
  })

  describe('updateTaxonomyValue', () => {
    it('should update a taxonomy value', async () => {
      const { getDatabaseClient } = await import('@/lib/database/client')
      const mockClient = createMockClient() as any
      vi.mocked(getDatabaseClient).mockReturnValue(mockClient)

      const result = await updateTaxonomyValue('amsterdam', 'value-1', {
        slug: 'medium',
        translations: [
          { locale_code: 'en', name: 'Medium' }
        ]
      })

      expect(result.slug).toBe('medium')
    })

    it('should handle partial updates', async () => {
      const { getDatabaseClient } = await import('@/lib/database/client')
      const mockClient = createMockClient() as any

      let updateCalledWith: Record<string, unknown> | null = null
      mockClient.from = vi.fn((table: string) => {
        if (table === 'cities') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'city-1', slug: 'amsterdam' },
                  error: null
                })
              })
            })
          }
        }
        if (table === 'city_users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { city_id: 'city-1' },
                    error: null
                  })
                })
              })
            })
          }
        }
        if (table === 'taxonomy_values') {
          return {
            select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn() }) }),
            update: vi.fn((data: Record<string, unknown>) => {
              updateCalledWith = data
              return {
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: 'value-1', slug: 'small', taxonomy_type_id: 'type-1', color_hex: '#FFD700' },
                      error: null
                    })
                  })
                })
              }
            }),
            insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn() }) }),
            delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
          }
        }
        if (table === 'taxonomy_value_translations') {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            }),
            insert: vi.fn().mockResolvedValue({ error: null })
          }
        }
        return {
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn() }) }),
          insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn() }) }),
          update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn() }) }) }),
          delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
        }
      })

      vi.mocked(getDatabaseClient).mockReturnValue(mockClient)

      await updateTaxonomyValue('amsterdam', 'value-1', {
        color_hex: '#FFD700'
      })

      // Should update only the color
      expect(updateCalledWith).toEqual({ color_hex: '#FFD700' })
    })
  })

  describe('deleteTaxonomyValue', () => {
    it('should delete a taxonomy value', async () => {
      const { getDatabaseClient } = await import('@/lib/database/client')
      const mockClient = createMockClient() as any
      
      vi.mocked(getDatabaseClient).mockReturnValue(mockClient)

      const result = await deleteTaxonomyValue('amsterdam', 'value-1')

      expect(result.success).toBe(true)
    })

    it('should handle database errors on delete', async () => {
      const { getDatabaseClient } = await import('@/lib/database/client')
      const mockClient = createMockClient() as any
      // Override delete to fail
      mockClient.from = vi.fn((table: string) => {
        if (table === 'cities') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'city-1', slug: 'amsterdam' },
                  error: null
                })
              })
            })
          }
        }
        if (table === 'city_users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { city_id: 'city-1' },
                    error: null
                  })
                })
              })
            })
          }
        }
        if (table === 'taxonomy_values') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { taxonomy_type_id: 'type-1' },
                  error: null
                })
              })
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: { message: 'Delete error' } })
            })
          }
        }
        if (table === 'taxonomy_value_translations') {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            })
          }
        }
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: { message: 'Delete error' } })
          })
        }
      })
      
      vi.mocked(getDatabaseClient).mockReturnValue(mockClient)

      await expect(deleteTaxonomyValue('amsterdam', 'value-1')).rejects.toThrow('Failed to delete taxonomy value: Delete error')
    })
  })

  describe('getTaxonomyTypeForValues', () => {
    it('should fetch taxonomy type with translations', async () => {
      const { getDatabaseClient } = await import('@/lib/database/client')
      const mockClient = createMockClient() as any
      
      vi.mocked(getDatabaseClient).mockReturnValue(mockClient)

      const type = await getTaxonomyTypeForValues('amsterdam', 'type-1')

      expect(type.slug).toBe('size')
      expect(type.translations).toHaveLength(2)
    })

    it('should throw error when type not found', async () => {
      const { getDatabaseClient } = await import('@/lib/database/client')
      const mockClient = createMockClient() as any
      // Override taxonomy_types to return not found
      mockClient.from = vi.fn((table: string) => {
        if (table === 'cities') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: { id: 'city-1', slug: 'amsterdam' },
                  error: null
                }))
              }))
            }))
          }
        }
        if (table === 'taxonomy_types') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: null,
                  error: { message: 'Not found' }
                }))
              }))
            }))
          }
        }
        return {
          select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn() })) }))
        }
      })
      
      vi.mocked(getDatabaseClient).mockReturnValue(mockClient)

      await expect(getTaxonomyTypeForValues('amsterdam', 'invalid-id')).rejects.toThrow('Failed to fetch taxonomy type: Not found')
    })
  })
})
