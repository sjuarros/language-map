/**
 * @file middleware.ts
 * @description Next.js middleware configuration for internationalization (i18n)
 *
 * This middleware:
 * - Handles locale-based routing using next-intl
 * - Ensures all URLs include a locale prefix (e.g., /en/, /nl/, /fr/)
 * - Redirects to default locale when needed
 * - Applies to all routes except static assets
 *
 * Configuration:
 * - Supports English (en), Dutch (nl), and French (fr)
 * - Default locale is English (en)
 * - localePrefix: 'always' forces locale in URL for SEO and consistency
 *
 * @module middleware
 */

import createMiddleware from 'next-intl/middleware'

const locales = ['en', 'nl', 'fr'] as const
const defaultLocale = 'en'

export default createMiddleware({
  locales,                    // Supported languages: English, Dutch, French
  defaultLocale,              // Default to English if no locale specified
  localePrefix: 'always',     // Force locale in URL for SEO and consistency
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)'
  ]
}
