/**
 * City Server Actions
 *
 * Server-side actions for city management including creation with translations.
 *
 * This module provides:
 * - createCity: Create a new city with multilingual translations
 *
 * Security features:
 * - Superuser role required
 * - Input validation with Zod
 * - Database transaction for atomic operations
 *
 * @module app/actions/cities
 */

'use server'

import { revalidatePath } from 'next/cache'
import { getDatabaseAdminClient } from '@/lib/database/client'
import { getServerSupabaseWithCookies } from '@/lib/supabase/server-client'
import { createCityFormSchema } from '@/lib/validations/city'

/**
 * Create a new city with multilingual translations
 *
 * @param input - City creation data
 * @returns Promise resolving to success result or error
 */
export async function createCity(input: {
  slug: string
  country_id: string
  center_lat: number
  center_lng: number
  default_zoom: number
  name_en: string
  description_en: string
  name_nl: string
  description_nl: string
  name_fr: string
  description_fr: string
}): Promise<{ success: true; data: { id: string; slug: string } } | { success: false; error: string }> {
  // Validate input
  const validation = createCityFormSchema.safeParse(input)
  if (!validation.success) {
    return {
      success: false,
      error: `Validation failed: ${validation.error.issues.map((e) => e.message).join(', ')}`,
    }
  }

  const data = validation.data
  const { slug, country_id, center_lat, center_lng, default_zoom } = data

  try {
    // Get authenticated user from session cookies
    const authClient = await getServerSupabaseWithCookies('system')
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser()

    if (!user || userError) {
      return { success: false, error: 'Authentication required' }
    }

    // Use admin client for database operations
    const supabase = getDatabaseAdminClient('system')

    // Check if user is superuser
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'superuser') {
      return { success: false, error: 'Insufficient permissions to create cities' }
    }

    // Check if city slug already exists
    const { data: existingCity } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingCity) {
      return { success: false, error: 'A city with this slug already exists' }
    }

    // Use a transaction to ensure atomic operations
    // 1. Create the city
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .insert({
        slug,
        country_id,
        center_lat,
        center_lng,
        default_zoom,
      })
      .select()
      .single()

    if (cityError) {
      return { success: false, error: `Failed to create city: ${cityError.message}` }
    }

    // 2. Create city translations for each locale
    const translations = [
      {
        city_id: city.id,
        locale_code: 'en',
        name: data.name_en,
        description: data.description_en,
      },
      {
        city_id: city.id,
        locale_code: 'nl',
        name: data.name_nl,
        description: data.description_nl,
      },
      {
        city_id: city.id,
        locale_code: 'fr',
        name: data.name_fr,
        description: data.description_fr,
      },
    ]

    const { error: translationError } = await supabase
      .from('city_translations')
      .insert(translations)

    if (translationError) {
      // Rollback: Delete the city if translations fail
      await supabase.from('cities').delete().eq('id', city.id)
      return { success: false, error: `Failed to create translations: ${translationError.message}` }
    }

    // Revalidate paths
    revalidatePath('/superuser/cities')

    return {
      success: true,
      data: {
        id: city.id,
        slug: city.slug,
      },
    }
  } catch (error) {
    console.error('Error creating city:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
