/**
 * Locale Constants
 * ================
 * Centralized locale codes for the application.
 *
 * All locale-related code should use these constants instead of hardcoded strings.
 */

export const LOCALES = {
  ENGLISH: 'en',
  DUTCH: 'nl',
  FRENCH: 'fr',
} as const

export type Locale = typeof LOCALES[keyof typeof LOCALES]

export const SUPPORTED_LOCALES = [
  LOCALES.ENGLISH,
  LOCALES.DUTCH,
  LOCALES.FRENCH,
] as const

export const LOCALE_NAMES = {
  [LOCALES.ENGLISH]: 'English',
  [LOCALES.DUTCH]: 'Dutch',
  [LOCALES.FRENCH]: 'French',
} as const
