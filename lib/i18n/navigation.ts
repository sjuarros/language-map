/**
 * Internationalized Navigation
 *
 * Provides i18n-aware navigation components (Link, redirect, etc.)
 */

import { createNavigation } from 'next-intl/navigation'
import { locales, defaultLocale } from './config'

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  defaultLocale,
})
