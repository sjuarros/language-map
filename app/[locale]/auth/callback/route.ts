/**
 * Auth Callback Route
 *
 * Handles the OAuth callback from Supabase after magic link authentication.
 * Exchanges the authorization code for a session and redirects the user.
 *
 * @module app/auth/callback/route
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * GET handler for auth callback
 *
 * This route is called by Supabase after the user clicks the magic link.
 * It exchanges the authorization code for a session.
 *
 * @param request - The incoming request
 * @returns Response redirecting to the appropriate page
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  try {
    if (code) {
      // Create response early so we can set cookies on it
      const response = NextResponse.redirect(new URL(next, request.url))

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options: any) {
              // Set cookies on the response object
              response.cookies.set({
                name,
                value,
                ...options,
              })
            },
            remove(name: string, options: any) {
              // Remove cookies from the response object
              response.cookies.set({
                name,
                value: '',
                ...options,
                maxAge: 0,
              })
            },
          },
          cookieOptions: {
            name: 'sb-auth-token',  // Use simple, consistent cookie name
          },
        }
      )

      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('[Auth Callback] Error exchanging code for session:', error)
        return NextResponse.redirect(new URL('/en/login?error=auth_callback_error', request.url))
      }

      if (!data.user) {
        console.error('[Auth Callback] No user in session data')
        return NextResponse.redirect(new URL('/en/login?error=no_user', request.url))
      }

      // Debug logging
      console.log('[Auth Callback] Session established for user:', data.user.id, 'email:', data.user.email)

      // Get user's role from database to determine redirect
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError || !profile) {
        console.error('[Auth Callback] Error fetching user profile:', profileError)
        // Default to home page if we can't determine role
        return NextResponse.redirect(new URL('/en', request.url))
      }

      // Determine redirect URL based on role
      let redirectUrl: string
      switch (profile.role) {
        case 'superuser':
          redirectUrl = '/en/superuser'
          console.log('[Auth Callback] Redirecting superuser to:', redirectUrl)
          break
        case 'admin':
          redirectUrl = '/en/admin'
          console.log('[Auth Callback] Redirecting admin to:', redirectUrl)
          break
        case 'operator':
          redirectUrl = '/operator'
          console.log('[Auth Callback] Redirecting operator to:', redirectUrl)
          break
        default:
          redirectUrl = '/en'
          console.log('[Auth Callback] Unknown role, redirecting to home:', profile.role)
      }

      // Create new response with role-based redirect
      const roleBasedResponse = NextResponse.redirect(new URL(redirectUrl, request.url))

      // Copy all cookies from original response to new response
      response.cookies.getAll().forEach(cookie => {
        roleBasedResponse.cookies.set(cookie)
      })

      return roleBasedResponse
    }

    // No code provided, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error)
    return NextResponse.redirect(new URL('/login?error=unexpected_error', request.url))
  }
}
