/**
 * Input Sanitization Utilities
 * ============================
 * Provides functions to sanitize user input to prevent XSS and injection attacks.
 *
 * @module lib/sanitization
 */

/**
 * Validation limits for string fields
 */
export const VALIDATION_LIMITS = {
  ENDONYM_MAX_LENGTH: 255,
  NAME_MAX_LENGTH: 255,
  DESCRIPTION_MAX_LENGTH: 5000,
  SLUG_MAX_LENGTH: 100,
  ISO_CODE_LENGTH: 3,
  EMAIL_MAX_LENGTH: 255,
} as const

/**
 * Sanitize text input by removing potentially dangerous characters
 * and enforcing length limits
 *
 * @param text - The text to sanitize
 * @param maxLength - Maximum allowed length (default: 255)
 * @returns Sanitized text
 */
export function sanitizeText(text: string, maxLength: number = VALIDATION_LIMITS.NAME_MAX_LENGTH): string {
  if (!text) return ''

  return text
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
    .slice(0, maxLength)
}

/**
 * Sanitize slug input (used for URLs)
 * Ensures only lowercase letters, numbers, and hyphens
 *
 * @param slug - The slug to sanitize
 * @returns Sanitized slug
 */
export function sanitizeSlug(slug: string): string {
  if (!slug) return ''

  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '') // Only allow lowercase letters, numbers, hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .slice(0, VALIDATION_LIMITS.SLUG_MAX_LENGTH)
}

/**
 * Sanitize email input
 * Validates format and returns empty string for invalid emails
 *
 * @param email - The email to sanitize
 * @returns Sanitized email or empty string if format is invalid
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ''

  const sanitized = email
    .toLowerCase()
    .trim()
    .slice(0, VALIDATION_LIMITS.EMAIL_MAX_LENGTH)

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(sanitized) ? sanitized : ''
}

/**
 * Sanitize numeric input
 *
 * @param value - The value to sanitize
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Sanitized number or null
 */
export function sanitizeNumber(value: number | undefined | null, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number | null {
  if (value === undefined || value === null || isNaN(value)) {
    return null
  }

  const sanitized = Math.floor(value) // Ensure integer

  if (sanitized < min) return min
  if (sanitized > max) return max

  return sanitized
}

/**
 * Sanitize ISO code input (3-letter lowercase)
 *
 * @param code - The ISO code to sanitize
 * @returns Sanitized ISO code or null if invalid/empty
 */
export function sanitizeISOCode(code: string | undefined | null): string | null {
  if (!code || code === '') return null

  const sanitized = code
    .toLowerCase()
    .trim()
    .replace(/[^a-z]/g, '')
    .slice(0, VALIDATION_LIMITS.ISO_CODE_LENGTH)

  // Must be exactly 3 characters or null
  return sanitized.length === VALIDATION_LIMITS.ISO_CODE_LENGTH ? sanitized : null
}

/**
 * Sanitize UUID input
 * Validates that the string is a valid UUID format
 *
 * @param uuid - The UUID to validate and sanitize
 * @returns Sanitized UUID or null if invalid/empty
 */
export function sanitizeUUID(uuid: string | undefined | null): string | null {
  if (!uuid || uuid === '') return null

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  const sanitized = uuid.trim().toLowerCase()

  return uuidRegex.test(sanitized) ? sanitized : null
}

/**
 * Sanitize an array of UUIDs
 *
 * @param uuids - Array of UUIDs to sanitize
 * @returns Array of valid UUIDs
 */
export function sanitizeUUIDArray(uuids: string[] | undefined | null): string[] {
  if (!uuids || !Array.isArray(uuids)) return []

  return uuids
    .map(sanitizeUUID)
    .filter((uuid): uuid is string => uuid !== null)
}

/**
 * Sanitize description/long text input
 * Allows more length but still removes dangerous content
 *
 * @param text - The description to sanitize
 * @returns Sanitized description
 */
export function sanitizeDescription(text: string | undefined | null): string {
  if (!text) return ''

  return text
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH)
}
