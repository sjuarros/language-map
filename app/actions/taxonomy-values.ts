/**
 * Taxonomy Value Management Server Actions
 * ========================================
 * Server-side actions for CRUD operations on taxonomy value entities with translations.
 * Taxonomy values define specific classifications within taxonomy types (e.g., Small/Medium/Large for "Size").
 *
 * @async
 * @throws {Error} All functions may throw errors for invalid input, authentication failures, or database errors
 */

'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getDatabaseClient } from '@/lib/database/client'

// Validation schema for taxonomy value form
const taxonomyValueSchema = z.object({
  taxonomy_type_id: z.string().uuid('Invalid taxonomy type ID'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  color_hex: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FFA500)'),
  icon_name: z.string()
    .max(50, 'Icon name must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  icon_size_multiplier: z.number()
    .min(0.5, 'Icon size multiplier must be at least 0.5')
    .max(3.0, 'Icon size multiplier must be at most 3.0'),
  display_order: z.number()
    .int('Display order must be an integer')
    .min(0, 'Display order must be non-negative'),
  translations: z.array(z.object({
    locale_code: z.string(),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
  }))
})

export type TaxonomyValueInput = z.infer<typeof taxonomyValueSchema>

/**
 * Get taxonomy values for a taxonomy type with translations
 *
 * @async
 * @param citySlug - The city identifier
 * @param taxonomyTypeId - The UUID of the taxonomy type
 * @returns Promise that resolves to array of taxonomy values with translations
 * @throws {Error} If city slug is invalid, taxonomy type not found, or database query fails
 */
export async function getTaxonomyValues(citySlug: string, taxonomyTypeId: string) {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string') {
    throw new Error('City slug is required')
  }

  if (!citySlug.match(/^[a-z0-9-]+$/)) {
    throw new Error('Invalid city slug format')
  }

  const supabase = getDatabaseClient(citySlug)

  // Verify city exists
  const { data: city, error: cityError } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', citySlug)
    .single()

  if (cityError || !city) {
    throw new Error(`City '${citySlug}' not found`)
  }

  const { data, error } = await supabase
    .from('taxonomy_values')
    .select(`
      id,
      taxonomy_type_id,
      slug,
      color_hex,
      icon_name,
      icon_size_multiplier,
      display_order,
      created_at,
      updated_at,
      translations:taxonomy_value_translations(
        id,
        locale_code,
        name,
        description,
        is_ai_translated,
        reviewed_at
      )
    `)
    .eq('taxonomy_type_id', taxonomyTypeId)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching taxonomy values:', error)
    throw new Error(`Failed to fetch taxonomy values: ${error.message}`)
  }

  return data
}

/**
 * Get a single taxonomy value by ID
 *
 * @async
 * @param citySlug - The city identifier
 * @param valueId - The UUID of the taxonomy value
 * @returns Promise that resolves to taxonomy value with translations
 * @throws {Error} If city slug is invalid, value not found, or database query fails
 */
export async function getTaxonomyValue(citySlug: string, valueId: string) {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string') {
    throw new Error('City slug is required')
  }

  if (!citySlug.match(/^[a-z0-9-]+$/)) {
    throw new Error('Invalid city slug format')
  }

  if (!valueId || typeof valueId !== 'string') {
    throw new Error('Taxonomy value ID is required')
  }

  const supabase = getDatabaseClient(citySlug)

  // Verify city exists
  const { data: city, error: cityError } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', citySlug)
    .single()

  if (cityError || !city) {
    throw new Error(`City '${citySlug}' not found`)
  }

  const { data, error } = await supabase
    .from('taxonomy_values')
    .select(`
      id,
      taxonomy_type_id,
      slug,
      color_hex,
      icon_name,
      icon_size_multiplier,
      display_order,
      created_at,
      updated_at,
      translations:taxonomy_value_translations(
        id,
        locale_code,
        name,
        description,
        is_ai_translated,
        reviewed_at
      ),
      taxonomy_type:taxonomy_types!inner(
        id,
        slug,
        city_id,
        translations:taxonomy_type_translations(
          locale_code,
          name
        )
      )
    `)
    .eq('id', valueId)
    .single()

  if (error) {
    console.error('Error fetching taxonomy value:', error)
    throw new Error(`Failed to fetch taxonomy value: ${error.message}`)
  }

  return data
}

/**
 * Create a new taxonomy value
 *
 * @async
 * @param citySlug - The city identifier
 * @param input - The taxonomy value data
 * @returns Promise that resolves to created taxonomy value
 * @throws {Error} If user is not authenticated, lacks permissions, or database operation fails
 */
export async function createTaxonomyValue(citySlug: string, input: TaxonomyValueInput) {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string') {
    throw new Error('City slug is required')
  }

  if (!citySlug.match(/^[a-z0-9-]+$/)) {
    throw new Error('Invalid city slug format')
  }

  const supabase = getDatabaseClient(citySlug)

  // Verify city exists
  const { data: city, error: cityError } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', citySlug)
    .single()

  if (cityError || !city) {
    throw new Error(`City '${citySlug}' not found`)
  }

  // Validate input
  const validatedInput = taxonomyValueSchema.parse(input)

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Verify user has access to this city
  const { data: cityAccess, error: accessError } = await supabase
    .from('city_users')
    .select('city_id')
    .eq('user_id', user.id)
    .eq('city_id', city.id)
    .single()

  if (accessError || !cityAccess) {
    throw new Error('Insufficient permissions')
  }

  // Start transaction
  const { data: taxonomyValue, error: valueError } = await supabase
    .from('taxonomy_values')
    .insert({
      taxonomy_type_id: validatedInput.taxonomy_type_id,
      slug: validatedInput.slug,
      color_hex: validatedInput.color_hex,
      icon_name: validatedInput.icon_name || null,
      icon_size_multiplier: validatedInput.icon_size_multiplier,
      display_order: validatedInput.display_order,
    })
    .select()
    .single()

  if (valueError) {
    console.error('Error creating taxonomy value:', valueError)
    throw new Error(`Failed to create taxonomy value: ${valueError.message}`)
  }

  // Insert translations
  const translationInserts = validatedInput.translations.map(translation => ({
    taxonomy_value_id: taxonomyValue.id,
    locale_code: translation.locale_code,
    name: translation.name,
    description: translation.description || null,
  }))

  const { error: translationError } = await supabase
    .from('taxonomy_value_translations')
    .insert(translationInserts)

  if (translationError) {
    console.error('Error creating translations:', translationError)
    // Rollback taxonomy value on translation failure
    await supabase
      .from('taxonomy_values')
      .delete()
      .eq('id', taxonomyValue.id)

    throw new Error(`Failed to create translations: ${translationError.message}`)
  }

  // Revalidate relevant paths
  revalidatePath(`/${citySlug}/operator/taxonomy-types/${validatedInput.taxonomy_type_id}/values`)

  return taxonomyValue
}

/**
 * Update a taxonomy value
 *
 * @async
 * @param citySlug - The city identifier
 * @param valueId - The UUID of the taxonomy value
 * @param input - The updated taxonomy value data
 * @returns Promise that resolves to updated taxonomy value
 * @throws {Error} If user is not authenticated, lacks permissions, or database operation fails
 */
export async function updateTaxonomyValue(
  citySlug: string,
  valueId: string,
  input: Partial<TaxonomyValueInput>
) {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string') {
    throw new Error('City slug is required')
  }

  if (!citySlug.match(/^[a-z0-9-]+$/)) {
    throw new Error('Invalid city slug format')
  }

  if (!valueId || typeof valueId !== 'string') {
    throw new Error('Taxonomy value ID is required')
  }

  const supabase = getDatabaseClient(citySlug)

  // Verify city exists
  const { data: city, error: cityError } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', citySlug)
    .single()

  if (cityError || !city) {
    throw new Error(`City '${citySlug}' not found`)
  }

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Verify user has access to this city
  const { data: cityAccess, error: accessError } = await supabase
    .from('city_users')
    .select('city_id')
    .eq('user_id', user.id)
    .eq('city_id', city.id)
    .single()

  if (accessError || !cityAccess) {
    throw new Error('Insufficient permissions')
  }

  // Validate input (partial validation)
  const validatedInput = taxonomyValueSchema.partial().parse(input)

  // Build update object
  const updateData: Partial<{
    taxonomy_type_id: string
    slug: string
    color_hex: string
    icon_name: string | null
    icon_size_multiplier: number
    display_order: number
  }> = {}

  if (validatedInput.taxonomy_type_id !== undefined) {
    updateData.taxonomy_type_id = validatedInput.taxonomy_type_id
  }
  if (validatedInput.slug !== undefined) {
    updateData.slug = validatedInput.slug
  }
  if (validatedInput.color_hex !== undefined) {
    updateData.color_hex = validatedInput.color_hex
  }
  if (validatedInput.icon_name !== undefined) {
    updateData.icon_name = validatedInput.icon_name || null
  }
  if (validatedInput.icon_size_multiplier !== undefined) {
    updateData.icon_size_multiplier = validatedInput.icon_size_multiplier
  }
  if (validatedInput.display_order !== undefined) {
    updateData.display_order = validatedInput.display_order
  }

  // Update taxonomy value
  const { data: taxonomyValue, error: valueError } = await supabase
    .from('taxonomy_values')
    .update(updateData)
    .eq('id', valueId)
    .select()
    .single()

  if (valueError) {
    console.error('Error updating taxonomy value:', valueError)
    throw new Error(`Failed to update taxonomy value: ${valueError.message}`)
  }

  // Update translations if provided
  if (validatedInput.translations) {
    // Delete existing translations
    await supabase
      .from('taxonomy_value_translations')
      .delete()
      .eq('taxonomy_value_id', valueId)

    // Insert new translations
    const translationInserts = validatedInput.translations.map(translation => ({
      taxonomy_value_id: valueId,
      locale_code: translation.locale_code,
      name: translation.name,
      description: translation.description || null,
    }))

    const { error: translationError } = await supabase
      .from('taxonomy_value_translations')
      .insert(translationInserts)

    if (translationError) {
      console.error('Error updating translations:', translationError)
      throw new Error(`Failed to update translations: ${translationError.message}`)
    }
  }

  // Revalidate relevant paths
  revalidatePath(`/${citySlug}/operator/taxonomy-types/${taxonomyValue.taxonomy_type_id}/values`)

  return taxonomyValue
}

/**
 * Delete a taxonomy value
 *
 * @async
 * @param citySlug - The city identifier
 * @param valueId - The UUID of the taxonomy value
 * @returns Promise that resolves to success status
 * @throws {Error} If user is not authenticated or database operation fails
 */
export async function deleteTaxonomyValue(citySlug: string, valueId: string) {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string') {
    throw new Error('City slug is required')
  }

  if (!citySlug.match(/^[a-z0-9-]+$/)) {
    throw new Error('Invalid city slug format')
  }

  if (!valueId || typeof valueId !== 'string') {
    throw new Error('Taxonomy value ID is required')
  }

  const supabase = getDatabaseClient(citySlug)

  // Verify city exists
  const { data: city, error: cityError } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', citySlug)
    .single()

  if (cityError || !city) {
    throw new Error(`City '${citySlug}' not found`)
  }

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Verify user has access to this city
  const { data: cityAccess, error: accessError } = await supabase
    .from('city_users')
    .select('city_id')
    .eq('user_id', user.id)
    .eq('city_id', city.id)
    .single()

  if (accessError || !cityAccess) {
    throw new Error('Insufficient permissions')
  }

  // Get taxonomy type ID for revalidation
  const { data: valueToDelete } = await supabase
    .from('taxonomy_values')
    .select('taxonomy_type_id')
    .eq('id', valueId)
    .single()

  // Delete taxonomy value (translations will be deleted via CASCADE)
  const { error } = await supabase
    .from('taxonomy_values')
    .delete()
    .eq('id', valueId)

  if (error) {
    console.error('Error deleting taxonomy value:', error)
    throw new Error(`Failed to delete taxonomy value: ${error.message}`)
  }

  // Revalidate relevant paths
  if (valueToDelete) {
    revalidatePath(`/${citySlug}/operator/taxonomy-types/${valueToDelete.taxonomy_type_id}/values`)
  }

  return { success: true }
}

/**
 * Get taxonomy type with values (for dropdown in forms)
 *
 * @async
 * @param citySlug - The city identifier
 * @param taxonomyTypeId - The UUID of the taxonomy type
 * @returns Promise that resolves to taxonomy type with translations
 * @throws {Error} If city slug is invalid, taxonomy type not found, or database query fails
 */
export async function getTaxonomyTypeForValues(citySlug: string, taxonomyTypeId: string) {
  // Input validation
  if (!citySlug || typeof citySlug !== 'string') {
    throw new Error('City slug is required')
  }

  if (!citySlug.match(/^[a-z0-9-]+$/)) {
    throw new Error('Invalid city slug format')
  }

  if (!taxonomyTypeId || typeof taxonomyTypeId !== 'string') {
    throw new Error('Taxonomy type ID is required')
  }

  const supabase = getDatabaseClient(citySlug)

  // Verify city exists
  const { data: city, error: cityError } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', citySlug)
    .single()

  if (cityError || !city) {
    throw new Error(`City '${citySlug}' not found`)
  }

  const { data, error } = await supabase
    .from('taxonomy_types')
    .select(`
      id,
      slug,
      city_id,
      translations:taxonomy_type_translations(
        locale_code,
        name
      )
    `)
    .eq('id', taxonomyTypeId)
    .single()

  if (error) {
    console.error('Error fetching taxonomy type:', error)
    throw new Error(`Failed to fetch taxonomy type: ${error.message}`)
  }

  return data
}
