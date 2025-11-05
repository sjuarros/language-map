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
import { getDatabaseAdminClient } from '@/lib/database/client'

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
    const supabase = getDatabaseAdminClient('system')

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
    const supabase = getDatabaseAdminClient('system')
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
    const supabase = getDatabaseAdminClient('system')
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
