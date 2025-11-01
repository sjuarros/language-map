/**
 * Server-Side Supabase Client Helper
 * ===================================
 * Centralized creation of Supabase clients for server components and actions.
 *
 * This eliminates code duplication and ensures consistent client configuration.
 */

import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { getDatabaseClient } from '@/lib/database/client'

/**
 * Get Supabase client for server-side operations in a specific city's context
 *
 * @param citySlug - The city identifier for database scoping
 * @returns Configured Supabase client with proper authentication
 *
 * @example
 * const supabase = getServerSupabase('amsterdam')
 */
export async function getServerSupabase(citySlug: string) {
  return getDatabaseClient(citySlug)
}

/**
 * Get Supabase client with custom cookie configuration
 *
 * Creates a city-scoped client with cookie handling for server-side operations.
 * Uses the Database Abstraction Layer pattern for future multi-city support.
 *
 * @param citySlug - The city identifier
 * @param cookieOptions - Custom cookie options
 * @returns Configured Supabase client with cookie handling
 */
export async function getServerSupabaseWithCookies(
  citySlug: string,
  cookieOptions?: {
    get?: (name: string) => string | undefined
    set?: (name: string, value: string, options: CookieOptions) => void
    remove?: (name: string, options: CookieOptions) => void
  }
) {
  const cookieStore = await cookies()

  // Create a new client with cookie handling and city context from abstraction layer
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        get(name: string) {
          if (cookieOptions?.get) {
            return cookieOptions.get(name)
          }
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          if (cookieOptions?.set) {
            cookieOptions.set(name, value, options)
            return
          }
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Cookie set operation failed:', error)
            }
          }
        },
        remove(name: string, options: CookieOptions) {
          if (cookieOptions?.remove) {
            cookieOptions.remove(name, options)
            return
          }
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Cookie remove operation failed:', error)
            }
          }
        },
      },
      global: {
        // Preserve city context from abstraction layer
        headers: {
          'x-city-slug': citySlug,
        },
      },
    }
  )
}
