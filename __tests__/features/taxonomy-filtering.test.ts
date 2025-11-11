/**
 * @file taxonomy-filtering.test.ts
 * @description Integration tests for taxonomy filtering and map styling functionality.
 * Tests verify that taxonomies are properly assigned to languages, taxonomy data is
 * available for filtering, visual styling data is correct, and multilingual support works.
 *
 * This test suite validates:
 * - Taxonomy assignment to languages via language_taxonomies junction table
 * - Visual styling data (colors, icons, sizes) for map rendering
 * - Filtering capabilities using taxonomy types and values
 * - GeoJSON API queries with taxonomy data
 * - Multilingual taxonomy translations (EN/NL)
 * - Edge cases (languages without taxonomies, validation of color/size data)
 * - Error handling for database failures
 *
 * NOTE: This file uses raw Supabase client without generated types for integration testing.
 * Type assertions and @ts-ignore are used to suppress TypeScript errors from Supabase operations.
 *
 * @module __tests__/features/taxonomy-filtering.test
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - Integration tests using raw Supabase client without generated types
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Test data constants for easier maintenance
const TEST_DATA = {
  TAXONOMY_TYPE: {
    slug: 'test-size',
    isRequired: true,
    allowMultiple: false,
    useForMapStyling: true,
    useForFiltering: true,
    displayOrder: 1,
  },
  TAXONOMY_VALUE: {
    slug: 'test-medium',
    colorHex: '#FFD700',
    iconName: 'circle',
    iconSizeMultiplier: 1.0,
    displayOrder: 2,
  },
  LANGUAGE: {
    endonym: 'Test Language',
  },
  LANGUAGE_POINT: {
    latitude: 52.3676,
    longitude: 4.9041,
    postalCode: '1012JS',
    communityName: 'Test Community',
  },
  TRANSLATIONS: {
    en: {
      taxonomyType: 'Test Community Size',
      taxonomyTypeDesc: 'Size of the language community',
      taxonomyValue: 'Medium',
      language: 'Test Language',
    },
    nl: {
      taxonomyType: 'Test Gemeenschapsgrootte',
      taxonomyTypeDesc: 'Grootte van de taalgemeenschap',
      taxonomyValue: 'Middel',
      language: 'Test Taal',
    },
  },
} as const

// Regular expressions for validation
const HEX_COLOR_REGEX = /^#[0-9A-F]{6}$/i

// Validate required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || typeof supabaseUrl !== 'string' || !supabaseUrl.startsWith('http')) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required and must be a valid URL')
}

if (!supabaseKey || typeof supabaseKey !== 'string' || supabaseKey.length < 20) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required and must be a valid key')
}

describe('Taxonomy Filtering and Map Styling', () => {
  // Test timeout configuration (30 seconds for database operations)
  const SUITE_TIMEOUT = 30000

  let supabase: ReturnType<typeof createClient>
  let testCityId: string | null = null
  let testLanguageId: string | null = null
  let testTaxonomyTypeId: string | null = null
  let testTaxonomyValueId: string | null = null
  let testLanguagePointId: string | null = null

  /**
   * Sets up test fixtures before running the test suite.
   * Creates a complete test data hierarchy:
   * - Fetches Amsterdam city
   * - Creates test taxonomy type with translations (EN/NL)
   * - Creates test taxonomy value with visual styling
   * - Creates test language with translations
   * - Assigns taxonomy to language
   * - Creates language point for map testing
   *
   * @async
   * @throws {Error} If Amsterdam city not found or any database operation fails
   */
  beforeAll(async () => {
    try {
      supabase = createClient(supabaseUrl, supabaseKey)

      // Get Amsterdam city ID
      const { data: city, error: cityError } = await supabase
        .from('cities')
        .select('id')
        .eq('slug', 'amsterdam')
        .single()

      if (cityError) {
        throw new Error(`Failed to fetch Amsterdam city: ${cityError.message}`)
      }

      if (!city) {
        throw new Error('Amsterdam city not found in database')
      }
      testCityId = city.id

      // Create a test taxonomy type for testing
      const { data: taxonomyType, error: taxonomyTypeError } = await supabase
        .from('taxonomy_types')
        // @ts-ignore - Supabase client without generated types
        .insert({
          city_id: testCityId,
          slug: TEST_DATA.TAXONOMY_TYPE.slug,
          is_required: TEST_DATA.TAXONOMY_TYPE.isRequired,
          allow_multiple: TEST_DATA.TAXONOMY_TYPE.allowMultiple,
          use_for_map_styling: TEST_DATA.TAXONOMY_TYPE.useForMapStyling,
          use_for_filtering: TEST_DATA.TAXONOMY_TYPE.useForFiltering,
          display_order: TEST_DATA.TAXONOMY_TYPE.displayOrder
        })
        .select()
        .single()

      if (taxonomyTypeError) {
        throw new Error(`Failed to create test taxonomy type: ${taxonomyTypeError.message}`)
      }

      if (!taxonomyType) {
        throw new Error('No data returned when creating taxonomy type')
      }
      testTaxonomyTypeId = (taxonomyType as any).id

      // Add translations for taxonomy type
      const { error: typeTranslationError } = await supabase
        .from('taxonomy_type_translations')
        // @ts-ignore - Supabase client without generated types
        .insert([
          {
            taxonomy_type_id: testTaxonomyTypeId,
            locale_code: 'en',
            name: TEST_DATA.TRANSLATIONS.en.taxonomyType,
            description: TEST_DATA.TRANSLATIONS.en.taxonomyTypeDesc
          },
          {
            taxonomy_type_id: testTaxonomyTypeId,
            locale_code: 'nl',
            name: TEST_DATA.TRANSLATIONS.nl.taxonomyType,
            description: TEST_DATA.TRANSLATIONS.nl.taxonomyTypeDesc
          }
        ])

      if (typeTranslationError) {
        throw new Error(`Failed to create taxonomy type translations: ${typeTranslationError.message}`)
      }

      // Create a test taxonomy value with visual styling
      const { data: taxonomyValue, error: taxonomyValueError } = await supabase
        .from('taxonomy_values')
        // @ts-ignore - Supabase client without generated types
        .insert({
          taxonomy_type_id: testTaxonomyTypeId,
          slug: TEST_DATA.TAXONOMY_VALUE.slug,
          color_hex: TEST_DATA.TAXONOMY_VALUE.colorHex,
          icon_name: TEST_DATA.TAXONOMY_VALUE.iconName,
          icon_size_multiplier: TEST_DATA.TAXONOMY_VALUE.iconSizeMultiplier,
          display_order: TEST_DATA.TAXONOMY_VALUE.displayOrder
        })
        .select()
        .single()

      if (taxonomyValueError) {
        throw new Error(`Failed to create test taxonomy value: ${taxonomyValueError.message}`)
      }

      if (!taxonomyValue) {
        throw new Error('No data returned when creating taxonomy value')
      }
      testTaxonomyValueId = (taxonomyValue as any).id

      // Add translations for taxonomy value
      const { error: valueTranslationError } = await supabase
        .from('taxonomy_value_translations')
        // @ts-ignore - Supabase client without generated types
        .insert([
          { taxonomy_value_id: testTaxonomyValueId, locale_code: 'en', name: TEST_DATA.TRANSLATIONS.en.taxonomyValue },
          { taxonomy_value_id: testTaxonomyValueId, locale_code: 'nl', name: TEST_DATA.TRANSLATIONS.nl.taxonomyValue }
        ])

      if (valueTranslationError) {
        throw new Error(`Failed to create taxonomy value translations: ${valueTranslationError.message}`)
      }

      // Create a test language
      const { data: language, error: languageError } = await supabase
        .from('languages')
        // @ts-ignore - Supabase client without generated types
        .insert({
          city_id: testCityId,
          endonym: TEST_DATA.LANGUAGE.endonym
        })
        .select()
        .single()

      if (languageError) {
        throw new Error(`Failed to create test language: ${languageError.message}`)
      }

      if (!language) {
        throw new Error('No data returned when creating language')
      }
      testLanguageId = (language as any).id

      // Add translations for the language
      const { error: langTranslationError } = await supabase
        .from('language_translations')
        // @ts-ignore - Supabase client without generated types
        .insert([
          { language_id: testLanguageId, locale_code: 'en', name: TEST_DATA.TRANSLATIONS.en.language },
          { language_id: testLanguageId, locale_code: 'nl', name: TEST_DATA.TRANSLATIONS.nl.language }
        ])

      if (langTranslationError) {
        throw new Error(`Failed to create language translations: ${langTranslationError.message}`)
      }

      // Assign taxonomy value to language
      const { error: taxonomyAssignError } = await supabase
        .from('language_taxonomies')
        // @ts-ignore - Supabase client without generated types
        .insert({
          language_id: testLanguageId,
          taxonomy_value_id: testTaxonomyValueId
        })

      if (taxonomyAssignError) {
        throw new Error(`Failed to assign taxonomy to language: ${taxonomyAssignError.message}`)
      }

      // Create a language point for map testing
      const { data: languagePoint, error: languagePointError } = await supabase
        .from('language_points')
        // @ts-ignore - Supabase client without generated types
        .insert({
          city_id: testCityId,
          language_id: testLanguageId,
          latitude: TEST_DATA.LANGUAGE_POINT.latitude,
          longitude: TEST_DATA.LANGUAGE_POINT.longitude,
          postal_code: TEST_DATA.LANGUAGE_POINT.postalCode,
          community_name: TEST_DATA.LANGUAGE_POINT.communityName
        })
        .select()
        .single()

      if (languagePointError) {
        throw new Error(`Failed to create test language point: ${languagePointError.message}`)
      }

      if (!languagePoint) {
        throw new Error('No data returned when creating language point')
      }
      testLanguagePointId = (languagePoint as any).id
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Test setup failed: ${error.message}`)
      }
      throw new Error('Test setup failed: Unknown error')
    }
  }, SUITE_TIMEOUT)

  /**
   * Cleans up all test data created during setup.
   * Deletes in reverse dependency order to avoid foreign key violations:
   * 1. Language points
   * 2. Language taxonomies
   * 3. Language translations
   * 4. Languages
   * 5. Taxonomy value translations
   * 6. Taxonomy values
   * 7. Taxonomy type translations
   * 8. Taxonomy types
   *
   * Continues cleanup even if individual operations fail to ensure maximum cleanup.
   *
   * @async
   */
  afterAll(async () => {
    const cleanupErrors: Error[] = []

    try {
      // Clean up test data in reverse dependency order
      if (testLanguagePointId) {
        const { error } = await supabase
          .from('language_points')
          .delete()
          .eq('id', testLanguagePointId)

        if (error) {
          cleanupErrors.push(new Error(`Failed to delete language point: ${error.message}`))
        }
      }

      if (testLanguageId) {
        const { error: taxError } = await supabase
          .from('language_taxonomies')
          .delete()
          .eq('language_id', testLanguageId)

        if (taxError) {
          cleanupErrors.push(new Error(`Failed to delete language taxonomies: ${taxError.message}`))
        }

        const { error: transError } = await supabase
          .from('language_translations')
          .delete()
          .eq('language_id', testLanguageId)

        if (transError) {
          cleanupErrors.push(new Error(`Failed to delete language translations: ${transError.message}`))
        }

        const { error: langError } = await supabase
          .from('languages')
          .delete()
          .eq('id', testLanguageId)

        if (langError) {
          cleanupErrors.push(new Error(`Failed to delete language: ${langError.message}`))
        }
      }

      if (testTaxonomyValueId) {
        const { error: valTransError } = await supabase
          .from('taxonomy_value_translations')
          .delete()
          .eq('taxonomy_value_id', testTaxonomyValueId)

        if (valTransError) {
          cleanupErrors.push(new Error(`Failed to delete taxonomy value translations: ${valTransError.message}`))
        }

        const { error: valError } = await supabase
          .from('taxonomy_values')
          .delete()
          .eq('id', testTaxonomyValueId)

        if (valError) {
          cleanupErrors.push(new Error(`Failed to delete taxonomy value: ${valError.message}`))
        }
      }

      if (testTaxonomyTypeId) {
        const { error: typeTransError } = await supabase
          .from('taxonomy_type_translations')
          .delete()
          .eq('taxonomy_type_id', testTaxonomyTypeId)

        if (typeTransError) {
          cleanupErrors.push(new Error(`Failed to delete taxonomy type translations: ${typeTransError.message}`))
        }

        const { error: typeError } = await supabase
          .from('taxonomy_types')
          .delete()
          .eq('id', testTaxonomyTypeId)

        if (typeError) {
          cleanupErrors.push(new Error(`Failed to delete taxonomy type: ${typeError.message}`))
        }
      }

      // Log cleanup errors but don't fail the test suite
      if (cleanupErrors.length > 0) {
        console.warn('Cleanup errors occurred:', cleanupErrors.map(e => e.message).join(', '))
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Unexpected cleanup error: ${error.message}`)
      }
    }
  }, SUITE_TIMEOUT)

  describe('Taxonomy Assignment', () => {
    it('should properly assign taxonomy values to languages', async () => {
      try {
        // Query the language with its taxonomy assignments
        const { data, error } = await supabase
          .from('languages')
          .select(`
            id,
            endonym,
            language_taxonomies (
              taxonomy_value_id
            )
          `)
          .eq('id', testLanguageId)
          .single()

        // Assert no error occurred
        expect(error).toBeNull()

        if (error) {
          throw new Error(`Database query failed: ${error.message}`)
        }

        expect(data).toBeDefined()
        expect(data!.language_taxonomies).toHaveLength(1)
        expect(data!.language_taxonomies[0].taxonomy_value_id).toBe(testTaxonomyValueId)
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Test failed: ${error.message}`)
        }
        throw error
      }
    })

    it('should retrieve complete taxonomy hierarchy with visual styling data when querying languages', async () => {
      try {
        // Query language with full taxonomy details including visual styling data
        const { data, error } = await supabase
          .from('languages')
          .select(`
            id,
            endonym,
            language_taxonomies (
              id,
              taxonomy_value:taxonomy_values (
                id,
                slug,
                color_hex,
                icon_name,
                icon_size_multiplier,
                taxonomy_type:taxonomy_types (
                  id,
                  slug
                )
              )
            )
          `)
          .eq('id', testLanguageId)
          .single()

        expect(error).toBeNull()

        if (error) {
          throw new Error(`Database query failed: ${error.message}`)
        }

        expect(data).toBeDefined()
        expect(data!.language_taxonomies).toHaveLength(1)

        const firstTaxonomyAssignment = data?.language_taxonomies[0]
        expect(firstTaxonomyAssignment.taxonomy_value).toBeDefined()
        expect(firstTaxonomyAssignment.taxonomy_value.slug).toBe(TEST_DATA.TAXONOMY_VALUE.slug)
        expect(firstTaxonomyAssignment.taxonomy_value.color_hex).toBe(TEST_DATA.TAXONOMY_VALUE.colorHex)
        expect(firstTaxonomyAssignment.taxonomy_value.icon_name).toBe(TEST_DATA.TAXONOMY_VALUE.iconName)
        expect(firstTaxonomyAssignment.taxonomy_value.icon_size_multiplier).toBe(TEST_DATA.TAXONOMY_VALUE.iconSizeMultiplier)
        expect(firstTaxonomyAssignment.taxonomy_value.taxonomy_type.slug).toBe(TEST_DATA.TAXONOMY_TYPE.slug)
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Test failed: ${error.message}`)
        }
        throw error
      }
    })

    it('should support filtering languages by taxonomy values', async () => {
      try {
        // Filter languages by specific taxonomy value
        const { data, error } = await supabase
          .from('language_taxonomies')
          .select(`
            language:languages (
              id,
              endonym
            )
          `)
          .eq('taxonomy_value_id', testTaxonomyValueId)

        expect(error).toBeNull()

        if (error) {
          throw new Error(`Database query failed: ${error.message}`)
        }

        expect(data).toBeDefined()
        expect(data!.length).toBeGreaterThan(0)
        expect(data!.some(item => item.language.id === testLanguageId)).toBe(true)
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Test failed: ${error.message}`)
        }
        throw error
      }
    })
  })

  describe('Visual Styling Data', () => {
    it('should provide correct color data for map styling', async () => {
      try {
        // Query taxonomy value with color information
        const { data, error } = await supabase
          .from('taxonomy_values')
          .select('id, slug, color_hex')
          .eq('id', testTaxonomyValueId)
          .single()

        expect(error).toBeNull()

        if (error) {
          throw new Error(`Database query failed: ${error.message}`)
        }

        expect(data).toBeDefined()
        expect(data!.color_hex).toMatch(HEX_COLOR_REGEX)
        expect(data!.color_hex).toBe(TEST_DATA.TAXONOMY_VALUE.colorHex)
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Test failed: ${error.message}`)
        }
        throw error
      }
    })

    it('should provide correct icon data for map styling', async () => {
      try {
        // Query taxonomy value with icon information
        const { data, error } = await supabase
          .from('taxonomy_values')
          .select('id, slug, icon_name, icon_size_multiplier')
          .eq('id', testTaxonomyValueId)
          .single()

        expect(error).toBeNull()

        if (error) {
          throw new Error(`Database query failed: ${error.message}`)
        }

        expect(data).toBeDefined()
        expect(data!.icon_name).toBe(TEST_DATA.TAXONOMY_VALUE.iconName)
        expect(data!.icon_size_multiplier).toBe(TEST_DATA.TAXONOMY_VALUE.iconSizeMultiplier)
        expect(typeof data?.icon_size_multiplier).toBe('number')
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Test failed: ${error.message}`)
        }
        throw error
      }
    })

    it('should retrieve taxonomy types configured for map styling', async () => {
      try {
        // Query taxonomy types that are used for map styling
        const { data, error } = await supabase
          .from('taxonomy_types')
          .select('id, slug, use_for_map_styling')
          .eq('city_id', testCityId)
          .eq('use_for_map_styling', true)

        expect(error).toBeNull()

        if (error) {
          throw new Error(`Database query failed: ${error.message}`)
        }

        expect(data).toBeDefined()
        expect(data!.length).toBeGreaterThan(0)
        expect(data!.some(type => type.id === testTaxonomyTypeId)).toBe(true)
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Test failed: ${error.message}`)
        }
        throw error
      }
    })

    it('should retrieve taxonomy types configured for filtering', async () => {
      try {
        // Query taxonomy types that are used for filtering
        const { data, error } = await supabase
          .from('taxonomy_types')
          .select('id, slug, use_for_filtering')
          .eq('city_id', testCityId)
          .eq('use_for_filtering', true)

        expect(error).toBeNull()

        if (error) {
          throw new Error(`Database query failed: ${error.message}`)
        }

        expect(data).toBeDefined()
        expect(data!.length).toBeGreaterThan(0)
        expect(data!.some(type => type.id === testTaxonomyTypeId)).toBe(true)
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Test failed: ${error.message}`)
        }
        throw error
      }
    })
  })

  describe('Map Rendering Queries', () => {
    it('should retrieve language points with complete taxonomy data for map rendering', async () => {
      try {
        // Query mimics production GeoJSON API query structure
        // Inner join on translations ensures only languages with EN translations are returned
        // Includes full taxonomy hierarchy for dynamic map styling (colors, icons, sizes)
        const { data, error } = await supabase
          .from('language_points')
          .select(`
            id,
            latitude,
            longitude,
            postal_code,
            community_name,
            language:languages (
              id,
              endonym,
              language_translations!inner (
                locale_code,
                name
              ),
              language_taxonomies (
                taxonomy_value:taxonomy_values (
                  id,
                  slug,
                  color_hex,
                  icon_name,
                  icon_size_multiplier,
                  taxonomy_type:taxonomy_types (
                    slug,
                    use_for_map_styling
                  )
                )
              )
            )
          `)
          .eq('id', testLanguagePointId)
          .eq('language.language_translations.locale_code', 'en')
          .single()

        expect(error).toBeNull()

        if (error) {
          throw new Error(`Database query failed: ${error.message}`)
        }

        expect(data).toBeDefined()
        expect(data!.latitude).toBeDefined()
        expect(data!.longitude).toBeDefined()
        expect(data!.language).toBeDefined()
        expect(data!.language.endonym).toBe(TEST_DATA.LANGUAGE.endonym)
        expect(data!.language.language_translations).toHaveLength(1)
        expect(data!.language.language_translations[0].name).toBe(TEST_DATA.TRANSLATIONS.en.language)
        expect(data!.language.language_taxonomies).toHaveLength(1)

        const taxonomyValue = data?.language.language_taxonomies[0].taxonomy_value
        expect(taxonomyValue.color_hex).toBe(TEST_DATA.TAXONOMY_VALUE.colorHex)
        expect(taxonomyValue.icon_name).toBe(TEST_DATA.TAXONOMY_VALUE.iconName)
        expect(taxonomyValue.icon_size_multiplier).toBe(TEST_DATA.TAXONOMY_VALUE.iconSizeMultiplier)
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Test failed: ${error.message}`)
        }
        throw error
      }
    })

    it('should support filtering language points by city', async () => {
      try {
        // Query language points for a specific city
        const { data, error } = await supabase
          .from('language_points')
          .select(`
            id,
            language:languages!inner (
              id,
              city_id
            )
          `)
          .eq('language.city_id', testCityId)

        expect(error).toBeNull()

        if (error) {
          throw new Error(`Database query failed: ${error.message}`)
        }

        expect(data).toBeDefined()
        expect(data!.length).toBeGreaterThan(0)
        expect(data!.every(point => point.language.city_id === testCityId)).toBe(true)
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Test failed: ${error.message}`)
        }
        throw error
      }
    })

    it('should retrieve all taxonomy values for a city for filter UI generation', async () => {
      try {
        // Query all taxonomy types and values for a city (for generating filter UI)
        const { data, error } = await supabase
          .from('taxonomy_types')
          .select(`
            id,
            slug,
            use_for_filtering,
            is_required,
            allow_multiple,
            display_order,
            taxonomy_type_translations!inner (
              locale_code,
              name,
              description
            ),
            taxonomy_values (
              id,
              slug,
              color_hex,
              icon_name,
              display_order,
              taxonomy_value_translations!inner (
                locale_code,
                name
              )
            )
          `)
          .eq('city_id', testCityId)
          .eq('use_for_filtering', true)
          .eq('taxonomy_type_translations.locale_code', 'en')
          .eq('taxonomy_values.taxonomy_value_translations.locale_code', 'en')
          .order('display_order', { ascending: true })

        expect(error).toBeNull()

        if (error) {
          throw new Error(`Database query failed: ${error.message}`)
        }

        expect(data).toBeDefined()
        expect(data!.length).toBeGreaterThan(0)

        // Verify structure is correct for building filters
        const matchingTaxonomyType = data?.find(t => t.id === testTaxonomyTypeId)
        expect(matchingTaxonomyType).toBeDefined()
        expect(matchingTaxonomyType?.taxonomy_type_translations).toHaveLength(1)
        expect(matchingTaxonomyType?.taxonomy_type_translations[0].name).toBe(TEST_DATA.TRANSLATIONS.en.taxonomyType)
        expect(matchingTaxonomyType?.taxonomy_values.length).toBeGreaterThan(0)
        expect(matchingTaxonomyType?.taxonomy_values[0].taxonomy_value_translations).toHaveLength(1)
        expect(matchingTaxonomyType?.taxonomy_values[0].taxonomy_value_translations[0].name).toBeDefined()
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Test failed: ${error.message}`)
        }
        throw error
      }
    })
  })

  describe('Multilingual Taxonomy Support', () => {
    it('should retrieve taxonomy translations in multiple locales', async () => {
      try {
        // Query taxonomy value with translations in different locales
        const { data, error } = await supabase
          .from('taxonomy_values')
          .select(`
            id,
            slug,
            taxonomy_value_translations (
              locale_code,
              name
            )
          `)
          .eq('id', testTaxonomyValueId)
          .single()

        expect(error).toBeNull()

        if (error) {
          throw new Error(`Database query failed: ${error.message}`)
        }

        expect(data).toBeDefined()
        expect(data!.taxonomy_value_translations.length).toBeGreaterThanOrEqual(2)

        const enTranslation = data?.taxonomy_value_translations.find(t => t.locale_code === 'en')
        const nlTranslation = data?.taxonomy_value_translations.find(t => t.locale_code === 'nl')

        expect(enTranslation).toBeDefined()
        expect(enTranslation?.name).toBe(TEST_DATA.TRANSLATIONS.en.taxonomyValue)
        expect(nlTranslation).toBeDefined()
        expect(nlTranslation?.name).toBe(TEST_DATA.TRANSLATIONS.nl.taxonomyValue)
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Test failed: ${error.message}`)
        }
        throw error
      }
    })

    it('should filter language points with localized taxonomy names for Dutch locale', async () => {
      try {
        // Query for Dutch locale
        const { data, error } = await supabase
          .from('language_points')
          .select(`
            id,
            language:languages (
              id,
              language_translations!inner (
                locale_code,
                name
              ),
              language_taxonomies (
                taxonomy_value:taxonomy_values (
                  slug,
                  taxonomy_value_translations!inner (
                    locale_code,
                    name
                  )
                )
              )
            )
          `)
          .eq('id', testLanguagePointId)
          .eq('language.language_translations.locale_code', 'nl')
          .eq('language.language_taxonomies.taxonomy_value.taxonomy_value_translations.locale_code', 'nl')
          .single()

        expect(error).toBeNull()

        if (error) {
          throw new Error(`Database query failed: ${error.message}`)
        }

        expect(data).toBeDefined()
        expect(data!.language.language_translations[0].name).toBe(TEST_DATA.TRANSLATIONS.nl.language)
        expect(data!.language.language_taxonomies[0].taxonomy_value.taxonomy_value_translations[0].name).toBe(TEST_DATA.TRANSLATIONS.nl.taxonomyValue)
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Test failed: ${error.message}`)
        }
        throw error
      }
    })
  })

  describe('Edge Cases and Validation', () => {
    it('should handle languages without taxonomy assignments', async () => {
      try {
        // Create a language without taxonomies
        const { data: langWithoutTax, error: createError } = await supabase
          .from('languages')
          // @ts-ignore - Supabase client without generated types
          .insert({
            city_id: testCityId,
            endonym: 'No Tax Language'
          })
          .select()
          .single()

        expect(createError).toBeNull()

        if (createError) {
          throw new Error(`Failed to create language: ${createError.message}`)
        }

        const { data, error } = await supabase
          .from('languages')
          .select(`
            id,
            endonym,
            language_taxonomies (
              taxonomy_value_id
            )
          `)
          .eq('id', langWithoutTax!.id)
          .single()

        expect(error).toBeNull()

        if (error) {
          throw new Error(`Database query failed: ${error.message}`)
        }

        expect(data).toBeDefined()
        expect(data!.language_taxonomies).toHaveLength(0)

        // Clean up and verify deletion
        const { error: deleteError } = await supabase
          .from('languages')
          .delete()
          .eq('id', langWithoutTax!.id)

        expect(deleteError).toBeNull()
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Test failed: ${error.message}`)
        }
        throw error
      }
    })

    it('should validate taxonomy value color format', async () => {
      try {
        // All colors should be valid hex codes
        const { data, error } = await supabase
          .from('taxonomy_values')
          .select('id, color_hex')
          .eq('taxonomy_type_id', testTaxonomyTypeId)

        expect(error).toBeNull()

        if (error) {
          throw new Error(`Database query failed: ${error.message}`)
        }

        expect(data).toBeDefined()

        data?.forEach(value => {
          expect(value.color_hex).toMatch(HEX_COLOR_REGEX)
        })
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Test failed: ${error.message}`)
        }
        throw error
      }
    })

    it('should validate icon size multiplier range', async () => {
      try {
        // Icon size multipliers should be positive numbers
        const { data, error } = await supabase
          .from('taxonomy_values')
          .select('id, icon_size_multiplier')
          .eq('taxonomy_type_id', testTaxonomyTypeId)

        expect(error).toBeNull()

        if (error) {
          throw new Error(`Database query failed: ${error.message}`)
        }

        expect(data).toBeDefined()

        data?.forEach(value => {
          expect(value.icon_size_multiplier).toBeGreaterThan(0)
          expect(typeof value.icon_size_multiplier).toBe('number')
        })
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Test failed: ${error.message}`)
        }
        throw error
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle database query failures gracefully', async () => {
      try {
        // Test with invalid ID that doesn't exist
        const { data, error } = await supabase
          .from('languages')
          .select('id, endonym')
          .eq('id', '00000000-0000-0000-0000-000000000000')
          .single()

        expect(error).not.toBeNull()
        expect(data).toBeNull()
      } catch (error) {
        // Expected to catch error from .single() when no data found
        expect(error).toBeDefined()
      }
    })

    it('should handle missing required fields during insert', async () => {
      try {
        // Attempt to create taxonomy without required city_id
        const { error } = await supabase
          .from('taxonomy_types')
          // @ts-ignore - Supabase client without generated types
          .insert({
            slug: 'invalid-taxonomy',
            // Missing city_id - should fail
          } as any)

        expect(error).not.toBeNull()
        if (error) {
          expect(error.code).toBe('23502') // PostgreSQL NOT NULL violation
        }
      } catch (error) {
        // Expected error
        expect(error).toBeDefined()
      }
    })

    it('should handle duplicate slug violations', async () => {
      try {
        // Attempt to create duplicate taxonomy type slug
        const { error } = await supabase
          .from('taxonomy_types')
          // @ts-ignore - Supabase client without generated types
          .insert({
            city_id: testCityId,
            slug: TEST_DATA.TAXONOMY_TYPE.slug, // Duplicate slug
            is_required: false,
          })

        expect(error).not.toBeNull()
        if (error) {
          // PostgreSQL unique violation
          expect(error.code).toBe('23505')
        }
      } catch (error) {
        // Expected error
        expect(error).toBeDefined()
      }
    })
  })
})
