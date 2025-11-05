/**
 * District Management Server Actions
 * ==================================
 * Server-side actions for CRUD operations on district entities with translations.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { getServerSupabaseWithCookies } from '@/lib/supabase/server-client'
import { z } from 'zod'

/**
 * Validation schema for district creation/update
 */
const districtSchema = z.object({
  cityId: z.string().uuid(),
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
 * Type for district form input
 */
export type DistrictInput = z.infer<typeof districtSchema>

/**
 * Get districts for a city with translations
 *
 * @async
 * @param citySlug - The city identifier
 * @returns Promise containing array of districts
 */
export async function getDistricts(citySlug: string) {
  try {
    // Input validation
    if (!citySlug || typeof citySlug !== 'string') {
      throw new Error('City slug is required')
    }

    if (!citySlug.match(/^[a-z0-9-]+$/)) {
      throw new Error('Invalid city slug format')
    }

    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Get city by slug
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .single()

    if (cityError) {
      console.error('Error fetching city:', cityError)
      throw new Error(`Failed to fetch city: ${cityError.message}`)
    }

    if (!city) {
      throw new Error(`City '${citySlug}' not found`)
    }

    // Get districts with translations
    const { data: districts, error: districtsError } = await supabase
      .from('districts')
      .select(`
        id,
        city_id,
        slug,
        created_at,
        updated_at,
        translations:district_translations (
          id,
          locale_code,
          name,
          description
        )
      `)
      .eq('city_id', city.id)
      .order('created_at', { ascending: true })

    if (districtsError) {
      console.error('Error fetching districts:', districtsError)
      throw new Error(`Failed to fetch districts: ${districtsError.message}`)
    }

    return districts
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching districts')
  }
}

/**
 * Get a single district by ID
 *
 * @async
 * @param citySlug - The city identifier
 * @param districtId - The district identifier
 * @returns Promise containing district data
 */
export async function getDistrict(citySlug: string, districtId: string) {
  try {
    // Input validation
    if (!citySlug || typeof citySlug !== 'string') {
      throw new Error('City slug is required')
    }

    if (!districtId || typeof districtId !== 'string') {
      throw new Error('District ID is required')
    }

    // Validate UUID format for district ID
    if (!districtId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('Invalid district ID format')
    }

    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Get city by slug
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .single()

    if (cityError) {
      console.error('Error fetching city:', cityError)
      throw new Error(`Failed to fetch city: ${cityError.message}`)
    }

    if (!city) {
      throw new Error(`City '${citySlug}' not found`)
    }

    // Get district with translations
    const { data: district, error: districtError } = await supabase
      .from('districts')
      .select(`
        id,
        city_id,
        slug,
        created_at,
        updated_at,
        translations:district_translations (
          id,
          locale_code,
          name,
          description
        )
      `)
      .eq('city_id', city.id)
      .eq('id', districtId)
      .single()

    if (districtError) {
      console.error('Error fetching district:', districtError)
      throw new Error(`Failed to fetch district: ${districtError.message}`)
    }

    if (!district) {
      throw new Error(`District not found`)
    }

    return district
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching district')
  }
}

/**
 * Create a new district with translations
 *
 * @async
 * @param citySlug - The city identifier
 * @param input - District input data
 * @returns Promise containing created district
 */
export async function createDistrict(citySlug: string, input: DistrictInput) {
  const validatedInput = districtSchema.parse(input)

  const supabase = await getServerSupabaseWithCookies(citySlug)

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify user has access to this city
  const { data: cityAccess } = await supabase
    .from('city_users')
    .select('city_id')
    .eq('user_id', user.id)
    .eq('city_id', validatedInput.cityId)
    .single()

  if (!cityAccess) {
    throw new Error('Insufficient permissions')
  }

  // Create district with transaction
  const { data: district, error: districtError } = await supabase
    .from('districts')
    .insert({
      city_id: validatedInput.cityId,
      slug: validatedInput.slug,
    })
    .select()
    .single()

  if (districtError) {
    console.error('Error creating district:', districtError)
    throw new Error('Failed to create district')
  }

  // Insert translations
  const translations = []

  // English translation (required)
  if (validatedInput.name_en) {
    translations.push({
      district_id: district.id,
      locale_code: 'en',
      name: validatedInput.name_en,
      description: validatedInput.description_en || null,
    })
  }

  // Dutch translation (optional)
  if (validatedInput.name_nl) {
    translations.push({
      district_id: district.id,
      locale_code: 'nl',
      name: validatedInput.name_nl,
      description: validatedInput.description_nl || null,
    })
  }

  // French translation (optional)
  if (validatedInput.name_fr) {
    translations.push({
      district_id: district.id,
      locale_code: 'fr',
      name: validatedInput.name_fr,
      description: validatedInput.description_fr || null,
    })
  }

  if (translations.length > 0) {
    const { error: translationError } = await supabase
      .from('district_translations')
      .insert(translations)

    if (translationError) {
      console.error('Error creating translations:', translationError)
      // Rollback district creation
      await supabase.from('districts').delete().eq('id', district.id)
      throw new Error('Failed to create translations')
    }
  }

  revalidatePath(`/${citySlug}/operator/districts`)
  return district
}

/**
 * Update an existing district with translations
 *
 * @async
 * @param citySlug - The city identifier
 * @param districtId - The district identifier
 * @param input - District input data
 * @returns Promise containing success status
 */
export async function updateDistrict(
  citySlug: string,
  districtId: string,
  input: DistrictInput
) {
  const validatedInput = districtSchema.parse(input)

  const supabase = await getServerSupabaseWithCookies(citySlug)

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify user has access to this city
  const { data: cityAccess } = await supabase
    .from('city_users')
    .select('city_id')
    .eq('user_id', user.id)
    .eq('city_id', validatedInput.cityId)
    .single()

  if (!cityAccess) {
    throw new Error('Insufficient permissions')
  }

  // Update district
  const { error: districtError } = await supabase
    .from('districts')
    .update({
      slug: validatedInput.slug,
    })
    .eq('id', districtId)

  if (districtError) {
    console.error('Error updating district:', districtError)
    throw new Error('Failed to update district')
  }

  // Delete existing translations
  await supabase
    .from('district_translations')
    .delete()
    .eq('district_id', districtId)

  // Insert updated translations
  const translations = []

  // English translation (required)
  if (validatedInput.name_en) {
    translations.push({
      district_id: districtId,
      locale_code: 'en',
      name: validatedInput.name_en,
      description: validatedInput.description_en || null,
    })
  }

  // Dutch translation (optional)
  if (validatedInput.name_nl) {
    translations.push({
      district_id: districtId,
      locale_code: 'nl',
      name: validatedInput.name_nl,
      description: validatedInput.description_nl || null,
    })
  }

  // French translation (optional)
  if (validatedInput.name_fr) {
    translations.push({
      district_id: districtId,
      locale_code: 'fr',
      name: validatedInput.name_fr,
      description: validatedInput.description_fr || null,
    })
  }

  if (translations.length > 0) {
    const { error: translationError } = await supabase
      .from('district_translations')
      .insert(translations)

    if (translationError) {
      console.error('Error updating translations:', translationError)
      throw new Error('Failed to update translations')
    }
  }

  revalidatePath(`/${citySlug}/operator/districts`)
  revalidatePath(`/${citySlug}/operator/districts/${districtId}`)
  return { success: true }
}

/**
 * Delete a district
 *
 * @async
 * @param citySlug - The city identifier
 * @param districtId - The district identifier
 * @returns Promise containing success status
 */
export async function deleteDistrict(citySlug: string, districtId: string) {
  const supabase = await getServerSupabaseWithCookies(citySlug)

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Delete district (translations will be deleted via foreign key cascade)
  const { error } = await supabase.from('districts').delete().eq('id', districtId)

  if (error) {
    console.error('Error deleting district:', error)
    throw new Error('Failed to delete district')
  }

  revalidatePath(`/${citySlug}/operator/districts`)
  return { success: true }
}
