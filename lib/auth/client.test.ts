/**
 * Unit Tests for Authentication Client
 *
 * Tests all authentication client functions including magic link sign-in,
 * sign-out, and session management.
 *
 * @module lib/auth/client.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { signInWithMagicLink, signOut, getSession, getCurrentUser } from './client'
import { createBrowserClient } from '@supabase/ssr'

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(),
}))

interface MockSupabaseClient {
  auth: {
    signInWithOtp: ReturnType<typeof vi.fn>
    signOut: ReturnType<typeof vi.fn>
    getSession: ReturnType<typeof vi.fn>
    getUser: ReturnType<typeof vi.fn>
  }
}

describe('lib/auth/client', () => {
  let mockSupabaseClient: MockSupabaseClient

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Create a mock Supabase client
    mockSupabaseClient = {
      auth: {
        signInWithOtp: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn(),
        getUser: vi.fn(),
      },
    }

    // Mock the createBrowserClient to return our mock
    vi.mocked(createBrowserClient).mockReturnValue(mockSupabaseClient as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('signInWithMagicLink', () => {
    describe('Input Validation', () => {
      it('should reject null email', async () => {
        // Arrange & Act
        const result = await signInWithMagicLink(null as unknown as string)

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toBe('Email is required and must be a string')
      })

      it('should reject undefined email', async () => {
        // Arrange & Act
        const result = await signInWithMagicLink(undefined as unknown as string)

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toBe('Email is required and must be a string')
      })

      it('should reject non-string email', async () => {
        // Arrange & Act
        const result = await signInWithMagicLink(123 as unknown as string)

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toBe('Email is required and must be a string')
      })

      it('should reject empty string email', async () => {
        // Arrange & Act
        const result = await signInWithMagicLink('')

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toBe('Email must be between 1 and 254 characters')
      })

      it('should reject email with only whitespace', async () => {
        // Arrange & Act
        const result = await signInWithMagicLink('   ')

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toBe('Email must be between 1 and 254 characters')
      })

      it('should reject email exceeding 254 characters', async () => {
        // Arrange
        const longEmail = 'a'.repeat(250) + '@example.com' // 262 characters

        // Act
        const result = await signInWithMagicLink(longEmail)

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toBe('Email must be between 1 and 254 characters')
      })

      it('should reject invalid email format - no @ symbol', async () => {
        // Arrange & Act
        const result = await signInWithMagicLink('notanemail')

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toBe('Please enter a valid email address')
      })

      it('should reject invalid email format - no domain', async () => {
        // Arrange & Act
        const result = await signInWithMagicLink('user@')

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toBe('Please enter a valid email address')
      })

      it('should reject invalid email format - no TLD', async () => {
        // Arrange & Act
        const result = await signInWithMagicLink('user@domain')

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toBe('Please enter a valid email address')
      })

      it('should reject invalid email format - spaces', async () => {
        // Arrange & Act
        const result = await signInWithMagicLink('user name@example.com')

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toBe('Please enter a valid email address')
      })

      it('should accept valid email and trim whitespace', async () => {
        // Arrange
        mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({ error: null })

        // Act
        const result = await signInWithMagicLink('  user@example.com  ')

        // Assert
        expect(result.success).toBe(true)
        expect(mockSupabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
          email: 'user@example.com',
          options: {
            emailRedirectTo: undefined,
          },
        })
      })

      it('should reject non-string redirectTo', async () => {
        // Arrange & Act
        const result = await signInWithMagicLink('user@example.com', 123 as unknown as string)

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toBe('Redirect URL must be a string')
      })

      it('should reject invalid redirectTo format - no leading slash or http', async () => {
        // Arrange & Act
        const result = await signInWithMagicLink('user@example.com', 'dashboard')

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toBe('Invalid redirect URL format')
      })

      it('should accept relative URL redirectTo', async () => {
        // Arrange
        mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({ error: null })

        // Act
        const result = await signInWithMagicLink('user@example.com', '/dashboard')

        // Assert
        expect(result.success).toBe(true)
        expect(mockSupabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
          email: 'user@example.com',
          options: {
            emailRedirectTo: '/dashboard',
          },
        })
      })

      it('should accept absolute URL redirectTo', async () => {
        // Arrange
        mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({ error: null })

        // Act
        const result = await signInWithMagicLink('user@example.com', 'https://example.com/dashboard')

        // Assert
        expect(result.success).toBe(true)
        expect(mockSupabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
          email: 'user@example.com',
          options: {
            emailRedirectTo: 'https://example.com/dashboard',
          },
        })
      })
    })

    describe('Successful Sign-In', () => {
      it('should successfully send magic link with valid email', async () => {
        // Arrange
        mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({ error: null })

        // Act
        const result = await signInWithMagicLink('user@example.com')

        // Assert
        expect(result.success).toBe(true)
        expect(result.error).toBeUndefined()
        expect(mockSupabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
          email: 'user@example.com',
          options: {
            emailRedirectTo: undefined,
          },
        })
      })

      it('should successfully send magic link with redirect URL', async () => {
        // Arrange
        mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({ error: null })

        // Act
        const result = await signInWithMagicLink('user@example.com', '/operator/amsterdam')

        // Assert
        expect(result.success).toBe(true)
        expect(mockSupabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
          email: 'user@example.com',
          options: {
            emailRedirectTo: '/operator/amsterdam',
          },
        })
      })
    })

    describe('Error Handling', () => {
      it('should handle Supabase API error - rate limit', async () => {
        // Arrange
        const mockError = { message: 'Email rate limit exceeded' }
        mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({ error: mockError })

        // Act
        const result = await signInWithMagicLink('user@example.com')

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toBe('Email rate limit exceeded')
      })

      it('should handle Supabase API error - invalid email', async () => {
        // Arrange
        const mockError = { message: 'Invalid email format' }
        mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({ error: mockError })

        // Act
        const result = await signInWithMagicLink('user@example.com')

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toBe('Invalid email format')
      })

      it('should handle unexpected exception', async () => {
        // Arrange
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const mockError = new Error('Network failure')
        mockSupabaseClient.auth.signInWithOtp.mockRejectedValue(mockError)

        // Act
        const result = await signInWithMagicLink('user@example.com')

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toBe('Network failure')
        expect(consoleErrorSpy).toHaveBeenCalledWith('Unexpected error in signInWithMagicLink:', mockError)

        // Cleanup
        consoleErrorSpy.mockRestore()
      })

      it('should handle non-Error exception', async () => {
        // Arrange
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        mockSupabaseClient.auth.signInWithOtp.mockRejectedValue('String error')

        // Act
        const result = await signInWithMagicLink('user@example.com')

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toBe('An unexpected error occurred')

        // Cleanup
        consoleErrorSpy.mockRestore()
      })
    })
  })

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      // Arrange
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null })

      // Act
      const result = await signOut()

      // Assert
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
    })

    it('should handle sign out error', async () => {
      // Arrange
      const mockError = { message: 'Session not found' }
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: mockError })

      // Act
      const result = await signOut()

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Session not found')
    })

    it('should handle unexpected exception during sign out', async () => {
      // Arrange
      const mockError = new Error('Network error')
      mockSupabaseClient.auth.signOut.mockRejectedValue(mockError)

      // Act
      const result = await signOut()

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('should handle non-Error exception during sign out', async () => {
      // Arrange
      mockSupabaseClient.auth.signOut.mockRejectedValue('Unexpected error')

      // Act
      const result = await signOut()

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('An unexpected error occurred')
    })
  })

  describe('getSession', () => {
    it('should return session when available', async () => {
      // Arrange
      const mockSession = {
        access_token: 'test-token',
        user: { id: '123', email: 'user@example.com' },
      }
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      // Act
      const result = await getSession()

      // Assert
      expect(result).toEqual(mockSession)
      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled()
    })

    it('should return null when no session exists', async () => {
      // Arrange
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      // Act
      const result = await getSession()

      // Assert
      expect(result).toBeNull()
    })

    it('should return null on error and log error', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const mockError = { message: 'Session retrieval failed' }
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: mockError,
      })

      // Act
      const result = await getSession()

      // Assert
      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting session:', mockError)

      // Cleanup
      consoleErrorSpy.mockRestore()
    })

    it('should handle unexpected exception', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const mockError = new Error('Network error')
      mockSupabaseClient.auth.getSession.mockRejectedValue(mockError)

      // Act
      const result = await getSession()

      // Assert
      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting session:', mockError)

      // Cleanup
      consoleErrorSpy.mockRestore()
    })
  })

  describe('getCurrentUser', () => {
    it('should return user when authenticated', async () => {
      // Arrange
      const mockUser = {
        id: '123',
        email: 'user@example.com',
        role: 'authenticated',
      }
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Act
      const result = await getCurrentUser()

      // Assert
      expect(result).toEqual(mockUser)
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled()
    })

    it('should return null when not authenticated', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      // Act
      const result = await getCurrentUser()

      // Assert
      expect(result).toBeNull()
    })

    it('should return null on error and log error', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const mockError = { message: 'User retrieval failed' }
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: mockError,
      })

      // Act
      const result = await getCurrentUser()

      // Assert
      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting user:', mockError)

      // Cleanup
      consoleErrorSpy.mockRestore()
    })

    it('should handle unexpected exception', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const mockError = new Error('Network error')
      mockSupabaseClient.auth.getUser.mockRejectedValue(mockError)

      // Act
      const result = await getCurrentUser()

      // Assert
      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting user:', mockError)

      // Cleanup
      consoleErrorSpy.mockRestore()
    })
  })
})
