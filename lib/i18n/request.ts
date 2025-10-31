/**
 * Server-side i18n utilities
 *
 * Provides functions to get translations on the server side.
 */

import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from './config'

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  const locale = await requestLocale

  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as (typeof locales)[number])) {
    notFound()
  }

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
  }
})
