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
        return NextResponse.redirect(new URL('/login?error=auth_callback_error', request.url))
      }

      // Debug logging - see what user ID we got
      console.log('[Auth Callback] Session established for user:', data.user?.id, 'email:', data.user?.email)

      return response
    }

    // No code provided, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error)
    return NextResponse.redirect(new URL('/login?error=unexpected_error', request.url))
  }
}
