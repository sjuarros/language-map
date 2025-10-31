/**
 * Authentication Server Actions
 *
 * Server-side actions for authentication operations.
 * These run on the server and can be called from client components.
 *
 * @module app/actions/auth
 */

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Create Supabase server client with cookie handling
 *
 * @returns Supabase client for server-side auth operations
 */
async function createAuthServerClient() {
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
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
            // However, log for debugging purposes
            if (process.env.NODE_ENV === 'development') {
              console.warn('Cookie set operation failed (expected in Server Components):', {
                name,
                error: error instanceof Error ? error.message : 'Unknown error',
              })
            }
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
            if (process.env.NODE_ENV === 'development') {
              console.warn('Cookie remove operation failed (expected in Server Components):', {
                name,
                error: error instanceof Error ? error.message : 'Unknown error',
              })
            }
          }
        },
      },
    }
  )
}

/**
 * Sign out the current user
 *
 * Clears the user's session and redirects to the home page.
 *
 * @param locale - Current locale for redirect
 * @returns Promise resolving when sign out is complete
 * @throws {Error} If sign out fails or locale is invalid
 *
 * @example
 * await signOutAction('en')
 */
export async function signOutAction(locale: string = 'en'): Promise<void> {
  // Validate locale parameter
  const validLocales = ['en', 'nl', 'fr'] // From lib/i18n/config.ts
  if (typeof locale !== 'string' || !locale || !locale.trim()) {
    throw new Error('Locale must be a valid string')
  }

  if (!validLocales.includes(locale)) {
    console.warn(`Invalid locale "${locale}", falling back to "en"`)
    locale = 'en'
  }

  try {
    const supabase = await createAuthServerClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new Error(`Sign out failed: ${error.message}`)
    }

    // Revalidate all paths to clear cached data
    revalidatePath('/', 'layout')
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error signing out:', error.message)
      throw new Error(`Failed to sign out: ${error.message}`)
    }
    throw new Error('Failed to sign out: Unknown error')
  }

  // Redirect to home page
  redirect(`/${locale}`)
}

/**
 * Get current user session
 *
 * @returns Promise resolving to the current session or null
 */
export async function getSession() {
  try {
    const supabase = await createAuthServerClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Error getting session:', error)
      return null
    }

    return data.session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

/**
 * Get current user
 *
 * @returns Promise resolving to the current user or null
 */
export async function getCurrentUser() {
  try {
    const supabase = await createAuthServerClient()
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      console.error('Error getting user:', error)
      return null
    }

    return data.user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}
