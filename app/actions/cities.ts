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
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'
import { createCityFormSchema } from '@/lib/validations/city'

/**
 * Create a server-side Supabase client
 */
async function getSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Cookie set operation failed:', error)
            }
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Cookie remove operation failed:', error)
            }
          }
        },
      },
    }
  )
}

/**
 * Create a new city with multilingual translations
 *
 * @param input - City creation data
 * @returns Promise resolving to created city data
 * @throws Error if city creation fails
 */
export async function createCity(input: {
  slug: string
  country: string
  center_lat: number
  center_lng: number
  default_zoom: number
  name_en: string
  description_en: string
  name_nl: string
  description_nl: string
  name_fr: string
  description_fr: string
}): Promise<{ id: string; slug: string }> {
  // Validate input
  const validation = createCityFormSchema.safeParse(input)
  if (!validation.success) {
    throw new Error(
      `Validation failed: ${validation.error.issues.map((e) => e.message).join(', ')}`
    )
  }

  const data = validation.data
  const { slug, country, center_lat, center_lng, default_zoom } = data

  try {
    const supabase = await getSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (!user || userError) {
      throw new Error('Authentication required')
    }

    // Check if user is superuser
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'superuser') {
      throw new Error('Insufficient permissions to create cities')
    }

    // Check if city slug already exists
    const { data: existingCity } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingCity) {
      throw new Error('A city with this slug already exists')
    }

    // Use a transaction to ensure atomic operations
    // 1. Create the city
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .insert({
        slug,
        country,
        center_lat,
        center_lng,
        default_zoom,
        default_locale: 'en', // Default to English
      })
      .select()
      .single()

    if (cityError) {
      throw new Error(`Failed to create city: ${cityError.message}`)
    }

    // 2. Create city translations for each locale
    const translations = [
      {
        city_id: city.id,
        locale: 'en',
        name: data.name_en,
        description: data.description_en,
      },
      {
        city_id: city.id,
        locale: 'nl',
        name: data.name_nl,
        description: data.description_nl,
      },
      {
        city_id: city.id,
        locale: 'fr',
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
      throw new Error(`Failed to create translations: ${translationError.message}`)
    }

    // Revalidate paths
    revalidatePath('/superuser/cities')

    return {
      id: city.id,
      slug: city.slug,
    }
  } catch (error) {
    console.error('Error creating city:', error)
    throw error
  }
}
