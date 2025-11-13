/**
 * @file middleware.ts
 * @description Next.js middleware configuration for internationalization (i18n) and session management
 *
 * This middleware:
 * - Handles locale-based routing using next-intl
 * - Ensures all URLs include a locale prefix (e.g., /en/, /nl/, /fr/)
 * - Redirects to default locale when needed
 * - Refreshes Supabase sessions to prevent expiry during navigation
 * - Applies to all routes except static assets
 *
 * Configuration:
 * - Supports English (en), Dutch (nl), and French (fr)
 * - Default locale is English (en)
 * - localePrefix: 'always' forces locale in URL for SEO and consistency
 * - Session refresh: Automatically updates Supabase sessions on each request
 *
 * @module middleware
 */

import { type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const locales = ['en', 'nl', 'fr'] as const
const defaultLocale = 'en'

// Create the i18n middleware
const intlMiddleware = createIntlMiddleware({
  locales,                    // Supported languages: English, Dutch, French
  defaultLocale,              // Default to English if no locale specified
  localePrefix: 'always',     // Force locale in URL for SEO and consistency
})

/**
 * Main middleware that combines i18n and session management
 */
export async function middleware(request: NextRequest) {
  // First, handle i18n
  const response = intlMiddleware(request)

  // Then, handle session refresh using Supabase SSR
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set cookie in request (for this middleware execution)
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Set cookie in response (to send to browser)
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Remove cookie from request
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          // Remove cookie from response
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session (this will update the session if it's close to expiry)
  // This prevents the "session expired" issue during navigation
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'
  ]
}
