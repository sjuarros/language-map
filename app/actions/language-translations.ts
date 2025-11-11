/**
 * Language Translation Management Server Actions
 * ===============================================
 * Server-side actions for CRUD operations on language translation entities.
 *
 * Language translations allow the same language to have different names in different
 * UI locales (e.g., "English" in English, "Engels" in Dutch, "Anglais" in French).
 *
 * IMPORTANT: The endonym field (native language name) is NOT translated and lives
 * in the languages table directly. This module manages only UI locale translations.
 *
 * @module actions/language-translations
 */

'use server'

import { revalidatePath } from 'next/cache'
import { getServerSupabaseWithCookies } from '@/lib/supabase/server-client'
import { z } from 'zod'
import { sanitizeText, VALIDATION_LIMITS } from '@/lib/sanitization'

/**
 * Validation schema for language translation update/creation
 */
const languageTranslationSchema = z.object({
  locale_code: z.string()
    .min(2, 'Locale code must be at least 2 characters')
    .max(5, 'Locale code must not exceed 5 characters')
    .regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Invalid locale code format (e.g., "en", "en-US")'),
  name: z.string()
    .min(1, 'Translation name is required')
    .max(VALIDATION_LIMITS.NAME_MAX_LENGTH, `Translation name must not exceed ${VALIDATION_LIMITS.NAME_MAX_LENGTH} characters`),
})

/**
 * Type for language translation form input
 */
export type LanguageTranslationInput = z.infer<typeof languageTranslationSchema>

/**
 * Language translation structure returned by server actions
 */
export type LanguageTranslation = {
  id: string
  language_id: string
  locale_code: string
  name: string
  is_ai_translated: boolean
  ai_model: string | null
  ai_translated_at: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Get all translations for a specific language
 *
 * @async
 * @param citySlug - The city identifier
 * @param languageId - The language UUID
 * @returns Promise containing array of translations
 * @throws {Error} If parameters are invalid or query fails
 */
export async function getLanguageTranslations(
  citySlug: string,
  languageId: string
): Promise<LanguageTranslation[]> {
  try {
    // Input validation
    if (!citySlug || typeof citySlug !== 'string') {
      throw new Error('City slug is required')
    }

    if (!citySlug.match(/^[a-z0-9-]+$/)) {
      throw new Error(`Invalid city slug format: "${citySlug}"`)
    }

    if (!languageId || !languageId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('Invalid language ID format')
    }

    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Authentication check
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Verify the language exists and user has access
    const { data: language, error: languageError } = await supabase
      .from('languages')
      .select('id, city_id')
      .eq('id', languageId)
      .single()

    if (languageError || !language) {
      console.error('Error fetching language:', {
        languageId,
        error: languageError,
        timestamp: new Date().toISOString(),
      })
      throw new Error('Language not found or access denied')
    }

    // Fetch all translations for this language
    const { data: translations, error: translationsError } = await supabase
      .from('language_translations')
      .select('*')
      .eq('language_id', languageId)
      .order('locale_code', { ascending: true })

    if (translationsError) {
      console.error('Error fetching language translations:', {
        languageId,
        error: translationsError,
        timestamp: new Date().toISOString(),
      })
      throw new Error(`Failed to fetch translations: ${translationsError.message}`)
    }

    return translations ?? []
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching language translations')
  }
}

/**
 * Update or create a language translation for a specific locale
 *
 * If a translation for the given locale already exists, it will be updated.
 * Otherwise, a new translation will be created.
 *
 * @async
 * @param citySlug - The city identifier
 * @param languageId - The language UUID
 * @param formData - The translation form data
 * @returns Promise containing the updated or created translation
 * @throws {Error} If validation fails or operation fails
 */
export async function upsertLanguageTranslation(
  citySlug: string,
  languageId: string,
  formData: LanguageTranslationInput
): Promise<LanguageTranslation> {
  try {
    // Input validation
    if (!citySlug || typeof citySlug !== 'string') {
      throw new Error('City slug is required')
    }

    if (!citySlug.match(/^[a-z0-9-]+$/)) {
      throw new Error('Invalid city slug format')
    }

    if (!languageId || !languageId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('Invalid language ID format')
    }

    // Validate data against schema
    const validatedData = languageTranslationSchema.parse(formData)

    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Authentication check
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Verify the language exists and user has access
    const { data: language, error: languageError } = await supabase
      .from('languages')
      .select('id, city_id')
      .eq('id', languageId)
      .single()

    if (languageError || !language) {
      throw new Error('Language not found or access denied')
    }

    // Verify the locale exists
    const { data: locale, error: localeError } = await supabase
      .from('locales')
      .select('code')
      .eq('code', validatedData.locale_code)
      .single()

    if (localeError || !locale) {
      throw new Error(`Locale "${validatedData.locale_code}" not found`)
    }

    // Sanitize input
    const sanitizedName = sanitizeText(validatedData.name, VALIDATION_LIMITS.NAME_MAX_LENGTH)

    // Check if translation already exists
    const { data: existingTranslation } = await supabase
      .from('language_translations')
      .select('id')
      .eq('language_id', languageId)
      .eq('locale_code', validatedData.locale_code)
      .maybeSingle()

    let translation

    if (existingTranslation) {
      // Update existing translation
      const { data: updatedTranslation, error: updateError } = await supabase
        .from('language_translations')
        .update({
          name: sanitizedName,
          // If the translation was AI-generated and user is now editing it,
          // we keep the AI flag but could add a "manually_reviewed" flag in future
        })
        .eq('id', existingTranslation.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating language translation:', {
          languageId,
          localeCode: validatedData.locale_code,
          error: updateError,
          timestamp: new Date().toISOString(),
        })
        throw new Error(`Failed to update translation: ${updateError.message}`)
      }

      translation = updatedTranslation
    } else {
      // Create new translation
      const { data: newTranslation, error: createError } = await supabase
        .from('language_translations')
        .insert({
          language_id: languageId,
          locale_code: validatedData.locale_code,
          name: sanitizedName,
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating language translation:', {
          languageId,
          localeCode: validatedData.locale_code,
          error: createError,
          timestamp: new Date().toISOString(),
        })
        throw new Error(`Failed to create translation: ${createError.message}`)
      }

      translation = newTranslation
    }

    // Revalidate related pages
    revalidatePath(`/[locale]/operator/${citySlug}/languages`)
    revalidatePath(`/[locale]/operator/${citySlug}/languages/${languageId}`)
    revalidatePath(`/[locale]/operator/${citySlug}/languages/${languageId}/translations`)

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
    throw new Error('An unexpected error occurred while saving language translation')
  }
}

/**
 * Delete a language translation
 *
 * @async
 * @param citySlug - The city identifier
 * @param languageId - The language UUID
 * @param localeCode - The locale code to delete
 * @returns Promise<void>
 * @throws {Error} If parameters are invalid or deletion fails
 */
export async function deleteLanguageTranslation(
  citySlug: string,
  languageId: string,
  localeCode: string
): Promise<void> {
  try {
    // Input validation
    if (!citySlug || typeof citySlug !== 'string') {
      throw new Error('City slug is required')
    }

    if (!citySlug.match(/^[a-z0-9-]+$/)) {
      throw new Error('Invalid city slug format')
    }

    if (!languageId || !languageId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('Invalid language ID format')
    }

    if (!localeCode || typeof localeCode !== 'string') {
      throw new Error('Locale code is required')
    }

    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Authentication check
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Verify the language exists and user has access
    const { data: language, error: languageError } = await supabase
      .from('languages')
      .select('id, city_id')
      .eq('id', languageId)
      .single()

    if (languageError || !language) {
      throw new Error('Language not found or access denied')
    }

    const { error: deleteError } = await supabase
      .from('language_translations')
      .delete()
      .eq('language_id', languageId)
      .eq('locale_code', localeCode)

    if (deleteError) {
      console.error('Error deleting language translation:', {
        languageId,
        localeCode,
        error: deleteError,
        timestamp: new Date().toISOString(),
      })
      throw new Error(`Failed to delete translation: ${deleteError.message}`)
    }

    // Revalidate related pages
    revalidatePath(`/[locale]/operator/${citySlug}/languages`)
    revalidatePath(`/[locale]/operator/${citySlug}/languages/${languageId}`)
    revalidatePath(`/[locale]/operator/${citySlug}/languages/${languageId}/translations`)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while deleting language translation')
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
        timestamp: new Date().toISOString(),
      })
      throw new Error(`Failed to fetch locales: ${localesError.message}`)
    }

    return locales ?? []
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching available locales')
  }
}
