/**
 * i18n Middleware - Inline Config
 */

import createMiddleware from 'next-intl/middleware'

const locales = ['en', 'nl', 'fr'] as const
const defaultLocale = 'en'

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always', // Always include locale in URL
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)'
  ]
}
