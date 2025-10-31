/**
 * City Validation Schemas
 *
 * Zod schemas for validating city creation and updates.
 */

import { z } from 'zod'

/**
 * Schema for creating a new city with translations
 */
export const createCityFormSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .toLowerCase(),

  country: z.string().min(1, 'Country is required'),

  center_lat: z.coerce.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),

  center_lng: z.coerce.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),

  default_zoom: z.coerce.number().int().min(1, 'Zoom must be between 1 and 20').max(20, 'Zoom must be between 1 and 20'),

  // English translations
  name_en: z.string().min(1, 'English name is required').max(255, 'Name too long'),
  description_en: z.string().min(1, 'English description is required').max(2000, 'Description too long'),

  // Dutch translations
  name_nl: z.string().min(1, 'Dutch name is required').max(255, 'Name too long'),
  description_nl: z.string().min(1, 'Dutch description is required').max(2000, 'Description too long'),

  // French translations
  name_fr: z.string().min(1, 'French name is required').max(255, 'Name too long'),
  description_fr: z.string().min(1, 'French description is required').max(2000, 'Description too long'),
})

/**
 * Type for creating a city
 */
export type CreateCityFormData = z.infer<typeof createCityFormSchema>
