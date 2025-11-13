/**
 * Language Family Management Server Actions
 * =========================================
 * Server-side actions for CRUD operations on language family entities with translations.
 *
 * Language families are global entities shared across all cities (e.g., "Indo-European", "Sino-Tibetan").
 * They are not city-specific like districts or neighborhoods.
 *
 * @module actions/language-families
 */

'use server'

import { revalidatePath } from 'next/cache'
import { getServerSupabaseWithCookies } from '@/lib/supabase/server-client'
import { z } from 'zod'

/**
 * Validation schema for language family creation/update
 */
const languageFamilySchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  // Translations
  name_en: z.string().min(1, 'English name is required'),
  description_en: z.string().optional(),
  name_nl: z.string().optional(),
  description_nl: z.string().optional(),
  name_fr: z.string().optional(),
  description_fr: z.string().optional(),
})

/**
 * Type for language family form input
 */
export type LanguageFamilyInput = z.infer<typeof languageFamilySchema>

/**
 * Get all language families with translations
 *
 * Note: Language families are global, not city-specific.
 * We still need a citySlug parameter for database client initialization.
 *
 * @async
 * @param citySlug - The city identifier (for database client initialization only)
 * @returns Promise containing array of language families with translations
 * @throws {Error} If citySlug is invalid or database query fails
 */
export async function getLanguageFamilies(citySlug: string) {
  try {
    // Input validation
    if (!citySlug || typeof citySlug !== 'string') {
      throw new Error('City slug is required')
    }

    if (!citySlug.match(/^[a-z0-9-]+$/)) {
      throw new Error('Invalid city slug format')
    }

    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Get all language families with translations
    // Note: No city filter as families are global
    const { data: families, error: familiesError } = await supabase
      .from('language_families')
      .select(`
        id,
        slug,
        created_at,
        updated_at,
        translations:language_family_translations (
          id,
          locale_code,
          name,
          description,
          is_ai_translated,
          ai_model
        )
      `)
      .order('created_at', { ascending: true })

    if (familiesError) {
      console.error('Error fetching language families:', familiesError)
      throw new Error(`Failed to fetch language families: ${familiesError.message}`)
    }

    return families
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching language families')
  }
}

/**
 * Get a single language family by ID with translations
 *
 * @async
 * @param citySlug - The city identifier (for database client initialization)
 * @param id - The language family UUID
 * @returns Promise containing the language family with translations
 * @throws {Error} If parameters are invalid or language family not found
 */
export async function getLanguageFamily(citySlug: string, id: string) {
  try {
    // Input validation
    if (!citySlug || typeof citySlug !== 'string') {
      throw new Error('City slug is required')
    }

    if (!citySlug.match(/^[a-z0-9-]+$/)) {
      throw new Error('Invalid city slug format')
    }

    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('Invalid language family ID format')
    }

    const supabase = await getServerSupabaseWithCookies(citySlug)

    const { data: family, error } = await supabase
      .from('language_families')
      .select(`
        id,
        slug,
        created_at,
        updated_at,
        translations:language_family_translations (
          id,
          locale_code,
          name,
          description,
          is_ai_translated,
          ai_model
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching language family:', error)
      throw new Error(`Failed to fetch language family: ${error.message}`)
    }

    if (!family) {
      throw new Error('Language family not found')
    }

    return family
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching language family')
  }
}

/**
 * Create a new language family with translations
 *
 * @async
 * @param citySlug - The city identifier (for database client initialization and revalidation)
 * @param formData - The language family form data including translations
 * @returns Promise containing the created language family
 * @throws {Error} If validation fails or creation fails
 */
export async function createLanguageFamily(citySlug: string, formData: LanguageFamilyInput) {
  try {
    // Input validation
    if (!citySlug || typeof citySlug !== 'string') {
      throw new Error('City slug is required')
    }

    if (!citySlug.match(/^[a-z0-9-]+$/)) {
      throw new Error('Invalid city slug format')
    }

    // Validate data against schema
    const validatedData = languageFamilySchema.parse(formData)

    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Build translations array for all provided locales
    const translations = []

    if (validatedData.name_en) {
      translations.push({
        locale_code: 'en',
        name: validatedData.name_en,
        description: validatedData.description_en || '',
      })
    }

    if (validatedData.name_nl) {
      translations.push({
        locale_code: 'nl',
        name: validatedData.name_nl,
        description: validatedData.description_nl || '',
      })
    }

    if (validatedData.name_fr) {
      translations.push({
        locale_code: 'fr',
        name: validatedData.name_fr,
        description: validatedData.description_fr || '',
      })
    }

    // Validate that at least one translation is provided
    if (translations.length === 0) {
      throw new Error('At least one translation (English) is required')
    }

    // Use atomic database function to create family with translations
    // This ensures the operation is transactional - either both succeed or both fail
    const { data, error } = await supabase.rpc('create_language_family_with_translations', {
      p_slug: validatedData.slug,
      p_translations: translations,
    })

    if (error) {
      console.error('Error creating language family:', error)
      // Check for unique constraint violation
      if (error.code === '23505' || error.message.includes('already exists')) {
        throw new Error(`Language family with slug '${validatedData.slug}' already exists`)
      }
      throw new Error(`Failed to create language family: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error('Failed to create language family - no data returned')
    }

    // Revalidate the language families list page
    revalidatePath(`/[locale]/operator/${citySlug}/language-families`)

    // Return a family-like object for compatibility
    return {
      id: data[0].family_id,
      slug: data[0].family_slug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
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
    throw new Error('An unexpected error occurred while creating language family')
  }
}

/**
 * Update an existing language family and its translations
 *
 * @async
 * @param citySlug - The city identifier (for database client initialization and revalidation)
 * @param id - The language family UUID to update
 * @param formData - The updated language family form data
 * @returns Promise containing the updated language family
 * @throws {Error} If validation fails, language family not found, or update fails
 */
export async function updateLanguageFamily(
  citySlug: string,
  id: string,
  formData: LanguageFamilyInput
) {
  try {
    // Input validation
    if (!citySlug || typeof citySlug !== 'string') {
      throw new Error('City slug is required')
    }

    if (!citySlug.match(/^[a-z0-9-]+$/)) {
      throw new Error('Invalid city slug format')
    }

    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('Invalid language family ID format')
    }

    // Validate data against schema
    const validatedData = languageFamilySchema.parse(formData)

    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Build translations array for all provided locales
    const translations = []

    if (validatedData.name_en) {
      translations.push({
        locale_code: 'en',
        name: validatedData.name_en,
        description: validatedData.description_en || '',
      })
    }

    if (validatedData.name_nl) {
      translations.push({
        locale_code: 'nl',
        name: validatedData.name_nl,
        description: validatedData.description_nl || '',
      })
    }

    if (validatedData.name_fr) {
      translations.push({
        locale_code: 'fr',
        name: validatedData.name_fr,
        description: validatedData.description_fr || '',
      })
    }

    // Validate that at least one translation is provided
    if (translations.length === 0) {
      throw new Error('At least one translation (English) is required')
    }

    // Use atomic database function to update family with translations
    // This ensures the operation is transactional - either both succeed or both fail
    const { data, error } = await supabase.rpc('update_language_family_with_translations', {
      p_family_id: id,
      p_slug: validatedData.slug,
      p_translations: translations,
    })

    if (error) {
      console.error('Error updating language family:', error)
      // Check for unique constraint violation
      if (error.code === '23505' || error.message.includes('already exists')) {
        throw new Error(`Language family with slug '${validatedData.slug}' already exists`)
      }
      // Check for not found error
      if (error.message.includes('not found')) {
        throw new Error('Language family not found')
      }
      throw new Error(`Failed to update language family: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error('Language family not found')
    }

    // Revalidate the language families list page and detail page
    revalidatePath(`/[locale]/operator/${citySlug}/language-families`)
    revalidatePath(`/[locale]/operator/${citySlug}/language-families/${id}`)

    // Return a family-like object for compatibility
    return {
      id: data[0].family_id,
      slug: data[0].family_slug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
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
    throw new Error('An unexpected error occurred while updating language family')
  }
}

/**
 * Delete a language family
 *
 * Note: This will also cascade delete all translations via database constraint.
 * Languages referencing this family will have their family_id set to NULL (if not using CASCADE).
 *
 * @async
 * @param citySlug - The city identifier (for database client initialization and revalidation)
 * @param id - The language family UUID to delete
 * @returns Promise<void>
 * @throws {Error} If language family ID is invalid or deletion fails
 */
export async function deleteLanguageFamily(citySlug: string, id: string) {
  try {
    // Input validation
    if (!citySlug || typeof citySlug !== 'string') {
      throw new Error('City slug is required')
    }

    if (!citySlug.match(/^[a-z0-9-]+$/)) {
      throw new Error('Invalid city slug format')
    }

    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('Invalid language family ID format')
    }

    const supabase = await getServerSupabaseWithCookies(citySlug)

    const { error } = await supabase.from('language_families').delete().eq('id', id)

    if (error) {
      console.error('Error deleting language family:', error)
      // Check for foreign key constraint violation
      if (error.code === '23503') {
        throw new Error(
          'Cannot delete language family: it is referenced by one or more languages. ' +
            'Please remove or reassign those languages first.'
        )
      }
      throw new Error(`Failed to delete language family: ${error.message}`)
    }

    // Revalidate the language families list page
    revalidatePath(`/[locale]/operator/${citySlug}/language-families`)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while deleting language family')
  }
}
