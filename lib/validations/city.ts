/**
 * @file lib/validations/city.ts
 * @description Zod schemas for validating city creation and updates with
 * comprehensive input validation for all city-related form data.
 * Includes validation for geographic coordinates, slugs, and multilingual content.
 */

import { z } from 'zod'

/**
 * Zod schema for validating city creation form data with translations.
 *
 * Validates all required fields including geographic coordinates, slug format,
 * and localized names/descriptions for English, Dutch, and French.
 * Ensures data integrity before database insertion.
 *
 * @returns Zod schema object for form validation
 *
 * @example
 * ```typescript
 * const formData = {
 *   slug: 'amsterdam',
 *   country_id: 'uuid-here',
 *   center_lat: 52.3676,
 *   center_lng: 4.9041,
 *   default_zoom: 12,
 *   name_en: 'Amsterdam',
 *   description_en: 'Capital city of Netherlands',
 *   name_nl: 'Amsterdam',
 *   description_nl: 'Hoofdstad van Nederland',
 *   name_fr: 'Amsterdam',
 *   description_fr: 'Capitale des Pays-Bas'
 * }
 * const result = createCityFormSchema.parse(formData)
 * ```
 */
export const createCityFormSchema = z.object({
  /**
   * URL-friendly identifier for the city (lowercase alphanumeric + hyphens)
   * Used in routing (/en/amsterdam) and database keys
   * Automatically converted to lowercase
   */
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .toLowerCase(),

  /**
   * UUID of the parent country
   * References countries.id in database
   */
  country_id: z.string().uuid('Invalid country ID'),

  /**
   * Geographic center point for map initialization
   * Latitude must be between -90 (south pole) and 90 (north pole)
   * Uses coercion to handle string-to-number conversion from HTML form inputs
   */
  center_lat: z.coerce.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),

  /**
   * Geographic center point for map initialization
   * Longitude must be between -180 (west) and 180 (east)
   * Uses coercion to handle string-to-number conversion from HTML form inputs
   */
  center_lng: z.coerce.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),

  /**
   * Default map zoom level on city page load
   * Must be integer between 1 (zoomed out, showing large area) and 20 (fully zoomed in)
   * Uses coercion to handle string-to-number conversion from HTML form inputs
   */
  default_zoom: z.coerce.number().int().min(1, 'Zoom must be between 1 and 20').max(20, 'Zoom must be between 1 and 20'),

  // ===== TRANSLATION FIELDS =====
  // Each locale requires both name and description fields

  /**
   * English translation: City display name
   * Required for English locale ('en')
   */
  name_en: z.string().min(1, 'English name is required').max(255, 'Name too long'),

  /**
   * English translation: City description/metadata
   * Displayed on city pages and in search results
   */
  description_en: z.string().min(1, 'English description is required').max(2000, 'Description too long'),

  /**
   * Dutch translation: City display name
   * Required for Dutch locale ('nl')
   */
  name_nl: z.string().min(1, 'Dutch name is required').max(255, 'Name too long'),

  /**
   * Dutch translation: City description/metadata
   */
  description_nl: z.string().min(1, 'Dutch description is required').max(2000, 'Description too long'),

  /**
   * French translation: City display name
   * Required for French locale ('fr')
   */
  name_fr: z.string().min(1, 'French name is required').max(255, 'Name too long'),

  /**
   * French translation: City description/metadata
   */
  description_fr: z.string().min(1, 'French description is required').max(2000, 'Description too long'),
})

/**
 * TypeScript type inferred from createCityFormSchema.
 * Represents the validated form data structure for creating a city.
 * All fields are required (non-optional) based on the schema definition.
 *
 * @type CreateCityFormData
 */
export type CreateCityFormData = z.infer<typeof createCityFormSchema>

/**
 * Schema for validating city update form data.
 * Extends create schema but makes all fields optional for partial updates.
 * Used when editing existing cities where not all fields need to be updated.
 *
 * @returns Zod schema object with all fields optional
 *
 * @example
 * ```typescript
 * const updateData = {
 *   name_en: 'Updated Name',
 *   description_en: 'Updated description'
 * }
 * const result = updateCityFormSchema.parse(updateData)
 * ```
 */
export const updateCityFormSchema = createCityFormSchema.partial()

/**
 * TypeScript type inferred from updateCityFormSchema.
 * Represents optional form data for updating a city.
 * All fields are optional to support partial updates.
 *
 * @type UpdateCityFormData
 */
export type UpdateCityFormData = z.infer<typeof updateCityFormSchema>

/**
 * Reusable schema for validating individual city translation data.
 * Used for adding or updating translations for existing cities.
 * Can be used independently or nested within larger validation schemas.
 *
 * @returns Zod schema object for translation validation
 *
 * @example
 * ```typescript
 * const translationData = {
 *   locale: 'en',
 *   name: 'Amsterdam',
 *   description: 'Capital city of Netherlands'
 * }
 * const result = cityTranslationSchema.parse(translationData)
 * ```
 */
export const cityTranslationSchema = z.object({
  /**
   * Locale code (e.g., 'en', 'nl', 'fr')
   * Must be at least 2 characters long
   */
  locale: z.string().min(2, 'Locale must be 2+ characters'),

  /**
   * Translated city name
   * Display name for the specified locale
   */
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),

  /**
   * Translated city description
   * Description/metadata for the specified locale
   */
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
})

/**
 * TypeScript type inferred from cityTranslationSchema.
 * Represents validated translation data for a single locale.
 *
 * @type CityTranslationData
 */
export type CityTranslationData = z.infer<typeof cityTranslationSchema>
