/**
 * Authentication Client
 *
 * Provides client-side authentication functions using Supabase Auth.
 * Supports magic link authentication and session management.
 *
 * @module lib/auth/client
 */

import { createBrowserClient } from '@supabase/ssr'

/**
 * Validate and retrieve Supabase environment variables
 *
 * @throws {Error} If required environment variables are missing in production
 * @returns Supabase configuration object
 */
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Allow defaults in development, but require in production
  const isDevelopment = process.env.NODE_ENV === 'development'

  if (!url && !isDevelopment) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!anonKey) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return {
    url: url || 'http://localhost:54331',
    anonKey: anonKey,
  }
}

const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = getSupabaseConfig()

/**
 * Create a Supabase client for browser-side auth operations
 *
 * @returns Supabase client for authentication
 */
export function createAuthClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

/**
 * Sign in with magic link
 *
 * Sends a magic link to the user's email for passwordless authentication.
 * The user will receive an email with a link to complete sign in.
 *
 * @param email - User's email address
 * @param redirectTo - Optional URL to redirect after successful sign in
 * @returns Promise resolving to auth response
 * @throws {Error} If sign in fails or email is invalid
 *
 * @example
 * await signInWithMagicLink('user@example.com', '/dashboard')
 */
export async function signInWithMagicLink(
  email: string,
  redirectTo?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Comprehensive input validation
    if (typeof email !== 'string' || email === null || email === undefined) {
      return {
        success: false,
        error: 'Email is required and must be a string',
      }
    }

    // Trim whitespace
    email = email.trim()

    // Length validation
    if (email.length === 0 || email.length > 254) {
      return {
        success: false,
        error: 'Email must be between 1 and 254 characters',
      }
    }

    // RFC 5322 compliant email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: 'Please enter a valid email address',
      }
    }

    // Validate redirectTo if provided
    if (redirectTo !== undefined) {
      if (typeof redirectTo !== 'string') {
        return {
          success: false,
          error: 'Redirect URL must be a string',
        }
      }
      // Basic URL validation - should start with / for relative URLs or http for absolute
      if (!redirectTo.startsWith('/') && !redirectTo.startsWith('http')) {
        return {
          success: false,
          error: 'Invalid redirect URL format',
        }
      }
    }

    const supabase = createAuthClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in signInWithMagicLink:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Sign out the current user
 *
 * Clears the user's session and redirects to the home page.
 *
 * @returns Promise resolving to auth response
 * @throws {Error} If sign out fails
 *
 * @example
 * await signOut()
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAuthClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Get the current user's session
 *
 * @returns Promise resolving to the current session or null
 */
export async function getSession() {
  try {
    const supabase = createAuthClient()
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
 * Get the current user
 *
 * @returns Promise resolving to the current user or null
 */
export async function getCurrentUser() {
  try {
    const supabase = createAuthClient()
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
