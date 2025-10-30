/**
 * @file config.test.ts
 * @description Unit tests for i18n configuration.
 */

import { describe, it, expect } from 'vitest'
import { locales, defaultLocale, localeNames, type Locale } from './config'

describe('i18n Configuration', () => {
  describe('locales', () => {
    it('should have correct locale values', () => {
      expect(locales).toEqual(['en', 'nl', 'fr'])
    })

    it('should be a readonly tuple', () => {
      const localesArray: readonly string[] = locales
      expect(localesArray).toEqual(['en', 'nl', 'fr'])
    })

    it('should contain only supported locale codes', () => {
      const supportedCodes = ['en', 'nl', 'fr']
      locales.forEach((locale) => {
        expect(supportedCodes).toContain(locale)
      })
    })

    it('should match Locale type', () => {
      const locale: Locale = 'en'
      expect(locale).toBe('en')
      expect(locales).toContain(locale)
    })
  })

  describe('defaultLocale', () => {
    it('should be one of the supported locales', () => {
      expect(locales).toContain(defaultLocale)
    })

    it('should be "en"', () => {
      expect(defaultLocale).toBe('en')
    })
  })

  describe('localeNames', () => {
    it('should have names for all supported locales', () => {
      locales.forEach((locale) => {
        expect(localeNames).toHaveProperty(locale)
        expect(localeNames[locale]).toBeTruthy()
      })
    })

    it('should have correct locale names', () => {
      expect(localeNames.en).toBe('English')
      expect(localeNames.nl).toBe('Nederlands')
      expect(localeNames.fr).toBe('Français')
    })

    it('should have string values', () => {
      Object.values(localeNames).forEach((name) => {
        expect(typeof name).toBe('string')
        expect(name.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Type safety', () => {
    it('should allow only valid locales for Locale type', () => {
      const validLocales: Locale[] = ['en', 'nl', 'fr']
      validLocales.forEach((locale) => {
        expect(locales).toContain(locale)
      })
    })

    // SKIPPED: This test verifies TypeScript compile-time type safety, not runtime behavior.
    // The test expects 'de' to be rejected at compile time (with @ts-expect-error),
    // but in reality, the variable gets the value 'de' and is not undefined at runtime.
    // Type safety should be enforced by the TypeScript compiler during build, not tested at runtime.
    it.skip('should not allow invalid locales', () => {
      // @ts-expect-error - Testing that invalid locales are not allowed
      const invalidLocale: Locale = 'de'
      expect(invalidLocale).toBeUndefined()
    })
  })
})
