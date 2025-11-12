/**
 * Description Translation Management Server Actions
 * ===================================================
 * Server-side actions for CRUD operations on description translation entities.
 *
 * Description translations allow the same description to be translated into
 * different UI locales (e.g., English text, Dutch text, French text).
 *
 * @module actions/description-translations
 */

'use server'

import { revalidatePath } from 'next/cache'
import { getServerSupabaseWithCookies } from '@/lib/supabase/server-client'
import { z } from 'zod'
import { sanitizeDescription, VALIDATION_LIMITS } from '@/lib/sanitization'

/**
 * Validation schema for description translation update/creation
 */
const descriptionTranslationSchema = z.object({
  locale: z.string()
    .min(2, 'Locale code must be at least 2 characters')
    .max(5, 'Locale code must not exceed 5 characters')
    .regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Invalid locale code format (e.g., "en", "en-US")'),
  text: z.string()
    .min(1, 'Description text is required')
    .max(VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH, `Description text must not exceed ${VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} characters`),
})

/**
 * Type for description translation form input
 */
export type DescriptionTranslationInput = z.infer<typeof descriptionTranslationSchema>

/**
 * Description translation structure returned by server actions
 */
export type DescriptionTranslation = {
  description_id: string
  locale: string
  text: string
  is_ai_translated: boolean
  ai_model: string | null
  ai_translated_at: string | null
  reviewed_by: string | null
  reviewed_at: string | null
}

/**
 * Get all translations for a specific description
 *
 * @async
 * @param citySlug - The city identifier
 * @param descriptionId - The description UUID
 * @returns Promise containing array of translations
 * @throws {Error} If parameters are invalid or query fails
 */
export async function getDescriptionTranslations(
  citySlug: string,
  descriptionId: string
): Promise<DescriptionTranslation[]> {
  try {
    // Input validation
    if (!citySlug || typeof citySlug !== 'string') {
      throw new Error('City slug is required')
    }

    if (!citySlug.match(/^[a-z0-9-]+$/)) {
      throw new Error(`Invalid city slug format: "${citySlug}"`)
    }

    if (!descriptionId || !descriptionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('Invalid description ID format')
    }

    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Authentication check
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Verify the description exists and user has access
    const { data: description, error: descriptionError } = await supabase
      .from('descriptions')
      .select('id, city_id')
      .eq('id', descriptionId)
      .single()

    if (descriptionError || !description) {
      console.error('Error fetching description:', {
        descriptionId,
        error: descriptionError,
        timestamp: new Date().toISOString(),
      })
      throw new Error('Description not found or access denied')
    }

    // Fetch all translations for this description
    const { data: translations, error: translationsError } = await supabase
      .from('description_translations')
      .select('*')
      .eq('description_id', descriptionId)
      .order('locale', { ascending: true })

    if (translationsError) {
      console.error('Error fetching description translations:', {
        descriptionId,
        error: translationsError,
        errorCode: translationsError.code,
        errorMessage: translationsError.message,
        timestamp: new Date().toISOString(),
      })
      throw new Error('Failed to fetch translations. Please try again or contact support.')
    }

    return translations ?? []
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching description translations')
  }
}

/**
 * Update or create a description translation for a specific locale
 *
 * If a translation for the given locale already exists, it will be updated.
 * Otherwise, a new translation will be created.
 *
 * @async
 * @param citySlug - The city identifier
 * @param descriptionId - The description UUID
 * @param formData - The translation form data
 * @returns Promise containing the updated or created translation
 * @throws {Error} If validation fails or operation fails
 */
export async function upsertDescriptionTranslation(
  citySlug: string,
  descriptionId: string,
  formData: DescriptionTranslationInput
): Promise<DescriptionTranslation> {
  try {
    // Input validation
    if (!citySlug || typeof citySlug !== 'string') {
      throw new Error('City slug is required')
    }

    if (!citySlug.match(/^[a-z0-9-]+$/)) {
      throw new Error('Invalid city slug format')
    }

    if (!descriptionId || !descriptionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('Invalid description ID format')
    }

    // Validate data against schema
    const validatedData = descriptionTranslationSchema.parse(formData)

    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Authentication check
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Verify the description exists and user has access
    const { data: description, error: descriptionError } = await supabase
      .from('descriptions')
      .select('id, city_id')
      .eq('id', descriptionId)
      .single()

    if (descriptionError || !description) {
      throw new Error('Description not found or access denied')
    }

    // Verify the locale exists
    const { data: locale, error: localeError } = await supabase
      .from('locales')
      .select('code')
      .eq('code', validatedData.locale)
      .single()

    if (localeError || !locale) {
      throw new Error(`Locale "${validatedData.locale}" not found`)
    }

    // Sanitize input using specialized description sanitization
    // This function preserves line breaks while removing dangerous content
    const sanitizedText = sanitizeDescription(validatedData.text)

    // Check if translation already exists to determine create vs. update path
    // We use upsert pattern (check-then-insert/update) instead of Supabase's
    // native upsert because we want to preserve AI metadata on existing records
    // and avoid unintentionally overwriting AI-generated flags with user edits
    const { data: existingTranslation } = await supabase
      .from('description_translations')
      .select('description_id, locale')
      .eq('description_id', descriptionId)
      .eq('locale', validatedData.locale)
      .maybeSingle()

    let translation

    if (existingTranslation) {
      // Update existing translation
      const { data: updatedTranslation, error: updateError } = await supabase
        .from('description_translations')
        .update({
          text: sanitizedText,
          // If the translation was AI-generated and user is now editing it,
          // we keep the AI flag but could add a "manually_reviewed" flag in future
        })
        .eq('description_id', descriptionId)
        .eq('locale', validatedData.locale)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating description translation:', {
          descriptionId,
          locale: validatedData.locale,
          error: updateError,
          timestamp: new Date().toISOString(),
        })
        throw new Error('Failed to update translation. Please try again or contact support.')
      }

      if (!updatedTranslation) {
        console.error('No data returned from translation update:', {
          descriptionId,
          locale: validatedData.locale,
          timestamp: new Date().toISOString(),
        })
        throw new Error('No data returned from translation update. Please try again.')
      }

      translation = updatedTranslation
    } else {
      // Create new translation
      const { data: newTranslation, error: createError } = await supabase
        .from('description_translations')
        .insert({
          description_id: descriptionId,
          locale: validatedData.locale,
          text: sanitizedText,
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating description translation:', {
          descriptionId,
          locale: validatedData.locale,
          error: createError,
          timestamp: new Date().toISOString(),
        })
        throw new Error('Failed to create translation. Please try again or contact support.')
      }

      if (!newTranslation) {
        console.error('No data returned from translation creation:', {
          descriptionId,
          locale: validatedData.locale,
          timestamp: new Date().toISOString(),
        })
        throw new Error('No data returned from translation creation. Please try again.')
      }

      translation = newTranslation
    }

    // Revalidate related pages
    revalidatePath(`/[locale]/operator/${citySlug}/descriptions`)
    revalidatePath(`/[locale]/operator/${citySlug}/descriptions/${descriptionId}`)
    revalidatePath(`/[locale]/operator/${citySlug}/descriptions/${descriptionId}/translations`)

    return translation
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
    throw new Error('An unexpected error occurred while saving description translation')
  }
}

/**
 * Delete a description translation
 *
 * @async
 * @param citySlug - The city identifier
 * @param descriptionId - The description UUID
 * @param locale - The locale code to delete
 * @returns Promise<void>
 * @throws {Error} If parameters are invalid or deletion fails
 */
export async function deleteDescriptionTranslation(
  citySlug: string,
  descriptionId: string,
  locale: string
): Promise<void> {
  try {
    // Input validation
    if (!citySlug || typeof citySlug !== 'string') {
      throw new Error('City slug is required')
    }

    if (!citySlug.match(/^[a-z0-9-]+$/)) {
      throw new Error('Invalid city slug format')
    }

    if (!descriptionId || !descriptionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('Invalid description ID format')
    }

    if (!locale || typeof locale !== 'string') {
      throw new Error('Locale code is required')
    }

    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Authentication check
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Verify the description exists and user has access
    const { data: description, error: descriptionError } = await supabase
      .from('descriptions')
      .select('id, city_id')
      .eq('id', descriptionId)
      .single()

    if (descriptionError || !description) {
      throw new Error('Description not found or access denied')
    }

    const { error: deleteError } = await supabase
      .from('description_translations')
      .delete()
      .eq('description_id', descriptionId)
      .eq('locale', locale)

    if (deleteError) {
      console.error('Error deleting description translation:', {
        descriptionId,
        locale,
        error: deleteError,
        errorCode: deleteError.code,
        errorMessage: deleteError.message,
        timestamp: new Date().toISOString(),
      })
      throw new Error('Failed to delete translation. Please try again or contact support.')
    }

    // Revalidate related pages
    revalidatePath(`/[locale]/operator/${citySlug}/descriptions`)
    revalidatePath(`/[locale]/operator/${citySlug}/descriptions/${descriptionId}`)
    revalidatePath(`/[locale]/operator/${citySlug}/descriptions/${descriptionId}/translations`)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while deleting description translation')
  }
}

/**
 * Get available locales for translation
 *
 * Returns all locales that are available in the system.
 *
 * @async
 * @param citySlug - The city identifier
 * @returns Promise containing array of available locales
 * @throws {Error} If query fails
 */
export async function getAvailableLocales(citySlug: string): Promise<Array<{ code: string; native_name: string }>> {
  try {
    // Input validation
    if (!citySlug || typeof citySlug !== 'string') {
      throw new Error('City slug is required')
    }

    if (!citySlug.match(/^[a-z0-9-]+$/)) {
      throw new Error('Invalid city slug format')
    }

    const supabase = await getServerSupabaseWithCookies(citySlug)

    const { data: locales, error: localesError } = await supabase
      .from('locales')
      .select('code, native_name')
      .order('code', { ascending: true })

    if (localesError) {
      console.error('Error fetching locales:', {
        error: localesError,
        errorCode: localesError.code,
        errorMessage: localesError.message,
        timestamp: new Date().toISOString(),
      })
      throw new Error('Failed to fetch available languages. Please try again or contact support.')
    }

    return locales ?? []
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching available locales')
  }
}
