/**
 * Internationalization Configuration
 *
 * Defines supported locales and default locale for the application.
 * Uses next-intl for routing and translations.
 */

export const locales = ['en', 'nl', 'fr'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  nl: 'Nederlands',
  fr: 'Français',
}
