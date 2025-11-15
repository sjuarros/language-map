/**
 * Server actions for AI sources CRUD operations
 * Handles creation, reading, updating, and deletion of AI sources (whitelist/blacklist)
 * for AI description generation per city.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getServerSupabaseWithCookies } from '@/lib/supabase/server-client'

/**
 * Type definitions for database query results
 */
interface RawAISource {
  id: string
  city_id: string
  url: string
  list_type: 'whitelist' | 'blacklist'
  notes: string | null
  created_at: string
  created_by: string | null
}

/**
 * Validation schema for AI source form data
 */
const AISourceSchema = z.object({
  url: z
    .string()
    .min(1, 'URL is required')
    .max(500, 'URL must be less than 500 characters')
    .refine(
      (url) => {
        // Business requirement: Accept both bare domains (wikipedia.org) and full URLs
        // (https://en.wikipedia.org) to allow flexible whitelisting/blacklisting.
        // Bare domains match all subdomains, while full URLs are exact matches.
        const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
        const urlPattern = /^https?:\/\//
        return domainPattern.test(url) || urlPattern.test(url)
      },
      { message: 'Please enter a valid domain or URL (e.g., wikipedia.org or https://example.com)' }
    ),
  list_type: z.enum(['whitelist', 'blacklist'], {
    message: 'List type must be whitelist or blacklist',
  }),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .nullable()
    .optional(),
})

export type AISourceFormData = z.infer<typeof AISourceSchema>

/**
 * Retrieves all AI sources for a city
 *
 * @async
 * @param citySlug - The slug of the city
 * @returns Promise<Array> Array of AI sources for the city
 * @throws {Error} If citySlug is invalid, empty, or not a string
 * @throws {Error} If city is not found in the database
 * @throws {Error} If database query fails
 * @example
 * const sources = await getAISources('amsterdam');
 */
export async function getAISources(citySlug: string): Promise<RawAISource[]> {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string' || citySlug.trim() === '') {
    throw new Error('City slug is required and must be a non-empty string')
  }

  try {
    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Get the city ID first
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .single()

    if (cityError) {
      console.error('Error fetching city:', {
        citySlug,
        error: cityError.message,
        code: cityError.code,
      })
      throw new Error(`Failed to fetch city: ${cityError.message}`)
    }

    if (!city) {
      throw new Error(`City not found: ${citySlug}`)
    }

    // Fetch all AI sources for the city
    const { data, error } = await supabase
      .from('ai_sources')
      .select('*')
      .eq('city_id', city.id)
      .order('list_type', { ascending: true })
      .order('url', { ascending: true })

    if (error) {
      console.error('Error fetching AI sources:', error)
      throw new Error(`Failed to fetch AI sources: ${error.message}`)
    }

    return data as RawAISource[]
  } catch (error) {
    console.error('Error in getAISources:', error)
    throw error instanceof Error ? error : new Error('Unknown error occurred while fetching AI sources')
  }
}

/**
 * Retrieves a single AI source by ID
 *
 * @async
 * @param citySlug - The slug of the city
 * @param id - The UUID of the AI source
 * @returns Promise<RawAISource> The AI source data
 * @throws {Error} If database query fails, AI source not found, or parameters are invalid
 */
export async function getAISource(citySlug: string, id: string): Promise<RawAISource> {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string' || citySlug.trim() === '') {
    throw new Error('City slug is required and must be a non-empty string')
  }

  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('AI source ID is required and must be a non-empty string')
  }

  // Validate UUID format
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidPattern.test(id)) {
    throw new Error('Invalid AI source ID format')
  }

  try {
    const supabase = await getServerSupabaseWithCookies(citySlug)

    const { data, error } = await supabase
      .from('ai_sources')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching AI source:', error)
      throw new Error(`Failed to fetch AI source: ${error.message}`)
    }

    if (!data) {
      throw new Error('AI source not found')
    }

    return data as RawAISource
  } catch (error) {
    console.error('Error in getAISource:', error)
    throw error instanceof Error ? error : new Error('Unknown error occurred while fetching AI source')
  }
}

/**
 * Creates a new AI source for a city
 *
 * @async
 * @param citySlug - The slug of the city
 * @param formData - The AI source form data
 * @returns Promise<RawAISource> The created AI source
 * @throws {Error} If validation fails, database operation fails, or user is not authenticated
 */
export async function createAISource(
  citySlug: string,
  formData: AISourceFormData
): Promise<RawAISource> {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string' || citySlug.trim() === '') {
    throw new Error('City slug is required and must be a non-empty string')
  }

  // Validate form data with Zod schema
  const validationResult = AISourceSchema.safeParse(formData)
  if (!validationResult.success) {
    const errors = validationResult.error.issues.map((e: { message: string }) => e.message).join(', ')
    throw new Error(`Validation failed: ${errors}`)
  }

  const validatedData = validationResult.data

  try {
    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('User must be authenticated to create AI sources')
    }

    // Get the city ID
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .single()

    if (cityError) {
      console.error('Error fetching city:', {
        citySlug,
        error: cityError.message,
        code: cityError.code,
      })
      throw new Error(`Failed to fetch city: ${cityError.message}`)
    }

    if (!city) {
      throw new Error(`City not found: ${citySlug}`)
    }

    // Normalize URL to prevent duplicate entries with different casing or trailing slashes
    // (e.g., "Wikipedia.org/" and "wikipedia.org" should be treated as the same source)
    // Lowercase ensures case-insensitive matching; trailing slash removal handles common URL variations
    const normalizedUrl = validatedData.url.toLowerCase().replace(/\/+$/, '')

    // Create the AI source
    const { data, error } = await supabase
      .from('ai_sources')
      .insert({
        city_id: city.id,
        url: normalizedUrl,
        list_type: validatedData.list_type,
        notes: validatedData.notes || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating AI source:', error)

      // Handle unique constraint violation
      if (error.code === '23505') {
        throw new Error(`This URL is already in the ${validatedData.list_type} for this city`)
      }

      throw new Error(`Failed to create AI source: ${error.message}`)
    }

    // Revalidate the AI sources list page
    revalidatePath(`/[locale]/operator/${citySlug}/ai-sources`)

    return data as RawAISource
  } catch (error) {
    console.error('Error in createAISource:', error)
    throw error instanceof Error ? error : new Error('Unknown error occurred while creating AI source')
  }
}

/**
 * Updates an existing AI source
 *
 * @async
 * @param citySlug - The slug of the city
 * @param id - The UUID of the AI source to update
 * @param formData - The updated AI source form data
 * @returns Promise<RawAISource> The updated AI source
 * @throws {Error} If validation fails, database operation fails, or user is not authenticated
 */
export async function updateAISource(
  citySlug: string,
  id: string,
  formData: AISourceFormData
): Promise<RawAISource> {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string' || citySlug.trim() === '') {
    throw new Error('City slug is required and must be a non-empty string')
  }

  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('AI source ID is required and must be a non-empty string')
  }

  // Validate UUID format
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidPattern.test(id)) {
    throw new Error('Invalid AI source ID format')
  }

  // Validate form data with Zod schema
  const validationResult = AISourceSchema.safeParse(formData)
  if (!validationResult.success) {
    const errors = validationResult.error.issues.map((e: { message: string }) => e.message).join(', ')
    throw new Error(`Validation failed: ${errors}`)
  }

  const validatedData = validationResult.data

  try {
    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('User must be authenticated to update AI sources')
    }

    // Normalize URL
    const normalizedUrl = validatedData.url.toLowerCase().replace(/\/+$/, '')

    // Update the AI source
    const { data, error } = await supabase
      .from('ai_sources')
      .update({
        url: normalizedUrl,
        list_type: validatedData.list_type,
        notes: validatedData.notes || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating AI source:', error)

      // Handle unique constraint violation
      if (error.code === '23505') {
        throw new Error(`This URL is already in the ${validatedData.list_type} for this city`)
      }

      throw new Error(`Failed to update AI source: ${error.message}`)
    }

    if (!data) {
      throw new Error('AI source not found or you do not have permission to update it')
    }

    // Revalidate the AI sources pages
    revalidatePath(`/[locale]/operator/${citySlug}/ai-sources`)
    revalidatePath(`/[locale]/operator/${citySlug}/ai-sources/${id}`)

    return data as RawAISource
  } catch (error) {
    console.error('Error in updateAISource:', error)
    throw error instanceof Error ? error : new Error('Unknown error occurred while updating AI source')
  }
}

/**
 * Deletes an AI source
 *
 * @async
 * @param citySlug - The slug of the city
 * @param id - The UUID of the AI source to delete
 * @returns Promise<void>
 * @throws {Error} If database operation fails, AI source not found, or user is not authenticated
 */
export async function deleteAISource(citySlug: string, id: string): Promise<void> {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string' || citySlug.trim() === '') {
    throw new Error('City slug is required and must be a non-empty string')
  }

  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('AI source ID is required and must be a non-empty string')
  }

  // Validate UUID format
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidPattern.test(id)) {
    throw new Error('Invalid AI source ID format')
  }

  try {
    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('User must be authenticated to delete AI sources')
    }

    // Delete the AI source
    const { error } = await supabase
      .from('ai_sources')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting AI source:', error)
      throw new Error(`Failed to delete AI source: ${error.message}`)
    }

    // Revalidate the AI sources list page
    revalidatePath(`/[locale]/operator/${citySlug}/ai-sources`)
  } catch (error) {
    console.error('Error in deleteAISource:', error)
    throw error instanceof Error ? error : new Error('Unknown error occurred while deleting AI source')
  }
}
