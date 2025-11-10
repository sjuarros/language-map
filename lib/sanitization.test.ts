/**
 * Input Sanitization Utilities Tests
 * ===================================
 * Unit tests for sanitization functions covering:
 * - Email format validation
 * - Text sanitization (XSS prevention)
 * - Slug formatting
 * - Numeric validation
 * - ISO code validation
 * - UUID validation
 *
 * @module lib/sanitization.test
 */

import { describe, it, expect } from 'vitest'
import {
  sanitizeEmail,
  sanitizeText,
  sanitizeSlug,
  sanitizeNumber,
  sanitizeISOCode,
  sanitizeUUID,
  sanitizeUUIDArray,
  sanitizeDescription,
  VALIDATION_LIMITS,
} from './sanitization'

describe('sanitizeEmail', () => {
  it('should sanitize valid email addresses', () => {
    expect(sanitizeEmail('user@example.com')).toBe('user@example.com')
    expect(sanitizeEmail('User@Example.COM')).toBe('user@example.com')
    expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com')
  })

  it('should return empty string for invalid email formats', () => {
    expect(sanitizeEmail('not-an-email')).toBe('')
    expect(sanitizeEmail('missing@domain')).toBe('')
    expect(sanitizeEmail('@example.com')).toBe('')
    expect(sanitizeEmail('user@')).toBe('')
    expect(sanitizeEmail('user @example.com')).toBe('') // Contains whitespace
  })

  it('should return empty string for empty input', () => {
    expect(sanitizeEmail('')).toBe('')
  })

  it('should enforce maximum length', () => {
    const longEmail = 'a'.repeat(250) + '@example.com'
    const sanitized = sanitizeEmail(longEmail)
    expect(sanitized.length).toBeLessThanOrEqual(VALIDATION_LIMITS.EMAIL_MAX_LENGTH)
  })

  it('should handle complex valid email formats', () => {
    expect(sanitizeEmail('user.name+tag@example.co.uk')).toBe('user.name+tag@example.co.uk')
    expect(sanitizeEmail('user_name@sub.example.com')).toBe('user_name@sub.example.com')
  })
})

describe('sanitizeText', () => {
  it('should remove potentially dangerous characters', () => {
    expect(sanitizeText('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
    expect(sanitizeText('Hello <div>World</div>')).toBe('Hello divWorld/div')
  })

  it('should remove JavaScript protocols', () => {
    expect(sanitizeText('javascript:alert(1)')).toBe('alert(1)')
    expect(sanitizeText('JAVASCRIPT:alert(1)')).toBe('alert(1)')
  })

  it('should remove event handlers', () => {
    expect(sanitizeText('onclick=alert(1)')).toBe('alert(1)')
    expect(sanitizeText('onload=malicious()')).toBe('malicious()')
  })

  it('should trim whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello')
  })

  it('should enforce default max length', () => {
    const longText = 'a'.repeat(300)
    expect(sanitizeText(longText).length).toBe(VALIDATION_LIMITS.NAME_MAX_LENGTH)
  })

  it('should respect custom max length', () => {
    const text = 'a'.repeat(100)
    expect(sanitizeText(text, 50).length).toBe(50)
  })

  it('should return empty string for empty input', () => {
    expect(sanitizeText('')).toBe('')
  })
})

describe('sanitizeSlug', () => {
  it('should convert to lowercase', () => {
    expect(sanitizeSlug('Hello-World')).toBe('hello-world')
  })

  it('should remove invalid characters', () => {
    expect(sanitizeSlug('hello world!')).toBe('helloworld')
    expect(sanitizeSlug('hello_world')).toBe('helloworld')
  })

  it('should replace multiple hyphens with single hyphen', () => {
    expect(sanitizeSlug('hello---world')).toBe('hello-world')
  })

  it('should remove leading and trailing hyphens', () => {
    expect(sanitizeSlug('-hello-world-')).toBe('hello-world')
  })

  it('should enforce max length', () => {
    const longSlug = 'a'.repeat(150)
    expect(sanitizeSlug(longSlug).length).toBe(VALIDATION_LIMITS.SLUG_MAX_LENGTH)
  })

  it('should return empty string for empty input', () => {
    expect(sanitizeSlug('')).toBe('')
  })
})

describe('sanitizeNumber', () => {
  it('should return valid numbers', () => {
    expect(sanitizeNumber(42)).toBe(42)
    expect(sanitizeNumber(0)).toBe(0)
  })

  it('should floor decimal numbers', () => {
    expect(sanitizeNumber(42.7)).toBe(42)
    expect(sanitizeNumber(42.2)).toBe(42)
  })

  it('should enforce minimum value', () => {
    expect(sanitizeNumber(-10, 0)).toBe(0)
    expect(sanitizeNumber(5, 10)).toBe(10)
  })

  it('should enforce maximum value', () => {
    expect(sanitizeNumber(1000, 0, 100)).toBe(100)
  })

  it('should return null for invalid input', () => {
    expect(sanitizeNumber(undefined)).toBe(null)
    expect(sanitizeNumber(null)).toBe(null)
    expect(sanitizeNumber(NaN)).toBe(null)
  })
})

describe('sanitizeISOCode', () => {
  it('should sanitize valid ISO codes', () => {
    expect(sanitizeISOCode('eng')).toBe('eng')
    expect(sanitizeISOCode('ENG')).toBe('eng')
    expect(sanitizeISOCode('  eng  ')).toBe('eng')
  })

  it('should return null for codes with invalid length', () => {
    expect(sanitizeISOCode('en')).toBe(null)
    // Note: 'english' gets sliced to 'eng' (first 3 chars), which is valid
    expect(sanitizeISOCode('english')).toBe('eng')
  })

  it('should remove non-letter characters', () => {
    expect(sanitizeISOCode('en1')).toBe(null) // After removing '1', only 'en' remains
    expect(sanitizeISOCode('e-n-g')).toBe('eng')
  })

  it('should return null for empty input', () => {
    expect(sanitizeISOCode('')).toBe(null)
    expect(sanitizeISOCode(undefined)).toBe(null)
    expect(sanitizeISOCode(null)).toBe(null)
  })
})

describe('sanitizeUUID', () => {
  const validUUID = '123e4567-e89b-12d3-a456-426614174000'

  it('should sanitize valid UUIDs', () => {
    expect(sanitizeUUID(validUUID)).toBe(validUUID)
    expect(sanitizeUUID(validUUID.toUpperCase())).toBe(validUUID)
    expect(sanitizeUUID(`  ${validUUID}  `)).toBe(validUUID)
  })

  it('should return null for invalid UUIDs', () => {
    expect(sanitizeUUID('not-a-uuid')).toBe(null)
    expect(sanitizeUUID('123e4567-e89b-12d3-a456')).toBe(null) // Too short
    expect(sanitizeUUID('123e4567-e89b-12d3-a456-42661417400g')).toBe(null) // Contains 'g'
  })

  it('should return null for empty input', () => {
    expect(sanitizeUUID('')).toBe(null)
    expect(sanitizeUUID(undefined)).toBe(null)
    expect(sanitizeUUID(null)).toBe(null)
  })
})

describe('sanitizeUUIDArray', () => {
  const uuid1 = '123e4567-e89b-12d3-a456-426614174000'
  const uuid2 = '987fcdeb-51a2-43f7-b789-123456789abc'

  it('should sanitize array of valid UUIDs', () => {
    const result = sanitizeUUIDArray([uuid1, uuid2])
    expect(result).toEqual([uuid1, uuid2])
  })

  it('should filter out invalid UUIDs', () => {
    const result = sanitizeUUIDArray([uuid1, 'invalid', uuid2])
    expect(result).toEqual([uuid1, uuid2])
  })

  it('should return empty array for empty input', () => {
    expect(sanitizeUUIDArray([])).toEqual([])
    expect(sanitizeUUIDArray(undefined)).toEqual([])
    expect(sanitizeUUIDArray(null)).toEqual([])
  })

  it('should handle arrays with only invalid UUIDs', () => {
    expect(sanitizeUUIDArray(['invalid1', 'invalid2'])).toEqual([])
  })
})

describe('sanitizeDescription', () => {
  it('should remove script tags', () => {
    expect(sanitizeDescription('<script>alert("xss")</script>')).toBe('')
    expect(sanitizeDescription('Hello<script>bad()</script>World')).toBe('HelloWorld')
  })

  it('should remove JavaScript protocols', () => {
    expect(sanitizeDescription('javascript:alert(1)')).toBe('alert(1)')
  })

  it('should remove event handlers', () => {
    expect(sanitizeDescription('onclick=alert(1)')).toBe('alert(1)')
  })

  it('should trim whitespace', () => {
    expect(sanitizeDescription('  hello  ')).toBe('hello')
  })

  it('should enforce max length', () => {
    const longText = 'a'.repeat(6000)
    expect(sanitizeDescription(longText).length).toBe(VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH)
  })

  it('should return empty string for empty input', () => {
    expect(sanitizeDescription('')).toBe('')
    expect(sanitizeDescription(undefined)).toBe('')
    expect(sanitizeDescription(null)).toBe('')
  })

  it('should preserve normal text', () => {
    const normalText = 'This is a normal description with punctuation!'
    expect(sanitizeDescription(normalText)).toBe(normalText)
  })
})
