/**
 * Middleware for i18n routing
 *
 * Handles locale detection and routing using next-intl.
 * Redirects users to the appropriate locale-prefixed URL.
 */

import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './lib/i18n/config'

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Don't use a locale prefix for the default locale
  localePrefix: 'always',
})

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(nl|fr|en)/:path*'],
}
