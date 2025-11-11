/**
 * Server actions for language points CRUD operations
 * Handles creation, reading, updating, and deletion of language points
 * with geographic coordinates and neighborhood associations.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getDatabaseClient } from '@/lib/database/client'

/**
 * Validation schema for language point form data
 */
const LanguagePointSchema = z.object({
  language_id: z.string().uuid('Please select a language'),
  neighborhood_id: z.string().uuid('Please select a neighborhood').nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  postal_code: z.string().optional(),
  community_name: z.string().optional(),
  notes: z.string().optional(),
})

export type LanguagePointFormData = z.infer<typeof LanguagePointSchema>

/**
 * Retrieves all language points for a city with related data
 *
 * @async
 * @param citySlug - The slug of the city
 * @param locale - The current locale for translations
 * @returns Promise<Array> Array of language points with language and neighborhood information
 * @throws {Error} If database query fails or parameters are invalid
 */
export async function getLanguagePoints(citySlug: string, locale: string) {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string' || citySlug.trim() === '') {
    throw new Error('City slug is required and must be a non-empty string')
  }

  if (!locale || typeof locale !== 'string' || locale.trim() === '') {
    throw new Error('Locale is required and must be a non-empty string')
  }

  try {
    const supabase = getDatabaseClient(citySlug)

    // Get city ID first
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .single()

    if (cityError || !city) {
      throw new Error(`City not found: ${citySlug}`)
    }

    // Get language points with related data
    const { data, error } = await supabase
      .from('language_points')
      .select(`
        id,
        latitude,
        longitude,
        postal_code,
        community_name,
        notes,
        created_at,
        language:languages!inner (
          id,
          endonym,
          translations:language_translations!inner (
            name
          )
        ),
        neighborhood:neighborhoods (
          id,
          slug,
          translations:neighborhood_translations!inner (
            name
          )
        )
      `)
      .eq('city_id', city.id)
      .eq('language.translations.locale_code', locale)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching language points:', error)
      throw new Error('Failed to fetch language points')
    }

    return data || []
  } catch (error) {
    console.error('Error in getLanguagePoints:', error)
    throw error
  }
}

/**
 * Retrieves a single language point by ID
 *
 * @async
 * @param citySlug - The slug of the city
 * @param pointId - The ID of the language point
 * @returns Promise<Object> Language point data
 * @throws {Error} If language point not found, database query fails, or parameters are invalid
 */
export async function getLanguagePoint(citySlug: string, pointId: string) {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string' || citySlug.trim() === '') {
    throw new Error('City slug is required and must be a non-empty string')
  }

  if (!pointId || typeof pointId !== 'string' || pointId.trim() === '') {
    throw new Error('Language point ID is required and must be a non-empty string')
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(pointId)) {
    throw new Error('Language point ID must be a valid UUID')
  }

  try {
    const supabase = getDatabaseClient(citySlug)

    const { data, error } = await supabase
      .from('language_points')
      .select(`
        id,
        language_id,
        neighborhood_id,
        latitude,
        longitude,
        postal_code,
        community_name,
        notes,
        language:languages (
          id,
          endonym
        ),
        neighborhood:neighborhoods (
          id,
          slug
        )
      `)
      .eq('id', pointId)
      .single()

    if (error) {
      console.error('Error fetching language point:', error)
      throw new Error('Language point not found')
    }

    return data
  } catch (error) {
    console.error('Error in getLanguagePoint:', error)
    throw error
  }
}

/**
 * Retrieves all languages for a city (for dropdown selection)
 *
 * @async
 * @param citySlug - The slug of the city
 * @param locale - The current locale for translations
 * @returns Promise<Array> Array of languages with translated names
 * @throws {Error} If database query fails or parameters are invalid
 */
export async function getLanguagesForPoints(citySlug: string, locale: string) {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string' || citySlug.trim() === '') {
    throw new Error('City slug is required and must be a non-empty string')
  }

  if (!locale || typeof locale !== 'string' || locale.trim() === '') {
    throw new Error('Locale is required and must be a non-empty string')
  }

  try {
    const supabase = getDatabaseClient(citySlug)

    // Get city ID
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .single()

    if (cityError || !city) {
      throw new Error(`City not found: ${citySlug}`)
    }

    // Get languages
    const { data, error } = await supabase
      .from('languages')
      .select(`
        id,
        endonym,
        translations:language_translations!inner (
          name
        )
      `)
      .eq('city_id', city.id)
      .eq('translations.locale_code', locale)
      .order('endonym', { ascending: true })

    if (error) {
      console.error('Error fetching languages:', error)
      throw new Error('Failed to fetch languages')
    }

    return data || []
  } catch (error) {
    console.error('Error in getLanguagesForPoints:', error)
    throw error
  }
}

/**
 * Retrieves all neighborhoods for a city (for dropdown selection)
 *
 * @async
 * @param citySlug - The slug of the city
 * @param locale - The current locale for translations
 * @returns Promise<Array> Array of neighborhoods with translated names
 * @throws {Error} If database query fails or parameters are invalid
 */
export async function getNeighborhoodsForPoints(citySlug: string, locale: string) {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string' || citySlug.trim() === '') {
    throw new Error('City slug is required and must be a non-empty string')
  }

  if (!locale || typeof locale !== 'string' || locale.trim() === '') {
    throw new Error('Locale is required and must be a non-empty string')
  }

  try {
    const supabase = getDatabaseClient(citySlug)

    // Get city ID
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .single()

    if (cityError || !city) {
      throw new Error(`City not found: ${citySlug}`)
    }

    // Get districts for the city
    const { data: districts, error: districtsError } = await supabase
      .from('districts')
      .select('id')
      .eq('city_id', city.id)

    if (districtsError) {
      console.error('Error fetching districts:', districtsError)
      throw new Error('Failed to fetch districts')
    }

    if (!districts || districts.length === 0) {
      return []
    }

    const districtIds = districts.map(d => d.id)

    // Get neighborhoods
    const { data, error } = await supabase
      .from('neighborhoods')
      .select(`
        id,
        slug,
        translations:neighborhood_translations!inner (
          name
        )
      `)
      .in('district_id', districtIds)
      .eq('translations.locale_code', locale)
      .order('slug', { ascending: true })

    if (error) {
      console.error('Error fetching neighborhoods:', error)
      throw new Error('Failed to fetch neighborhoods')
    }

    return data || []
  } catch (error) {
    console.error('Error in getNeighborhoodsForPoints:', error)
    throw error
  }
}

/**
 * Creates a new language point
 *
 * @async
 * @param citySlug - The slug of the city
 * @param formData - The language point data
 * @returns Promise<Object> Created language point
 * @throws {Error} If validation fails or database operation fails
 */
export async function createLanguagePoint(
  citySlug: string,
  formData: LanguagePointFormData
) {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string' || citySlug.trim() === '') {
    throw new Error('City slug is required and must be a non-empty string')
  }

  try {
    // Validate input
    const validatedData = LanguagePointSchema.parse(formData)

    const supabase = getDatabaseClient(citySlug)

    // Get city ID
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .single()

    if (cityError || !city) {
      throw new Error(`City not found: ${citySlug}`)
    }

    // Create language point with geom
    const { data, error } = await supabase
      .from('language_points')
      .insert({
        city_id: city.id,
        language_id: validatedData.language_id,
        neighborhood_id: validatedData.neighborhood_id,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        postal_code: validatedData.postal_code || null,
        community_name: validatedData.community_name || null,
        notes: validatedData.notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating language point:', error)
      throw new Error('Failed to create language point')
    }

    // Revalidate the language points list page
    revalidatePath(`/operator/${citySlug}/language-points`)

    return data
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0].message)
    }
    console.error('Error in createLanguagePoint:', error)
    throw error
  }
}

/**
 * Updates an existing language point
 *
 * @async
 * @param citySlug - The slug of the city
 * @param pointId - The ID of the language point to update
 * @param formData - The updated language point data
 * @returns Promise<Object> Updated language point
 * @throws {Error} If validation fails or database operation fails
 */
export async function updateLanguagePoint(
  citySlug: string,
  pointId: string,
  formData: LanguagePointFormData
) {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string' || citySlug.trim() === '') {
    throw new Error('City slug is required and must be a non-empty string')
  }

  if (!pointId || typeof pointId !== 'string' || pointId.trim() === '') {
    throw new Error('Language point ID is required and must be a non-empty string')
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(pointId)) {
    throw new Error('Language point ID must be a valid UUID')
  }

  try {
    // Validate input
    const validatedData = LanguagePointSchema.parse(formData)

    const supabase = getDatabaseClient(citySlug)

    // Update language point
    const { data, error } = await supabase
      .from('language_points')
      .update({
        language_id: validatedData.language_id,
        neighborhood_id: validatedData.neighborhood_id,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        postal_code: validatedData.postal_code || null,
        community_name: validatedData.community_name || null,
        notes: validatedData.notes || null,
      })
      .eq('id', pointId)
      .select()
      .single()

    if (error) {
      console.error('Error updating language point:', error)
      throw new Error('Failed to update language point')
    }

    // Revalidate both list and detail pages
    revalidatePath(`/operator/${citySlug}/language-points`)
    revalidatePath(`/operator/${citySlug}/language-points/${pointId}`)

    return data
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0].message)
    }
    console.error('Error in updateLanguagePoint:', error)
    throw error
  }
}

/**
 * Deletes a language point
 *
 * @async
 * @param citySlug - The slug of the city
 * @param pointId - The ID of the language point to delete
 * @returns Promise<void>
 * @throws {Error} If database operation fails or parameters are invalid
 */
export async function deleteLanguagePoint(citySlug: string, pointId: string) {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string' || citySlug.trim() === '') {
    throw new Error('City slug is required and must be a non-empty string')
  }

  if (!pointId || typeof pointId !== 'string' || pointId.trim() === '') {
    throw new Error('Language point ID is required and must be a non-empty string')
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(pointId)) {
    throw new Error('Language point ID must be a valid UUID')
  }

  try {
    const supabase = getDatabaseClient(citySlug)

    const { error } = await supabase
      .from('language_points')
      .delete()
      .eq('id', pointId)

    if (error) {
      console.error('Error deleting language point:', error)
      throw new Error('Failed to delete language point')
    }

    // Revalidate the language points list page
    revalidatePath(`/operator/${citySlug}/language-points`)
  } catch (error) {
    console.error('Error in deleteLanguagePoint:', error)
    throw error
  }
}
