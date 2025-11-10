/**
 * Language Management Server Actions
 * ===================================
 * Server-side actions for CRUD operations on language entities with translations and taxonomy assignments.
 *
 * Languages are city-specific and support:
 * - Multilingual names (via language_translations table)
 * - Universal endonym (not translated)
 * - Flexible taxonomy assignments (via language_taxonomies table)
 * - Language family assignment
 * - Country of origin
 *
 * NOTE: This module performs multiple database operations without atomic transactions.
 * Supabase JS client doesn't support transactions directly. Rollback is attempted on failure,
 * but in rare cases, partial writes may occur. For production, consider implementing critical
 * operations via Postgres functions (RPC) for true atomicity.
 *
 * @module actions/languages
 */

'use server'

import { revalidatePath } from 'next/cache'
import { getServerSupabaseWithCookies } from '@/lib/supabase/server-client'
import { z } from 'zod'
import {
  sanitizeText,
  sanitizeISOCode,
  sanitizeUUID,
  sanitizeUUIDArray,
  sanitizeNumber,
  VALIDATION_LIMITS,
} from '@/lib/sanitization'

/**
 * Validation schema for language creation/update
 */
const languageSchema = z.object({
  // Core fields
  iso_639_3_code: z.string()
    .regex(/^[a-z]{3}$/, 'ISO 639-3 code must be exactly 3 lowercase letters')
    .optional()
    .or(z.literal('')),
  endonym: z.string()
    .min(1, 'Endonym is required')
    .max(VALIDATION_LIMITS.ENDONYM_MAX_LENGTH, `Endonym must not exceed ${VALIDATION_LIMITS.ENDONYM_MAX_LENGTH} characters`),
  language_family_id: z.string().uuid('Invalid language family ID').optional().or(z.literal('')),
  country_of_origin_id: z.string().uuid('Invalid country ID').optional().or(z.literal('')),
  speaker_count: z.number().int().min(0, 'Speaker count must be non-negative').optional(),

  // Translations for each locale
  name_en: z.string()
    .min(1, 'English name is required')
    .max(VALIDATION_LIMITS.NAME_MAX_LENGTH),
  name_nl: z.string()
    .max(VALIDATION_LIMITS.NAME_MAX_LENGTH)
    .optional(),
  name_fr: z.string()
    .max(VALIDATION_LIMITS.NAME_MAX_LENGTH)
    .optional(),

  // Taxonomy assignments (array of taxonomy value IDs)
  taxonomy_value_ids: z.array(z.string().uuid()).optional(),
})

/**
 * Type for language form input
 */
export type LanguageInput = z.infer<typeof languageSchema>

/**
 * Get all languages for a city with translations
 *
 * @async
 * @param citySlug - The city identifier
 * @param locale - The locale code for translations (e.g., 'en', 'nl', 'fr')
 * @returns Promise containing array of languages with translations
 * @throws {Error} If citySlug is invalid or database query fails
 */
export async function getLanguages(citySlug: string, locale: string = 'en') {
  try {
    // Input validation
    if (!citySlug || typeof citySlug !== 'string') {
      throw new Error('City slug is required')
    }

    if (!citySlug.match(/^[a-z0-9-]+$/)) {
      throw new Error(`Invalid city slug format: "${citySlug}"`)
    }

    if (!locale || typeof locale !== 'string') {
      throw new Error('Locale is required')
    }

    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Get city ID first
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .single()

    if (cityError) {
      console.error('Error fetching city for languages list:', {
        citySlug,
        error: cityError,
        timestamp: new Date().toISOString(),
      })
      throw new Error(`Failed to fetch city "${citySlug}": ${cityError.message}`)
    }

    if (!city) {
      throw new Error(`City not found for slug: "${citySlug}"`)
    }

    // Get all languages for this city with translations
    const { data: languages, error: languagesError } = await supabase
      .from('languages')
      .select(`
        id,
        iso_639_3_code,
        endonym,
        speaker_count,
        created_at,
        updated_at,
        language_family:language_families (
          id,
          slug,
          translations:language_family_translations!inner (
            name
          )
        ),
        country_of_origin:countries (
          id,
          iso_code,
          translations:country_translations!inner (
            name
          )
        ),
        translations:language_translations!inner (
          id,
          locale_code,
          name,
          is_ai_translated
        ),
        taxonomies:language_taxonomies (
          taxonomy_value:taxonomy_values (
            id,
            slug,
            color_hex,
            icon_name,
            translations:taxonomy_value_translations!inner (
              name
            )
          )
        )
      `)
      .eq('city_id', city.id)
      .eq('translations.locale_code', locale)
      .eq('language_family.translations.locale_code', locale)
      .eq('country_of_origin.translations.locale_code', locale)
      .eq('taxonomies.taxonomy_value.translations.locale_code', locale)
      .order('endonym', { ascending: true })

    if (languagesError) {
      console.error('Error fetching languages:', languagesError)
      throw new Error(`Failed to fetch languages: ${languagesError.message}`)
    }

    return languages ?? []
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching languages')
  }
}

/**
 * Get a single language by ID with all translations and taxonomy assignments
 *
 * @async
 * @param citySlug - The city identifier
 * @param id - The language UUID
 * @returns Promise containing the language with all translations and taxonomies
 * @throws {Error} If parameters are invalid or language not found
 */
export async function getLanguage(citySlug: string, id: string) {
  try {
    // Input validation
    if (!citySlug || typeof citySlug !== 'string') {
      throw new Error('City slug is required')
    }

    if (!citySlug.match(/^[a-z0-9-]+$/)) {
      throw new Error('Invalid city slug format')
    }

    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('Invalid language ID format')
    }

    const supabase = await getServerSupabaseWithCookies(citySlug)

    const { data: language, error } = await supabase
      .from('languages')
      .select(`
        id,
        city_id,
        iso_639_3_code,
        endonym,
        language_family_id,
        country_of_origin_id,
        speaker_count,
        created_at,
        updated_at,
        language_family:language_families (
          id,
          slug,
          translations:language_family_translations (
            locale_code,
            name
          )
        ),
        country_of_origin:countries (
          id,
          iso_code,
          translations:country_translations (
            locale_code,
            name
          )
        ),
        translations:language_translations (
          id,
          locale_code,
          name,
          is_ai_translated,
          ai_model
        ),
        taxonomies:language_taxonomies (
          id,
          taxonomy_value_id,
          taxonomy_value:taxonomy_values (
            id,
            slug,
            taxonomy_type_id,
            color_hex,
            icon_name,
            translations:taxonomy_value_translations (
              locale_code,
              name
            )
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching language:', error)
      throw new Error(`Failed to fetch language: ${error.message}`)
    }

    if (!language) {
      throw new Error('Language not found')
    }

    return language
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching language')
  }
}

/**
 * Create a new language with translations and taxonomy assignments
 *
 * @async
 * @param citySlug - The city identifier
 * @param formData - The language form data including translations and taxonomy assignments
 * @returns Promise containing the created language
 * @throws {Error} If validation fails or creation fails
 */
export async function createLanguage(citySlug: string, formData: LanguageInput) {
  try {
    // Input validation
    if (!citySlug || typeof citySlug !== 'string') {
      throw new Error('City slug is required')
    }

    if (!citySlug.match(/^[a-z0-9-]+$/)) {
      throw new Error('Invalid city slug format')
    }

    // Validate data against schema
    const validatedData = languageSchema.parse(formData)

    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Get city ID
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .single()

    if (cityError || !city) {
      throw new Error('City not found')
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Sanitize inputs before database insert
    const sanitizedData = {
      city_id: city.id,
      iso_639_3_code: sanitizeISOCode(validatedData.iso_639_3_code),
      endonym: sanitizeText(validatedData.endonym, VALIDATION_LIMITS.ENDONYM_MAX_LENGTH),
      language_family_id: sanitizeUUID(validatedData.language_family_id),
      country_of_origin_id: sanitizeUUID(validatedData.country_of_origin_id),
      speaker_count: sanitizeNumber(validatedData.speaker_count),
      created_by: user.id,
    }

    // Create the language
    const { data: language, error: languageError } = await supabase
      .from('languages')
      .insert(sanitizedData)
      .select()
      .single()

    if (languageError) {
      console.error('Error creating language:', {
        citySlug,
        error: languageError,
        timestamp: new Date().toISOString(),
      })
      throw new Error(`Failed to create language for city "${citySlug}": ${languageError.message}`)
    }

    if (!language) {
      throw new Error('Failed to create language - no data returned from database')
    }

    // Create translations
    const translations = []

    // Sanitize translation names
    if (validatedData.name_en) {
      translations.push({
        language_id: language.id,
        locale_code: 'en',
        name: sanitizeText(validatedData.name_en, VALIDATION_LIMITS.NAME_MAX_LENGTH),
      })
    }

    if (validatedData.name_nl) {
      translations.push({
        language_id: language.id,
        locale_code: 'nl',
        name: sanitizeText(validatedData.name_nl, VALIDATION_LIMITS.NAME_MAX_LENGTH),
      })
    }

    if (validatedData.name_fr) {
      translations.push({
        language_id: language.id,
        locale_code: 'fr',
        name: sanitizeText(validatedData.name_fr, VALIDATION_LIMITS.NAME_MAX_LENGTH),
      })
    }

    if (translations.length > 0) {
      const { error: translationsError } = await supabase
        .from('language_translations')
        .insert(translations)

      if (translationsError) {
        console.error('Error creating translations:', {
          languageId: language.id,
          error: translationsError,
          timestamp: new Date().toISOString(),
        })

        // Rollback: delete the language
        const { error: rollbackError } = await supabase
          .from('languages')
          .delete()
          .eq('id', language.id)

        if (rollbackError) {
          console.error('CRITICAL: Rollback failed after translation error:', {
            languageId: language.id,
            rollbackError,
            originalError: translationsError,
            timestamp: new Date().toISOString(),
          })
          throw new Error(
            `Failed to create translations and rollback failed. ` +
            `Manual cleanup required for language ID: ${language.id}. ` +
            `Original error: ${translationsError.message}`
          )
        }

        throw new Error(`Failed to create translations: ${translationsError.message}`)
      }
    }

    // Create taxonomy assignments
    if (validatedData.taxonomy_value_ids && validatedData.taxonomy_value_ids.length > 0) {
      // Sanitize taxonomy value IDs
      const sanitizedTaxonomyIds = sanitizeUUIDArray(validatedData.taxonomy_value_ids)

      if (sanitizedTaxonomyIds.length > 0) {
        const taxonomyAssignments = sanitizedTaxonomyIds.map(valueId => ({
          language_id: language.id,
          taxonomy_value_id: valueId,
        }))

        const { error: taxonomiesError } = await supabase
          .from('language_taxonomies')
          .insert(taxonomyAssignments)

        if (taxonomiesError) {
          console.error('Error creating taxonomy assignments:', {
            languageId: language.id,
            error: taxonomiesError,
            timestamp: new Date().toISOString(),
          })

          // Rollback: delete the language (will cascade delete translations)
          const { error: rollbackError } = await supabase
            .from('languages')
            .delete()
            .eq('id', language.id)

          if (rollbackError) {
            console.error('CRITICAL: Rollback failed after taxonomy assignment error:', {
              languageId: language.id,
              rollbackError,
              originalError: taxonomiesError,
              timestamp: new Date().toISOString(),
            })
            throw new Error(
              `Failed to create taxonomy assignments and rollback failed. ` +
              `Manual cleanup required for language ID: ${language.id}. ` +
              `Original error: ${taxonomiesError.message}`
            )
          }

          throw new Error(`Failed to create taxonomy assignments: ${taxonomiesError.message}`)
        }
      }
    }

    // Revalidate the languages list page
    revalidatePath(`/[locale]/operator/${citySlug}/languages`)

    return language
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((e: z.ZodIssue) => {
          const path = e.path.length > 0 ? `${e.path.join('.')}: ` : ''
          return `${path}${e.message}`
        })
        .join(', ')
      throw new Error(`Validation error: ${errorMessages}`)
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while creating language')
  }
}

/**
 * Update an existing language and its translations and taxonomy assignments
 *
 * @async
 * @param citySlug - The city identifier
 * @param id - The language UUID to update
 * @param formData - The updated language form data
 * @returns Promise containing the updated language
 * @throws {Error} If validation fails, language not found, or update fails
 */
export async function updateLanguage(citySlug: string, id: string, formData: LanguageInput) {
  try {
    // Input validation
    if (!citySlug || typeof citySlug !== 'string') {
      throw new Error('City slug is required')
    }

    if (!citySlug.match(/^[a-z0-9-]+$/)) {
      throw new Error('Invalid city slug format')
    }

    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('Invalid language ID format')
    }

    // Validate data against schema
    const validatedData = languageSchema.parse(formData)

    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Check if language exists
    const { data: existingLanguage, error: fetchError } = await supabase
      .from('languages')
      .select('id, city_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingLanguage) {
      throw new Error('Language not found')
    }

    // Update the language
    const { data: language, error: languageError } = await supabase
      .from('languages')
      .update({
        iso_639_3_code: validatedData.iso_639_3_code || null,
        endonym: validatedData.endonym,
        language_family_id: validatedData.language_family_id || null,
        country_of_origin_id: validatedData.country_of_origin_id || null,
        speaker_count: validatedData.speaker_count || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (languageError || !language) {
      console.error('Error updating language:', languageError)
      throw new Error(`Failed to update language: ${languageError?.message ?? 'Unknown error'}`)
    }

    // Update translations (delete and recreate for simplicity)
    const { error: deleteTranslationsError } = await supabase
      .from('language_translations')
      .delete()
      .eq('language_id', id)

    if (deleteTranslationsError) {
      console.error('Error deleting old translations:', deleteTranslationsError)
      throw new Error(`Failed to update translations: ${deleteTranslationsError.message}`)
    }

    const translations = []

    if (validatedData.name_en) {
      translations.push({
        language_id: id,
        locale_code: 'en',
        name: validatedData.name_en,
      })
    }

    if (validatedData.name_nl) {
      translations.push({
        language_id: id,
        locale_code: 'nl',
        name: validatedData.name_nl,
      })
    }

    if (validatedData.name_fr) {
      translations.push({
        language_id: id,
        locale_code: 'fr',
        name: validatedData.name_fr,
      })
    }

    if (translations.length > 0) {
      const { error: translationsError } = await supabase
        .from('language_translations')
        .insert(translations)

      if (translationsError) {
        console.error('Error creating new translations:', translationsError)
        throw new Error(`Failed to update translations: ${translationsError.message}`)
      }
    }

    // Update taxonomy assignments (delete and recreate)
    const { error: deleteTaxonomiesError } = await supabase
      .from('language_taxonomies')
      .delete()
      .eq('language_id', id)

    if (deleteTaxonomiesError) {
      console.error('Error deleting old taxonomy assignments:', deleteTaxonomiesError)
      throw new Error(`Failed to update taxonomy assignments: ${deleteTaxonomiesError.message}`)
    }

    if (validatedData.taxonomy_value_ids && validatedData.taxonomy_value_ids.length > 0) {
      const taxonomyAssignments = validatedData.taxonomy_value_ids.map(valueId => ({
        language_id: id,
        taxonomy_value_id: valueId,
      }))

      const { error: taxonomiesError } = await supabase
        .from('language_taxonomies')
        .insert(taxonomyAssignments)

      if (taxonomiesError) {
        console.error('Error creating new taxonomy assignments:', taxonomiesError)
        throw new Error(`Failed to update taxonomy assignments: ${taxonomiesError.message}`)
      }
    }

    // Revalidate the languages list page and detail page
    revalidatePath(`/[locale]/operator/${citySlug}/languages`)
    revalidatePath(`/[locale]/operator/${citySlug}/languages/${id}`)

    return language
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((e: z.ZodIssue) => {
          const path = e.path.length > 0 ? `${e.path.join('.')}: ` : ''
          return `${path}${e.message}`
        })
        .join(', ')
      throw new Error(`Validation error: ${errorMessages}`)
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while updating language')
  }
}

/**
 * Delete a language
 *
 * Note: This will cascade delete all translations, taxonomy assignments, and related data.
 *
 * @async
 * @param citySlug - The city identifier
 * @param id - The language UUID to delete
 * @returns Promise<void>
 * @throws {Error} If language ID is invalid or deletion fails
 */
export async function deleteLanguage(citySlug: string, id: string) {
  try {
    // Input validation
    if (!citySlug || typeof citySlug !== 'string') {
      throw new Error('City slug is required')
    }

    if (!citySlug.match(/^[a-z0-9-]+$/)) {
      throw new Error('Invalid city slug format')
    }

    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('Invalid language ID format')
    }

    const supabase = await getServerSupabaseWithCookies(citySlug)

    const { error } = await supabase.from('languages').delete().eq('id', id)

    if (error) {
      console.error('Error deleting language:', error)
      throw new Error(`Failed to delete language: ${error.message}`)
    }

    // Revalidate the languages list page
    revalidatePath(`/[locale]/operator/${citySlug}/languages`)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while deleting language')
  }
}

/**
 * Get language families for dropdown selection
 *
 * @async
 * @param citySlug - The city identifier
 * @param locale - The locale code for translations
 * @returns Promise containing array of language families
 * @throws {Error} If database query fails
 */
export async function getLanguageFamiliesForSelect(citySlug: string, locale: string = 'en') {
  try {
    const supabase = await getServerSupabaseWithCookies(citySlug)

    const { data: families, error } = await supabase
      .from('language_families')
      .select(`
        id,
        slug,
        translations:language_family_translations!inner (
          name
        )
      `)
      .eq('translations.locale_code', locale)
      .order('slug', { ascending: true })

    if (error) {
      console.error('Error fetching language families:', error)
      throw new Error(`Failed to fetch language families: ${error.message}`)
    }

    return families ?? []
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching language families')
  }
}

/**
 * Get countries for dropdown selection
 *
 * @async
 * @param citySlug - The city identifier
 * @param locale - The locale code for translations
 * @returns Promise containing array of countries
 * @throws {Error} If database query fails
 */
export async function getCountriesForSelect(citySlug: string, locale: string = 'en') {
  try {
    const supabase = await getServerSupabaseWithCookies(citySlug)

    const { data: countries, error } = await supabase
      .from('countries')
      .select(`
        id,
        iso_code,
        translations:country_translations!inner (
          name
        )
      `)
      .eq('translations.locale_code', locale)
      .order('iso_code', { ascending: true })

    if (error) {
      console.error('Error fetching countries:', error)
      throw new Error(`Failed to fetch countries: ${error.message}`)
    }

    return countries ?? []
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching countries')
  }
}

/**
 * Get taxonomy values for a city (for multi-select dropdown)
 *
 * @async
 * @param citySlug - The city identifier
 * @param locale - The locale code for translations
 * @returns Promise containing array of taxonomy types with their values
 * @throws {Error} If database query fails
 */
export async function getTaxonomyValuesForSelect(citySlug: string, locale: string = 'en') {
  try {
    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Get city ID
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .single()

    if (cityError || !city) {
      throw new Error('City not found')
    }

    const { data: taxonomyTypes, error } = await supabase
      .from('taxonomy_types')
      .select(`
        id,
        slug,
        is_required,
        allow_multiple,
        translations:taxonomy_type_translations!inner (
          name
        ),
        values:taxonomy_values (
          id,
          slug,
          color_hex,
          icon_name,
          translations:taxonomy_value_translations!inner (
            name
          )
        )
      `)
      .eq('city_id', city.id)
      .eq('translations.locale_code', locale)
      .eq('values.translations.locale_code', locale)
      .order('slug', { ascending: true })

    if (error) {
      console.error('Error fetching taxonomy values:', error)
      throw new Error(`Failed to fetch taxonomy values: ${error.message}`)
    }

    return taxonomyTypes ?? []
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching taxonomy values')
  }
}
