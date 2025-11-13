/**
 * Server actions for descriptions CRUD operations
 * Handles creation, reading, updating, and deletion of descriptions
 * with multi-language translations and AI generation tracking.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getServerSupabaseWithCookies } from '@/lib/supabase/server-client'

/**
 * Type definitions for database query results
 */
interface Translation {
  text: string
  locale: string
  is_ai_translated: boolean
  ai_model: string | null
  ai_translated_at: string | null
  reviewed_by: string | null
  reviewed_at: string | null
}

interface LanguageWithTranslations {
  id: string
  endonym: string | null
  translations: { name: string; locale_code: string }[]
}

interface NeighborhoodWithTranslations {
  id: string
  slug: string
  translations: { name: string; locale_code: string }[]
}

interface RawDescription {
  id: string
  city_id: string
  language_id: string
  neighborhood_id: string | null
  is_ai_generated: boolean
  ai_model: string | null
  ai_generated_at: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  language: LanguageWithTranslations | null
  neighborhood: NeighborhoodWithTranslations | null
  translations: Translation[]
}

/**
 * Validation schema for description form data (without translations)
 */
const DescriptionSchema = z.object({
  language_id: z.string().uuid('Please select a language'),
  neighborhood_id: z.string().uuid().nullable().optional(),
  is_ai_generated: z.boolean().default(false),
  ai_model: z.string().nullable().optional(),
})

/**
 * Validation schema for description translation
 */
const DescriptionTranslationSchema = z.object({
  locale: z.string().min(2).max(10),
  text: z.string().min(1, 'Description text is required'),
  is_ai_translated: z.boolean().default(false),
  ai_model: z.string().nullable().optional(),
})

export type DescriptionFormData = z.infer<typeof DescriptionSchema>
export type DescriptionTranslationData = z.infer<typeof DescriptionTranslationSchema>

/**
 * Retrieves all descriptions for a city with related data
 *
 * @async
 * @param citySlug - The slug of the city
 * @param locale - The current locale for translations
 * @returns Promise<Array> Array of descriptions with language, neighborhood, and translation information
 * @throws {Error} If database query fails or parameters are invalid
 */
export async function getDescriptions(citySlug: string, locale: string) {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string' || citySlug.trim() === '') {
    throw new Error('City slug is required and must be a non-empty string')
  }

  if (!locale || typeof locale !== 'string' || locale.trim() === '') {
    throw new Error('Locale is required and must be a non-empty string')
  }

  try {
    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Get city ID first
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .single()

    if (cityError || !city) {
      throw new Error(`Failed to fetch city: City not found for slug "${citySlug}"`)
    }

    // Get descriptions with related data
    const { data: rawData, error } = await supabase
      .from('descriptions')
      .select(`
        id,
        city_id,
        language_id,
        neighborhood_id,
        is_ai_generated,
        ai_model,
        ai_generated_at,
        reviewed_by,
        reviewed_at,
        created_at,
        updated_at,
        created_by,
        language:languages(
          id,
          endonym
        ),
        translations:description_translations(
          text,
          locale,
          is_ai_translated,
          ai_model,
          ai_translated_at,
          reviewed_by,
          reviewed_at
        )
      `)
      .eq('city_id', city.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch descriptions: ${error.message}`)
    }

    // Get language IDs and neighborhood IDs to fetch translations
    const descriptions = rawData as unknown as RawDescription[]
    const languageIds = [...new Set((descriptions || []).map(d => d.language_id).filter(Boolean))]
    const neighborhoodIds = [...new Set((descriptions || []).map(d => d.neighborhood_id).filter(Boolean))]

    // Fetch language translations
    const { data: langTranslations } = await supabase
      .from('language_translations')
      .select('language_id, name, locale_code')
      .in('language_id', languageIds)
      .eq('locale_code', locale)

    // Fetch neighborhood translations
    const { data: neighborhoodTranslations } = await supabase
      .from('neighborhood_translations')
      .select('neighborhood_id, name, locale_code')
      .in('neighborhood_id', neighborhoodIds)
      .eq('locale_code', locale)

    // Create lookup maps
    const langTransMap = new Map((langTranslations || []).map(t => [t.language_id, t.name]))
    const neighborhoodTransMap = new Map((neighborhoodTranslations || []).map(t => [t.neighborhood_id, t.name]))

    // Transform the data
    const result = descriptions.map((desc) => ({
      id: desc.id,
      city_id: desc.city_id,
      language_id: desc.language_id,
      neighborhood_id: desc.neighborhood_id,
      is_ai_generated: desc.is_ai_generated,
      ai_model: desc.ai_model,
      ai_generated_at: desc.ai_generated_at,
      reviewed_by: desc.reviewed_by,
      reviewed_at: desc.reviewed_at,
      created_at: desc.created_at,
      updated_at: desc.updated_at,
      created_by: desc.created_by,
      language_name: langTransMap.get(desc.language_id) || desc.language?.endonym || 'Unknown',
      language_endonym: desc.language?.endonym || null,
      neighborhood_name: desc.neighborhood_id ? (neighborhoodTransMap.get(desc.neighborhood_id) || null) : null,
      translations: desc.translations || [],
    }))

    return result
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch descriptions: ${error.message}`)
    }
    throw new Error('Failed to fetch descriptions: Unknown error')
  }
}

/**
 * Retrieves a single description by ID with all related data
 *
 * @async
 * @param citySlug - The slug of the city
 * @param descriptionId - The UUID of the description
 * @param locale - The current locale for translations
 * @returns Promise<Object|null> Description object or null if not found
 * @throws {Error} If database query fails or parameters are invalid
 */
export async function getDescription(
  citySlug: string,
  descriptionId: string,
  locale: string
) {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string' || citySlug.trim() === '') {
    throw new Error('City slug is required and must be a non-empty string')
  }

  if (!descriptionId || typeof descriptionId !== 'string' || descriptionId.trim() === '') {
    throw new Error('Description ID is required and must be a non-empty string')
  }

  if (!locale || typeof locale !== 'string' || locale.trim() === '') {
    throw new Error('Locale is required and must be a non-empty string')
  }

  try {
    const supabase = await getServerSupabaseWithCookies(citySlug)

    const { data: rawData, error } = await supabase
      .from('descriptions')
      .select(`
        id,
        city_id,
        language_id,
        neighborhood_id,
        is_ai_generated,
        ai_model,
        ai_generated_at,
        reviewed_by,
        reviewed_at,
        created_at,
        updated_at,
        created_by,
        language:languages(
          id,
          endonym,
          translations:language_translations!inner(name, locale_code)
        ),
        neighborhood:neighborhoods(
          id,
          slug,
          translations:neighborhood_translations!inner(name, locale_code)
        ),
        translations:description_translations(
          text,
          locale,
          is_ai_translated,
          ai_model,
          ai_translated_at,
          reviewed_by,
          reviewed_at
        )
      `)
      .eq('id', descriptionId)
      .eq('language.translations.locale_code', locale)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch description: ${error.message}`)
    }

    const desc = rawData as unknown as RawDescription

    return {
      id: desc.id,
      city_id: desc.city_id,
      language_id: desc.language_id,
      neighborhood_id: desc.neighborhood_id,
      is_ai_generated: desc.is_ai_generated,
      ai_model: desc.ai_model,
      ai_generated_at: desc.ai_generated_at,
      reviewed_by: desc.reviewed_by,
      reviewed_at: desc.reviewed_at,
      created_at: desc.created_at,
      updated_at: desc.updated_at,
      created_by: desc.created_by,
      language_name: desc.language?.translations?.[0]?.name || 'Unknown',
      language_endonym: desc.language?.endonym || null,
      neighborhood_name: desc.neighborhood?.translations?.[0]?.name || null,
      translations: desc.translations || [],
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch description: ${error.message}`)
    }
    throw new Error('Failed to fetch description: Unknown error')
  }
}

/**
 * Creates a new description with initial translation
 *
 * @async
 * @param citySlug - The slug of the city
 * @param data - Description form data
 * @param initialTranslation - Initial translation data
 * @returns Promise<Object> Created description with ID
 * @throws {Error} If validation fails or database operation fails
 */
export async function createDescription(
  citySlug: string,
  data: DescriptionFormData,
  initialTranslation: DescriptionTranslationData
) {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string' || citySlug.trim() === '') {
    throw new Error('City slug is required and must be a non-empty string')
  }

  try {
    // Validate input data
    const validatedData = DescriptionSchema.parse(data)
    const validatedTranslation = DescriptionTranslationSchema.parse(initialTranslation)

    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Get city ID
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .single()

    if (cityError || !city) {
      throw new Error(`Failed to fetch city: City not found for slug "${citySlug}"`)
    }

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('Failed to create description: User not authenticated')
    }

    // Create description
    const { data: description, error: descError } = await supabase
      .from('descriptions')
      .insert({
        city_id: city.id,
        language_id: validatedData.language_id,
        neighborhood_id: validatedData.neighborhood_id || null,
        is_ai_generated: validatedData.is_ai_generated || false,
        ai_model: validatedData.ai_model || null,
        ai_generated_at: validatedData.is_ai_generated ? new Date().toISOString() : null,
        created_by: user.id,
      })
      .select()
      .single()

    if (descError || !description) {
      throw new Error(`Failed to create description: ${descError?.message || 'Unknown error'}`)
    }

    // Create initial translation
    const { error: transError } = await supabase
      .from('description_translations')
      .insert({
        description_id: description.id,
        locale: validatedTranslation.locale,
        text: validatedTranslation.text,
        is_ai_translated: validatedTranslation.is_ai_translated || false,
        ai_model: validatedTranslation.ai_model || null,
        ai_translated_at: validatedTranslation.is_ai_translated ? new Date().toISOString() : null,
      })

    if (transError) {
      // Rollback: delete the description that was just created
      // If rollback fails, log it but still throw the original error to inform the user
      try {
        const { error: rollbackError } = await supabase
          .from('descriptions')
          .delete()
          .eq('id', description.id)

        if (rollbackError) {
          console.error('Rollback failed after translation error:', {
            descriptionId: description.id,
            citySlug,
            rollbackError: rollbackError.message,
            originalError: transError.message,
          })
        }
      } catch (rollbackErr) {
        console.error('Exception during rollback:', {
          descriptionId: description.id,
          citySlug,
          exception: rollbackErr instanceof Error ? rollbackErr.message : 'Unknown error',
        })
      }

      throw new Error(`Failed to create translation: ${transError.message}`)
    }

    // Revalidate cache
    revalidatePath(`/[locale]/operator/[citySlug]/descriptions`, 'page')

    return description
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues[0].message}`)
    }
    if (error instanceof Error) {
      throw new Error(`Failed to create description: ${error.message}`)
    }
    throw new Error('Failed to create description: Unknown error')
  }
}

/**
 * Updates an existing description
 *
 * @async
 * @param citySlug - The slug of the city
 * @param descriptionId - The UUID of the description to update
 * @param data - Updated description form data
 * @returns Promise<Object> Updated description
 * @throws {Error} If validation fails or database operation fails
 */
export async function updateDescription(
  citySlug: string,
  descriptionId: string,
  data: DescriptionFormData
) {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string' || citySlug.trim() === '') {
    throw new Error('City slug is required and must be a non-empty string')
  }

  if (!descriptionId || typeof descriptionId !== 'string' || descriptionId.trim() === '') {
    throw new Error('Description ID is required and must be a non-empty string')
  }

  try {
    // Validate input data
    const validatedData = DescriptionSchema.parse(data)

    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Update description
    const { data: description, error } = await supabase
      .from('descriptions')
      .update({
        language_id: validatedData.language_id,
        neighborhood_id: validatedData.neighborhood_id || null,
        is_ai_generated: validatedData.is_ai_generated || false,
        ai_model: validatedData.ai_model || null,
      })
      .eq('id', descriptionId)
      .select()
      .single()

    if (error) {
      // Handle specific error codes for better user feedback
      if (error.code === 'PGRST116') {
        throw new Error('Description not found or you do not have permission to update it')
      }
      if (error.code === '23503') {
        throw new Error('Invalid language or neighborhood reference')
      }
      throw new Error(`Failed to update description: ${error.message}`)
    }

    // Revalidate cache
    revalidatePath(`/[locale]/operator/[citySlug]/descriptions`, 'page')
    revalidatePath(`/[locale]/operator/[citySlug]/descriptions/[id]`, 'page')

    return description
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues[0].message}`)
    }
    if (error instanceof Error) {
      throw new Error(`Failed to update description: ${error.message}`)
    }
    throw new Error('Failed to update description: Unknown error')
  }
}

/**
 * Deletes a description and all its translations
 *
 * @async
 * @param citySlug - The slug of the city
 * @param descriptionId - The UUID of the description to delete
 * @returns Promise<void>
 * @throws {Error} If database operation fails
 */
export async function deleteDescription(citySlug: string, descriptionId: string) {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string' || citySlug.trim() === '') {
    throw new Error('City slug is required and must be a non-empty string')
  }

  if (!descriptionId || typeof descriptionId !== 'string' || descriptionId.trim() === '') {
    throw new Error('Description ID is required and must be a non-empty string')
  }

  try {
    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Delete description (cascade will delete translations)
    const { error } = await supabase.from('descriptions').delete().eq('id', descriptionId)

    if (error) {
      // Handle specific error codes for better user feedback
      if (error.code === 'PGRST116') {
        throw new Error('Description not found or you do not have permission to delete it')
      }
      if (error.code === '23503') {
        throw new Error('Cannot delete description: it is referenced by other records')
      }
      throw new Error(`Failed to delete description: ${error.message}`)
    }

    // Revalidate cache
    revalidatePath(`/[locale]/operator/[citySlug]/descriptions`, 'page')
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete description: ${error.message}`)
    }
    throw new Error('Failed to delete description: Unknown error')
  }
}

/**
 * Retrieves all languages for a city to populate language selector
 *
 * @async
 * @param citySlug - The slug of the city
 * @param locale - The current locale for translations
 * @returns Promise<Array> Array of languages with translations
 * @throws {Error} If database query fails
 */
export async function getLanguagesForDescription(citySlug: string, locale: string) {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string' || citySlug.trim() === '') {
    throw new Error('City slug is required and must be a non-empty string')
  }

  if (!locale || typeof locale !== 'string' || locale.trim() === '') {
    throw new Error('Locale is required and must be a non-empty string')
  }

  try {
    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Get city ID
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .single()

    if (cityError || !city) {
      throw new Error(`Failed to fetch city: City not found for slug "${citySlug}"`)
    }

    // Get languages
    const { data, error } = await supabase
      .from('languages')
      .select(`
        id,
        endonym,
        translations:language_translations!inner(name, locale_code)
      `)
      .eq('city_id', city.id)
      .eq('translations.locale_code', locale)

    if (error) {
      throw new Error(`Failed to fetch languages: ${error.message}`)
    }

    // Sort by translation name on the client side
    const languages = (data || []).sort((a, b) => {
      const nameA = a.translations?.[0]?.name || ''
      const nameB = b.translations?.[0]?.name || ''
      return nameA.localeCompare(nameB)
    })

    return languages
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch languages: ${error.message}`)
    }
    throw new Error('Failed to fetch languages: Unknown error')
  }
}

/**
 * Retrieves all neighborhoods for a city to populate neighborhood selector
 *
 * @async
 * @param citySlug - The slug of the city
 * @param locale - The current locale for translations
 * @returns Promise<Array> Array of neighborhoods with translations
 * @throws {Error} If database query fails
 */
export async function getNeighborhoodsForDescription(citySlug: string, locale: string) {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string' || citySlug.trim() === '') {
    throw new Error('City slug is required and must be a non-empty string')
  }

  if (!locale || typeof locale !== 'string' || locale.trim() === '') {
    throw new Error('Locale is required and must be a non-empty string')
  }

  try {
    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Get city ID
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .single()

    if (cityError || !city) {
      throw new Error(`Failed to fetch city: City not found for slug "${citySlug}"`)
    }

    // Get neighborhoods via districts
    const { data, error } = await supabase
      .from('neighborhoods')
      .select(`
        id,
        slug,
        district_id,
        translations:neighborhood_translations!inner(name, locale_code),
        district:districts!inner(city_id)
      `)
      .eq('district.city_id', city.id)
      .eq('translations.locale_code', locale)

    if (error) {
      throw new Error(`Failed to fetch neighborhoods: ${error.message}`)
    }

    // Sort by translation name on the client side
    const neighborhoods = (data || []).sort((a, b) => {
      const nameA = a.translations?.[0]?.name || ''
      const nameB = b.translations?.[0]?.name || ''
      return nameA.localeCompare(nameB)
    })

    return neighborhoods
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch neighborhoods: ${error.message}`)
    }
    throw new Error('Failed to fetch neighborhoods: Unknown error')
  }
}
