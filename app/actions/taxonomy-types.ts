/**
 * Taxonomy Type Management Server Actions
 * ========================================
 * Server-side actions for CRUD operations on taxonomy type entities with translations.
 *
 * @async
 * @throws {Error} All functions may throw errors for invalid input, authentication failures, or database errors
 */

'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getServerSupabaseWithCookies } from '@/lib/supabase/server-client'

/**
 * Validation schema for taxonomy type creation/update
 */
const taxonomyTypeSchema = z.object({
  cityId: z.string().uuid(),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  isRequired: z.boolean().default(false),
  allowMultiple: z.boolean().default(false),
  useForMapStyling: z.boolean().default(false),
  useForFiltering: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
  // Translations
  name_en: z.string().min(1, 'English name is required'),
  description_en: z.string().optional(),
  name_nl: z.string().optional(),
  description_nl: z.string().optional(),
  name_fr: z.string().optional(),
  description_fr: z.string().optional(),
})

/**
 * Type for taxonomy type form input
 */
export type TaxonomyTypeInput = z.infer<typeof taxonomyTypeSchema>

/**
 * Type for taxonomy type data from database
 */
export interface TaxonomyType {
  id: string
  city_id: string
  slug: string
  is_required: boolean
  allow_multiple: boolean
  use_for_map_styling: boolean
  use_for_filtering: boolean
  display_order: number
  created_at: string
  updated_at: string
  translations: Array<{
    id: string
    locale_code: string
    name: string
    description: string | null
  }>
}

/**
 * Get taxonomy types for a city with translations
 *
 * @async
 * @param citySlug - The city identifier
 * @returns Promise that resolves to array of taxonomy types with translations
 * @throws {Error} If city slug is invalid, city not found, or database query fails
 */
export async function getTaxonomyTypes(citySlug: string): Promise<TaxonomyType[]> {
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
    throw new Error(`Failed to fetch city: ${cityError.message}`)
  }

  if (!city) {
    throw new Error(`City '${citySlug}' not found`)
  }

  // Get taxonomy types with translations
  const { data: taxonomyTypes, error: taxonomyTypesError } = await supabase
    .from('taxonomy_types')
    .select(`
      id,
      city_id,
      slug,
      is_required,
      allow_multiple,
      use_for_map_styling,
      use_for_filtering,
      display_order,
      created_at,
      updated_at,
      translations:taxonomy_type_translations (
        id,
        locale_code,
        name,
        description
      )
    `)
    .eq('city_id', city.id)
    .order('display_order', { ascending: true })

  if (taxonomyTypesError) {
    throw new Error(`Failed to fetch taxonomy types: ${taxonomyTypesError.message}`)
  }

  return taxonomyTypes || []
}

/**
 * Get a single taxonomy type by ID
 *
 * @async
 * @param citySlug - The city identifier
 * @param taxonomyTypeId - The UUID of the taxonomy type
 * @returns Promise that resolves to taxonomy type with translations
 * @throws {Error} If city slug or taxonomy type ID is invalid, not found, or database query fails
 */
export async function getTaxonomyType(citySlug: string, taxonomyTypeId: string): Promise<TaxonomyType> {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string') {
    throw new Error('City slug is required')
  }

  if (!taxonomyTypeId || typeof taxonomyTypeId !== 'string') {
    throw new Error('Taxonomy type ID is required')
  }

  // Validate UUID format for taxonomy type ID
  if (!taxonomyTypeId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    throw new Error('Invalid taxonomy type ID format')
  }

  const supabase = await getServerSupabaseWithCookies(citySlug)

  // Get city by slug
  const { data: city, error: cityError } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', citySlug)
    .single()

  if (cityError) {
    throw new Error(`Failed to fetch city: ${cityError.message}`)
  }

  if (!city) {
    throw new Error(`City '${citySlug}' not found`)
  }

  // Get taxonomy type with translations
  const { data: taxonomyType, error: taxonomyTypeError } = await supabase
    .from('taxonomy_types')
    .select(`
      id,
      city_id,
      slug,
      is_required,
      allow_multiple,
      use_for_map_styling,
      use_for_filtering,
      display_order,
      created_at,
      updated_at,
      translations:taxonomy_type_translations (
        id,
        locale_code,
        name,
        description
      )
    `)
    .eq('city_id', city.id)
    .eq('id', taxonomyTypeId)
    .single()

  if (taxonomyTypeError) {
    throw new Error(`Failed to fetch taxonomy type: ${taxonomyTypeError.message}`)
  }

  if (!taxonomyType) {
    throw new Error(`Taxonomy type not found`)
  }

  return taxonomyType
}

/**
 * Create a new taxonomy type with translations
 *
 * @async
 * @param citySlug - The city identifier
 * @param input - Validated taxonomy type input data
 * @returns Promise that resolves to the created taxonomy type
 * @throws {Error} If user is not authenticated, lacks permissions, or database operation fails
 */
export async function createTaxonomyType(citySlug: string, input: TaxonomyTypeInput): Promise<TaxonomyType> {
  const validatedInput = taxonomyTypeSchema.parse(input)
  const supabase = await getServerSupabaseWithCookies(citySlug)

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Verify user has access to this city
  const { data: cityAccess, error: accessError } = await supabase
    .from('city_users')
    .select('city_id')
    .eq('user_id', user.id)
    .eq('city_id', validatedInput.cityId)
    .single()

  if (accessError || !cityAccess) {
    throw new Error('Insufficient permissions')
  }

  // Create taxonomy type with transaction
  const { data: taxonomyType, error: taxonomyTypeError } = await supabase
    .from('taxonomy_types')
    .insert({
      city_id: validatedInput.cityId,
      slug: validatedInput.slug,
      is_required: validatedInput.isRequired,
      allow_multiple: validatedInput.allowMultiple,
      use_for_map_styling: validatedInput.useForMapStyling,
      use_for_filtering: validatedInput.useForFiltering,
      display_order: validatedInput.displayOrder,
    })
    .select()
    .single()

  if (taxonomyTypeError) {
    throw new Error('Failed to create taxonomy type')
  }

  // Insert translations
  const translations = []

  // English translation (required)
  if (validatedInput.name_en) {
    translations.push({
      taxonomy_type_id: taxonomyType.id,
      locale_code: 'en',
      name: validatedInput.name_en,
      description: validatedInput.description_en || null,
    })
  }

  // Dutch translation (optional)
  if (validatedInput.name_nl) {
    translations.push({
      taxonomy_type_id: taxonomyType.id,
      locale_code: 'nl',
      name: validatedInput.name_nl,
      description: validatedInput.description_nl || null,
    })
  }

  // French translation (optional)
  if (validatedInput.name_fr) {
    translations.push({
      taxonomy_type_id: taxonomyType.id,
      locale_code: 'fr',
      name: validatedInput.name_fr,
      description: validatedInput.description_fr || null,
    })
  }

  if (translations.length > 0) {
    const { error: translationError } = await supabase
      .from('taxonomy_type_translations')
      .insert(translations)

    if (translationError) {
      // Rollback taxonomy type creation
      await supabase.from('taxonomy_types').delete().eq('id', taxonomyType.id)
      throw new Error('Failed to create translations')
    }
  }

  revalidatePath(`/${citySlug}/operator/taxonomy-types`)
  return taxonomyType
}

/**
 * Update an existing taxonomy type with translations
 *
 * @async
 * @param citySlug - The city identifier
 * @param taxonomyTypeId - The UUID of the taxonomy type to update
 * @param input - Validated taxonomy type input data
 * @returns Promise that resolves to success status
 * @throws {Error} If user is not authenticated, lacks permissions, or database operation fails
 */
export async function updateTaxonomyType(
  citySlug: string,
  taxonomyTypeId: string,
  input: TaxonomyTypeInput
): Promise<{ success: boolean }> {
  const validatedInput = taxonomyTypeSchema.parse(input)
  const supabase = await getServerSupabaseWithCookies(citySlug)

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Verify user has access to this city
  const { data: cityAccess, error: accessError } = await supabase
    .from('city_users')
    .select('city_id')
    .eq('user_id', user.id)
    .eq('city_id', validatedInput.cityId)
    .single()

  if (accessError || !cityAccess) {
    throw new Error('Insufficient permissions')
  }

  // Update taxonomy type
  const { error: taxonomyTypeError } = await supabase
    .from('taxonomy_types')
    .update({
      slug: validatedInput.slug,
      is_required: validatedInput.isRequired,
      allow_multiple: validatedInput.allowMultiple,
      use_for_map_styling: validatedInput.useForMapStyling,
      use_for_filtering: validatedInput.useForFiltering,
      display_order: validatedInput.displayOrder,
    })
    .eq('id', taxonomyTypeId)

  if (taxonomyTypeError) {
    throw new Error('Failed to update taxonomy type')
  }

  // Delete existing translations
  await supabase
    .from('taxonomy_type_translations')
    .delete()
    .eq('taxonomy_type_id', taxonomyTypeId)

  // Insert updated translations
  const translations = []

  // English translation (required)
  if (validatedInput.name_en) {
    translations.push({
      taxonomy_type_id: taxonomyTypeId,
      locale_code: 'en',
      name: validatedInput.name_en,
      description: validatedInput.description_en || null,
    })
  }

  // Dutch translation (optional)
  if (validatedInput.name_nl) {
    translations.push({
      taxonomy_type_id: taxonomyTypeId,
      locale_code: 'nl',
      name: validatedInput.name_nl,
      description: validatedInput.description_nl || null,
    })
  }

  // French translation (optional)
  if (validatedInput.name_fr) {
    translations.push({
      taxonomy_type_id: taxonomyTypeId,
      locale_code: 'fr',
      name: validatedInput.name_fr,
      description: validatedInput.description_fr || null,
    })
  }

  if (translations.length > 0) {
    const { error: translationError } = await supabase
      .from('taxonomy_type_translations')
      .insert(translations)

    if (translationError) {
      throw new Error('Failed to update translations')
    }
  }

  revalidatePath(`/${citySlug}/operator/taxonomy-types`)
  revalidatePath(`/${citySlug}/operator/taxonomy-types/${taxonomyTypeId}`)
  return { success: true }
}

/**
 * Delete a taxonomy type
 *
 * @async
 * @param citySlug - The city identifier
 * @param taxonomyTypeId - The UUID of the taxonomy type to delete
 * @returns Promise that resolves to success status
 * @throws {Error} If user is not authenticated or database operation fails
 */
export async function deleteTaxonomyType(
  citySlug: string,
  taxonomyTypeId: string
): Promise<{ success: boolean }> {
  const supabase = await getServerSupabaseWithCookies(citySlug)

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Delete taxonomy type (translations will be deleted via foreign key cascade)
  const { error } = await supabase.from('taxonomy_types').delete().eq('id', taxonomyTypeId)

  if (error) {
    throw new Error('Failed to delete taxonomy type')
  }

  revalidatePath(`/${citySlug}/operator/taxonomy-types`)
  return { success: true }
}
