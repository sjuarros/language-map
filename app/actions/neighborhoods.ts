/**
 * Neighborhood Management Server Actions
 * =====================================
 * Server-side actions for CRUD operations on neighborhood entities with translations.
 * Note: Neighborhoods are linked to districts for geographic hierarchy.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { getServerSupabaseWithCookies } from '@/lib/supabase/server-client'
import { z } from 'zod'

/**
 * Validation schema for neighborhood creation/update
 */
const neighborhoodSchema = z.object({
  cityId: z.string().uuid(),
  districtId: z.string().uuid(),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  is_active: z.boolean().optional().default(true),
  // Translations
  name_en: z.string().min(1, 'English name is required'),
  description_en: z.string().optional(),
  name_nl: z.string().optional(),
  description_nl: z.string().optional(),
  name_fr: z.string().optional(),
  description_fr: z.string().optional(),
})

/**
 * Type for neighborhood form input
 */
export type NeighborhoodInput = z.infer<typeof neighborhoodSchema>

/**
 * Get neighborhoods for a city with translations and district info
 *
 * @async
 * @param citySlug - The city identifier
 * @returns Promise containing array of neighborhoods
 */
export async function getNeighborhoods(citySlug: string) {
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

    // Get neighborhoods with translations and district info
    const { data: neighborhoods, error: neighborhoodsError } = await supabase
      .from('neighborhoods')
      .select(`
        id,
        district_id,
        slug,
        is_active,
        created_at,
        updated_at,
        district:districts!inner(
          city_id
        ),
        translations:neighborhood_translations (
          id,
          locale_code,
          name,
          description
        )
      `)
      .eq('district.city_id', city.id)
      .order('created_at', { ascending: true })

    if (neighborhoodsError) {
      console.error('Error fetching neighborhoods:', JSON.stringify(neighborhoodsError, null, 2))
      console.error('Full error object:', neighborhoodsError)
      throw new Error(`Failed to fetch neighborhoods: ${JSON.stringify(neighborhoodsError)}`)
    }

    return neighborhoods
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching neighborhoods')
  }
}

/**
 * Get a single neighborhood by ID
 *
 * @async
 * @param citySlug - The city identifier
 * @param neighborhoodId - The neighborhood identifier
 * @returns Promise containing neighborhood data
 */
export async function getNeighborhood(citySlug: string, neighborhoodId: string) {
  try {
    // Input validation
    if (!citySlug || typeof citySlug !== 'string') {
      throw new Error('City slug is required')
    }

    if (!neighborhoodId || typeof neighborhoodId !== 'string') {
      throw new Error('Neighborhood ID is required')
    }

    // Validate UUID format for neighborhood ID
    if (!neighborhoodId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('Invalid neighborhood ID format')
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

    // Get neighborhood with translations
    const { data: neighborhood, error: neighborhoodError } = await supabase
      .from('neighborhoods')
      .select(`
        id,
        district_id,
        slug,
        is_active,
        created_at,
        updated_at,
        translations:neighborhood_translations (
          id,
          locale_code,
          name,
          description
        )
      `)
      .eq('id', neighborhoodId)
      .single()

    if (neighborhoodError) {
      console.error('Error fetching neighborhood:', neighborhoodError)
      throw new Error(`Failed to fetch neighborhood: ${neighborhoodError.message}`)
    }

    if (!neighborhood) {
      throw new Error(`Neighborhood not found`)
    }

    return neighborhood
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching neighborhood')
  }
}

/**
 * Get districts for a city (for dropdown in neighborhood form)
 *
 * @async
 * @param citySlug - The city identifier
 * @returns Promise containing array of districts
 */
export async function getDistrictsForNeighborhood(citySlug: string) {
  try {
    // Input validation
    if (!citySlug || typeof citySlug !== 'string') {
      throw new Error('City slug is required')
    }

    const supabase = await getServerSupabaseWithCookies(citySlug)

    // Get city by slug
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .single()

    if (cityError || !city) {
      throw new Error(`City '${citySlug}' not found`)
    }

    // Get districts with translations (for dropdown)
    const { data: districts, error: districtsError } = await supabase
      .from('districts')
      .select(`
        id,
        slug,
        translations:district_translations (
          locale_code,
          name
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
 * Create a new neighborhood with translations
 *
 * @async
 * @param citySlug - The city identifier
 * @param input - Neighborhood input data
 * @returns Promise containing created neighborhood
 */
export async function createNeighborhood(citySlug: string, input: NeighborhoodInput) {
  const validatedInput = neighborhoodSchema.parse(input)

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

  // Verify district belongs to this city
  const { data: districtCheck } = await supabase
    .from('districts')
    .select('id')
    .eq('id', validatedInput.districtId)
    .eq('city_id', validatedInput.cityId)
    .single()

  if (!districtCheck) {
    throw new Error('Invalid district selected')
  }

  // Create neighborhood with transaction
  const { data: neighborhood, error: neighborhoodError } = await supabase
    .from('neighborhoods')
    .insert({
      district_id: validatedInput.districtId,
      slug: validatedInput.slug,
      is_active: validatedInput.is_active ?? true,
    })
    .select()
    .single()

  if (neighborhoodError) {
    console.error('Error creating neighborhood:', neighborhoodError)
    throw new Error('Failed to create neighborhood')
  }

  // Insert translations
  const translations = []

  // English translation (required)
  if (validatedInput.name_en) {
    translations.push({
      neighborhood_id: neighborhood.id,
      locale_code: 'en',
      name: validatedInput.name_en,
      description: validatedInput.description_en || null,
    })
  }

  // Dutch translation (optional)
  if (validatedInput.name_nl) {
    translations.push({
      neighborhood_id: neighborhood.id,
      locale_code: 'nl',
      name: validatedInput.name_nl,
      description: validatedInput.description_nl || null,
    })
  }

  // French translation (optional)
  if (validatedInput.name_fr) {
    translations.push({
      neighborhood_id: neighborhood.id,
      locale_code: 'fr',
      name: validatedInput.name_fr,
      description: validatedInput.description_fr || null,
    })
  }

  if (translations.length > 0) {
    const { error: translationError } = await supabase
      .from('neighborhood_translations')
      .insert(translations)

    if (translationError) {
      console.error('Error creating translations:', translationError)
      // Rollback neighborhood creation
      await supabase.from('neighborhoods').delete().eq('id', neighborhood.id)
      throw new Error('Failed to create translations')
    }
  }

  revalidatePath(`/${citySlug}/operator/neighborhoods`)
  return neighborhood
}

/**
 * Update an existing neighborhood with translations
 *
 * @async
 * @param citySlug - The city identifier
 * @param neighborhoodId - The neighborhood identifier
 * @param input - Neighborhood input data
 * @returns Promise containing success status
 */
export async function updateNeighborhood(
  citySlug: string,
  neighborhoodId: string,
  input: NeighborhoodInput
) {
  const validatedInput = neighborhoodSchema.parse(input)

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

  // Verify district belongs to this city
  const { data: districtCheck } = await supabase
    .from('districts')
    .select('id')
    .eq('id', validatedInput.districtId)
    .eq('city_id', validatedInput.cityId)
    .single()

  if (!districtCheck) {
    throw new Error('Invalid district selected')
  }

  // Update neighborhood
  const { error: neighborhoodError } = await supabase
    .from('neighborhoods')
    .update({
      district_id: validatedInput.districtId,
      slug: validatedInput.slug,
      is_active: validatedInput.is_active ?? true,
    })
    .eq('id', neighborhoodId)

  if (neighborhoodError) {
    console.error('Error updating neighborhood:', neighborhoodError)
    throw new Error('Failed to update neighborhood')
  }

  // Delete existing translations
  await supabase
    .from('neighborhood_translations')
    .delete()
    .eq('neighborhood_id', neighborhoodId)

  // Insert updated translations
  const translations = []

  // English translation (required)
  if (validatedInput.name_en) {
    translations.push({
      neighborhood_id: neighborhoodId,
      locale_code: 'en',
      name: validatedInput.name_en,
      description: validatedInput.description_en || null,
    })
  }

  // Dutch translation (optional)
  if (validatedInput.name_nl) {
    translations.push({
      neighborhood_id: neighborhoodId,
      locale_code: 'nl',
      name: validatedInput.name_nl,
      description: validatedInput.description_nl || null,
    })
  }

  // French translation (optional)
  if (validatedInput.name_fr) {
    translations.push({
      neighborhood_id: neighborhoodId,
      locale_code: 'fr',
      name: validatedInput.name_fr,
      description: validatedInput.description_fr || null,
    })
  }

  if (translations.length > 0) {
    const { error: translationError } = await supabase
      .from('neighborhood_translations')
      .insert(translations)

    if (translationError) {
      console.error('Error updating translations:', translationError)
      throw new Error('Failed to update translations')
    }
  }

  revalidatePath(`/${citySlug}/operator/neighborhoods`)
  revalidatePath(`/${citySlug}/operator/neighborhoods/${neighborhoodId}`)
  return { success: true }
}

/**
 * Delete a neighborhood
 *
 * @async
 * @param citySlug - The city identifier
 * @param neighborhoodId - The neighborhood identifier
 * @returns Promise containing success status
 */
export async function deleteNeighborhood(citySlug: string, neighborhoodId: string) {
  const supabase = await getServerSupabaseWithCookies(citySlug)

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Delete neighborhood (translations will be deleted via foreign key cascade)
  const { error } = await supabase.from('neighborhoods').delete().eq('id', neighborhoodId)

  if (error) {
    console.error('Error deleting neighborhood:', error)
    throw new Error('Failed to delete neighborhood')
  }

  revalidatePath(`/${citySlug}/operator/neighborhoods`)
  return { success: true }
}
