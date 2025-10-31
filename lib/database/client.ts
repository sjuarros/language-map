/**
 * Database Abstraction Layer
 *
 * Provides database client factory functions that abstract the underlying database.
 * This enables future migration to per-city databases without rewriting application code.
 *
 * CRITICAL: All application code MUST use these factory functions instead of
 * creating Supabase clients directly.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Database configuration for different environments
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54331'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * Cache for database clients to avoid creating duplicate instances
 */
const clientCache = new Map<string, SupabaseClient>()
const adminClientCache = new Map<string, SupabaseClient>()

/**
 * Default database configuration (for production use)
 * In Phase 1, all cities share the same database
 */
const DEFAULT_DATABASE_CONFIG = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
}

/**
 * Validate city slug format
 *
 * City slugs must contain only lowercase letters, numbers, and hyphens
 * to ensure compatibility with URLs and database constraints.
 *
 * @param citySlug - The city slug to validate
 * @throws {Error} If citySlug is invalid
 */
function validateCitySlug(citySlug: string): void {
  if (!citySlug || typeof citySlug !== 'string') {
    throw new Error('citySlug is required and must be a string')
  }

  // City slugs should only contain lowercase letters, numbers, and hyphens
  if (!citySlug.match(/^[a-z0-9-]+$/)) {
    throw new Error('citySlug must contain only lowercase letters, numbers, and hyphens')
  }

  // Additional constraints
  if (citySlug.length < 2) {
    throw new Error('citySlug must be at least 2 characters long')
  }

  if (citySlug.length > 50) {
    throw new Error('citySlug must be no more than 50 characters long')
  }
}

/**
 * Get database client for a specific city
 *
 * This is the PRIMARY factory function that all application code should use.
 * It provides a database client scoped to a specific city (currently shared database).
 *
 * @param citySlug - The slug of the city (e.g., 'amsterdam', 'paris')
 * @returns SupabaseClient configured for the city
 *
 * @example
 * const supabase = getDatabaseClient('amsterdam')
 * const { data } = await supabase.from('cities').select('*')
 */
export function getDatabaseClient(citySlug: string): SupabaseClient {
  validateCitySlug(citySlug)

  // Check cache first
  const cacheKey = `${citySlug}-${DEFAULT_DATABASE_CONFIG.url}`
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!
  }

  // Create new client with database abstraction
  const client = createClient(
    DEFAULT_DATABASE_CONFIG.url,
    DEFAULT_DATABASE_CONFIG.anonKey,
    {
      auth: {
        // Auth is city-agnostic, users can access multiple cities
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      db: {
        // Add city context to all queries (Phase 2 will implement this)
        schema: 'public',
      },
      global: {
        // Add headers to identify city context
        headers: {
          'x-city-slug': citySlug,
        },
      },
    }
  )

  // Cache the client
  clientCache.set(cacheKey, client)

  return client
}

/**
 * Get database client with service role for admin operations
 *
 * Use this for server-side operations that need elevated privileges:
 * - User management
 * - City configuration
 * - Database migrations
 * - Bulk operations
 *
 * ⚠️ WARNING: Service role has admin access to ALL cities.
 * Only use this in secure server-side contexts.
 *
 * @param citySlug - The slug of the city (for consistency with getDatabaseClient)
 * @returns SupabaseClient with service role
 *
 * @example
 * const supabase = getDatabaseAdminClient('amsterdam')
 * await supabase.auth.admin.createUser({ email: '...' })
 */
export function getDatabaseAdminClient(citySlug: string): SupabaseClient {
  validateCitySlug(citySlug)

  // Check cache first
  const cacheKey = `${citySlug}-${DEFAULT_DATABASE_CONFIG.url}-admin`
  if (adminClientCache.has(cacheKey)) {
    return adminClientCache.get(cacheKey)!
  }

  // Create admin client
  const client = createClient(
    DEFAULT_DATABASE_CONFIG.url,
    DEFAULT_DATABASE_CONFIG.serviceRoleKey,
    {
      auth: {
        // Service role bypasses RLS
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'x-city-slug': citySlug,
        },
      },
    }
  )

  // Cache the client
  adminClientCache.set(cacheKey, client)

  return client
}

/**
 * Get available cities from database
 *
 * This is a shared operation that doesn't require city context
 *
 * @returns Promise resolving to array of cities
 */
export async function getAvailableCities(): Promise<Array<{ slug: string; name: string }>> {
  const supabase = getDatabaseAdminClient('system')

  const { data, error } = await supabase
    .from('cities')
    .select(`
      slug,
      translations:city_translations!inner(
        name,
        locale_code
      )
    `)
    .eq('status', 'active')
    .eq('translations.locale_code', 'en')

  if (error) {
    throw new Error(`Failed to fetch cities: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return []
  }

  return data.map((city) => {
    // Validate that city has translations
    if (!city.translations || city.translations.length === 0) {
      throw new Error(`City ${city.slug} has no translations`)
    }

    return {
      slug: city.slug,
      name: city.translations[0].name,
    }
  })
}

/**
 * Check if a city exists and is accessible
 *
 * @param citySlug - The slug of the city to check
 * @returns Promise resolving to boolean indicating if city exists
 */
export async function cityExists(citySlug: string): Promise<boolean> {
  validateCitySlug(citySlug)

  const supabase = getDatabaseClient(citySlug)

  const { data, error } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', citySlug)
    .single()

  // If no rows returned or error, city doesn't exist
  if (error || !data) {
    return false
  }

  return true
}

/**
 * Get city configuration
 *
 * @param citySlug - The slug of the city
 * @returns Promise resolving to city configuration object
 */
export async function getCityConfig(
  citySlug: string
): Promise<{
  id: string
  slug: string
  center_lat: number
  center_lng: number
  default_zoom: number
  mapbox_style: string | null
  primary_color: string | null
  bounds_min_lat: number | null
  bounds_max_lat: number | null
  bounds_min_lng: number | null
  bounds_max_lng: number | null
}> {
  validateCitySlug(citySlug)

  const supabase = getDatabaseClient(citySlug)

  const { data, error } = await supabase
    .from('cities')
    .select(`
      id,
      slug,
      center_lat,
      center_lng,
      default_zoom,
      mapbox_style,
      primary_color,
      bounds_min_lat,
      bounds_max_lat,
      bounds_min_lng,
      bounds_max_lng
    `)
    .eq('slug', citySlug)
    .single()

  if (error) {
    throw new Error(`Failed to fetch city config: ${error.message}`)
  }

  return data
}

/**
 * Clear client cache
 *
 * Useful for testing or when switching between database configurations
 */
export function clearClientCache(): void {
  clientCache.clear()
  adminClientCache.clear()
}
