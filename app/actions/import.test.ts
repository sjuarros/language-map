/**
 * Integration Tests for Import Server Actions
 *
 * Tests bulk import functionality with mocked Supabase client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { importLanguagesFromCSV, getTaxonomyTypesForMapping } from './import';
import type { ParsedLanguageRow } from '@/lib/import/csv-parser';

// Mock the database client
vi.mock('@/lib/database/client', () => ({
  getDatabaseClient: vi.fn(() => mockSupabaseClient)
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}));

// Create a mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
  rpc: vi.fn()
};

describe('importLanguagesFromCSV', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path Tests', () => {
    it('should successfully import a single language', async () => {
      // Mock city lookup
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'city-123' },
              error: null
            })
          })
        })
      });

      // Mock existing language check (not found)
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
      });

      // Mock language insert
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'lang-123' },
              error: null
            })
          })
        })
      });

      // Mock translation insert
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          error: null
        })
      });

      // Mock taxonomy delete and insert
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        }),
        insert: vi.fn().mockResolvedValue({ error: null })
      });

      const rows: ParsedLanguageRow[] = [{
        rowNumber: 2,
        name: 'Spanish',
        endonym: 'Español',
        iso_639_3_code: 'spa',
        taxonomies: {},
        custom_fields: {}
      }];

      const result = await importLanguagesFromCSV(rows, {
        citySlug: 'amsterdam',
        locale: 'en'
      });

      expect(result.successful).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.total).toBe(1);
      expect(result.results[0].success).toBe(true);
      expect(result.results[0].languageId).toBe('lang-123');
    });

    it('should successfully import multiple languages', async () => {
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callCount++;

        if (table === 'cities') {
          // City lookup (called once)
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'city-123' },
                  error: null
                })
              })
            })
          };
        } else if (table === 'language_translations') {
          // Check for existing languages (called twice, once per language)
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    data: [],  // No existing languages
                    error: null
                  })
                })
              })
            }),
            insert: vi.fn().mockResolvedValue({ error: null })
          };
        } else if (table === 'languages') {
          // Insert new languages (called twice)
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: `lang-${callCount}` },
                  error: null
                })
              })
            })
          };
        } else if (table === 'language_taxonomies') {
          // Taxonomy operations
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            }),
            insert: vi.fn().mockResolvedValue({ error: null })
          };
        }
        return {};
      });

      const rows: ParsedLanguageRow[] = [
        {
          rowNumber: 2,
          name: 'Spanish',
          endonym: 'Español',
          iso_639_3_code: 'spa',
          taxonomies: {},
          custom_fields: {}
        },
        {
          rowNumber: 3,
          name: 'French',
          endonym: 'Français',
          iso_639_3_code: 'fra',
          taxonomies: {},
          custom_fields: {}
        }
      ];

      const result = await importLanguagesFromCSV(rows, {
        citySlug: 'amsterdam',
        locale: 'en'
      });

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.total).toBe(2);
    });

    it('should sanitize language names before import', async () => {
      // Mock city lookup
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'city-123' },
              error: null
            })
          })
        })
      });

      // Mock existing language check
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
      });

      // Mock inserts and deletes
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'lang-123' },
              error: null
            })
          })
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      });

      const rows: ParsedLanguageRow[] = [{
        rowNumber: 2,
        name: '  Spanish  ',  // Extra whitespace
        endonym: '  Español  ',
        iso_639_3_code: 'SPA',  // Wrong case
        taxonomies: {},
        custom_fields: {}
      }];

      const result = await importLanguagesFromCSV(rows, {
        citySlug: 'amsterdam',
        locale: 'en'
      });

      expect(result.successful).toBe(1);
      // Sanitization should have trimmed whitespace and normalized ISO code
    });
  });

  describe('Error Handling Tests', () => {
    it('should return error when city is not found', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'City not found' }
            })
          })
        })
      });

      const rows: ParsedLanguageRow[] = [{
        rowNumber: 2,
        name: 'Spanish',
        taxonomies: {},
        custom_fields: {}
      }];

      const result = await importLanguagesFromCSV(rows, {
        citySlug: 'nonexistent',
        locale: 'en'
      });

      expect(result.successful).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.error).toContain('City not found');
    });

    it('should reject invalid language name', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'city-123' },
              error: null
            })
          })
        })
      });

      const rows: ParsedLanguageRow[] = [{
        rowNumber: 2,
        name: "'; DROP TABLE languages; --",  // SQL injection attempt
        taxonomies: {},
        custom_fields: {}
      }];

      const result = await importLanguagesFromCSV(rows, {
        citySlug: 'amsterdam',
        locale: 'en'
      });

      expect(result.successful).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.results[0].error).toContain('invalid characters');
    });

    it('should handle empty rows array', async () => {
      const result = await importLanguagesFromCSV([], {
        citySlug: 'amsterdam',
        locale: 'en'
      });

      expect(result.total).toBe(0);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.error).toContain('No rows provided');
    });

    it('should handle missing city slug', async () => {
      const rows: ParsedLanguageRow[] = [{
        rowNumber: 2,
        name: 'Spanish',
        taxonomies: {},
        custom_fields: {}
      }];

      const result = await importLanguagesFromCSV(rows, {
        citySlug: '',
        locale: 'en'
      });

      expect(result.error).toContain('required');
    });
  });

  describe('Duplicate Handling Tests', () => {
    it('should skip duplicate language when updateExisting is false', async () => {
      // Mock city lookup
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'city-123' },
              error: null
            })
          })
        })
      });

      // Mock existing language found
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ language_id: 'lang-existing' }],
                error: null
              })
            })
          })
        })
      });

      const rows: ParsedLanguageRow[] = [{
        rowNumber: 2,
        name: 'Spanish',
        endonym: 'Español',
        taxonomies: {},
        custom_fields: {}
      }];

      const result = await importLanguagesFromCSV(rows, {
        citySlug: 'amsterdam',
        locale: 'en',
        updateExisting: false
      });

      expect(result.successful).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.results[0].error).toContain('already exists');
    });

    it('should update duplicate language when updateExisting is true', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'cities') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'city-123' },
                  error: null
                })
              })
            })
          };
        } else if (table === 'language_translations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    data: [{ language_id: 'lang-existing' }],
                    error: null
                  })
                })
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null })
              })
            })
          };
        } else if (table === 'languages') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            })
          };
        } else if (table === 'language_taxonomies') {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            }),
            insert: vi.fn().mockResolvedValue({ error: null })
          };
        }
        return {};
      });

      const rows: ParsedLanguageRow[] = [{
        rowNumber: 2,
        name: 'Spanish',
        endonym: 'Español',
        taxonomies: {},
        custom_fields: {}
      }];

      const result = await importLanguagesFromCSV(rows, {
        citySlug: 'amsterdam',
        locale: 'en',
        updateExisting: true
      });

      expect(result.successful).toBe(1);
      expect(result.failed).toBe(0);
    });
  });

  describe('Skip Errors Mode Tests', () => {
    it('should stop on first error when skipErrors is false', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'city-123' },
              error: null
            }),
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      const rows: ParsedLanguageRow[] = [
        {
          rowNumber: 2,
          name: 'Spanish',
          taxonomies: {},
          custom_fields: {}
        },
        {
          rowNumber: 3,
          name: 'French',
          taxonomies: {},
          custom_fields: {}
        }
      ];

      const result = await importLanguagesFromCSV(rows, {
        citySlug: 'amsterdam',
        locale: 'en',
        skipErrors: false
      });

      expect(result.successful).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.results.length).toBe(1); // Only first row attempted
      expect(result.error).toBeTruthy();
    });

    it('should continue on errors when skipErrors is true', async () => {
      let languageInsertCount = 0;

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'cities') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'city-123' },
                  error: null
                })
              })
            })
          };
        } else if (table === 'language_translations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    data: [],  // No existing languages
                    error: null
                  })
                })
              })
            }),
            insert: vi.fn().mockResolvedValue({ error: null })
          };
        } else if (table === 'languages') {
          languageInsertCount++;
          if (languageInsertCount === 1) {
            // First language insert fails
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Insert error' }
                  })
                })
              })
            };
          } else {
            // Second language insert succeeds
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'lang-123' },
                    error: null
                  })
                })
              })
            };
          }
        } else if (table === 'language_taxonomies') {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            }),
            insert: vi.fn().mockResolvedValue({ error: null })
          };
        }
        return {};
      });

      const rows: ParsedLanguageRow[] = [
        {
          rowNumber: 2,
          name: 'Spanish',
          taxonomies: {},
          custom_fields: {}
        },
        {
          rowNumber: 3,
          name: 'French',
          taxonomies: {},
          custom_fields: {}
        }
      ];

      const result = await importLanguagesFromCSV(rows, {
        citySlug: 'amsterdam',
        locale: 'en',
        skipErrors: true
      });

      expect(result.total).toBe(2);
      expect(result.failed).toBeGreaterThan(0);
      expect(result.successful).toBeGreaterThan(0);
      expect(result.results.length).toBe(2); // Both rows attempted
    });
  });

  describe('Taxonomy Mapping Tests', () => {
    it('should assign taxonomies during import', async () => {
      let insertCalls = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'cities') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'city-123' },
                  error: null
                })
              })
            })
          };
        } else if (table === 'language_translations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    data: [],
                    error: null
                  })
                })
              })
            }),
            insert: vi.fn().mockResolvedValue({ error: null })
          };
        } else if (table === 'languages') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'lang-123' },
                  error: null
                })
              })
            })
          };
        } else if (table === 'language_taxonomies') {
          insertCalls++;
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            }),
            insert: vi.fn().mockResolvedValue({ error: null })
          };
        }
        return {};
      });

      const rows: ParsedLanguageRow[] = [{
        rowNumber: 2,
        name: 'Spanish',
        taxonomies: { size: 'large', status: 'safe' },
        custom_fields: {}
      }];

      const result = await importLanguagesFromCSV(rows, {
        citySlug: 'amsterdam',
        locale: 'en',
        taxonomyMappings: [
          {
            csvColumn: 'size',
            taxonomyTypeId: 'type-1',
            valueMapping: { large: 'value-1' }
          },
          {
            csvColumn: 'status',
            taxonomyTypeId: 'type-2',
            valueMapping: { safe: 'value-2' }
          }
        ]
      });

      expect(result.successful).toBe(1);
      expect(insertCalls).toBeGreaterThan(0);
    });
  });
});

describe('getTaxonomyTypesForMapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch taxonomy types with values', async () => {
    // Mock city lookup
    mockSupabaseClient.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'city-123' },
            error: null
          })
        })
      })
    });

    // Mock taxonomy types query
    mockSupabaseClient.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'type-1',
                    slug: 'size',
                    translations: [{ name: 'Size' }],
                    values: [
                      {
                        id: 'value-1',
                        slug: 'large',
                        translations: [{ name: 'Large' }]
                      }
                    ]
                  }
                ],
                error: null
              })
            })
          })
        })
      })
    });

    const result = await getTaxonomyTypesForMapping('amsterdam');

    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('size');
    expect(result[0].name).toBe('Size');
    expect(result[0].values).toHaveLength(1);
    expect(result[0].values[0].slug).toBe('large');
  });

  it('should throw error for invalid city slug', async () => {
    await expect(getTaxonomyTypesForMapping('')).rejects.toThrow('required');
  });

  it('should throw error when city not found', async () => {
    mockSupabaseClient.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'City not found' }
          })
        })
      })
    });

    await expect(getTaxonomyTypesForMapping('nonexistent')).rejects.toThrow('City not found');
  });

  it('should return empty array when no taxonomy types exist', async () => {
    mockSupabaseClient.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'city-123' },
            error: null
          })
        })
      })
    });

    mockSupabaseClient.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
      })
    });

    const result = await getTaxonomyTypesForMapping('amsterdam');

    expect(result).toEqual([]);
  });
});
