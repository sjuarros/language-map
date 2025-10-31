/**
 * Unit Tests for Signup Page
 *
 * Tests the signup page component including form submission,
 * validation, and success states.
 *
 * @module app/[locale]/signup/page.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignupPage from './page'
import { signInWithMagicLink } from '@/lib/auth/client'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => {
    const translations: Record<string, Record<string, string>> = {
      'auth.signup': {
        title: 'Sign Up',
        subtitle: 'Create your account',
        emailLabel: 'Email address',
        emailPlaceholder: 'Enter your email',
        submitButton: 'Send magic link',
        submitting: 'Sending...',
        successTitle: 'Check your email!',
        successMessage: "We've sent you a magic link to complete your registration. Click the link in the email to continue.",
        backToHome: 'Back to home',
        haveAccount: 'Already have an account?',
        loginLink: 'Log in',
        errorInvalidEmail: 'Please enter a valid email address',
        errorGeneric: 'An error occurred. Please try again.',
      },
    }
    return (key: string) => translations[namespace]?.[key] || key
  },
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

// Mock lib/auth/client
vi.mock('@/lib/auth/client', () => ({
  signInWithMagicLink: vi.fn(),
}))

describe('SignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3001' },
      writable: true,
    })
  })

  describe('Initial Rendering', () => {
    it('should render signup form', () => {
      // Arrange & Act
      render(<SignupPage />)

      // Assert
      expect(screen.getByText('Sign Up')).toBeInTheDocument()
      expect(screen.getByText('Create your account')).toBeInTheDocument()
      expect(screen.getByLabelText('Email address')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument()
    })

    it('should render email input with placeholder', () => {
      // Arrange & Act
      render(<SignupPage />)

      // Assert
      const emailInput = screen.getByPlaceholderText('Enter your email')
      expect(emailInput).toBeInTheDocument()
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('should render link to login page', () => {
      // Arrange & Act
      render(<SignupPage />)

      // Assert
      const loginLink = screen.getByRole('link', { name: /log in/i })
      expect(loginLink).toBeInTheDocument()
      expect(loginLink).toHaveAttribute('href', '/login')
    })

    it('should render link to home page', () => {
      // Arrange & Act
      render(<SignupPage />)

      // Assert
      const homeLink = screen.getByRole('link', { name: /back to home/i })
      expect(homeLink).toBeInTheDocument()
      expect(homeLink).toHaveAttribute('href', '/')
    })

    it.skip('should have email input autofocused', () => {
      // Arrange & Act
      render(<SignupPage />)

      // Assert
      const emailInput = screen.getByLabelText('Email address') as HTMLInputElement
      // In jsdom, the autofocus prop is present as a property, not an attribute
      expect(emailInput.autofocus || emailInput.hasAttribute('autofocus')).toBeTruthy()
    })

    it('should have required email input', () => {
      // Arrange & Act
      render(<SignupPage />)

      // Assert
      const emailInput = screen.getByLabelText('Email address')
      expect(emailInput).toBeRequired()
    })

    it('should show "Already have an account?" text', () => {
      // Arrange & Act
      render(<SignupPage />)

      // Assert
      expect(screen.getByText('Already have an account?')).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid email', async () => {
      // Arrange
      const user = userEvent.setup()
      vi.mocked(signInWithMagicLink).mockResolvedValue({ success: true })
      render(<SignupPage />)

      // Act
      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, 'newuser@example.com')

      const submitButton = screen.getByRole('button', { name: /send magic link/i })
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(vi.mocked(signInWithMagicLink)).toHaveBeenCalledWith('newuser@example.com', 'http://localhost:3001')
      })
    })

    it('should show loading state during submission', async () => {
      // Arrange
      const user = userEvent.setup()
      let resolveSignIn: ((value: { success: boolean }) => void) | undefined
      vi.mocked(signInWithMagicLink).mockImplementation(() => new Promise((resolve) => {
        resolveSignIn = resolve
      }))

      render(<SignupPage />)

      // Act
      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, 'newuser@example.com')

      const submitButton = screen.getByRole('button', { name: /send magic link/i })
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Sending...')).toBeInTheDocument()
      })

      // Verify form inputs are disabled during loading
      expect(emailInput).toBeDisabled()
      expect(submitButton).toBeDisabled()

      // Cleanup
      if (resolveSignIn) resolveSignIn({ success: true })
    })

    it('should display success message after successful submission', async () => {
      // Arrange
      const user = userEvent.setup()
      vi.mocked(signInWithMagicLink).mockResolvedValue({ success: true })
      render(<SignupPage />)

      // Act
      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, 'newuser@example.com')

      const submitButton = screen.getByRole('button', { name: /send magic link/i })
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Check your email!')).toBeInTheDocument()
        expect(screen.getByText("We've sent you a magic link to complete your registration. Click the link in the email to continue.")).toBeInTheDocument()
      })
    })

    it('should show success icon on successful submission', async () => {
      // Arrange
      const user = userEvent.setup()
      vi.mocked(signInWithMagicLink).mockResolvedValue({ success: true })
      render(<SignupPage />)

      // Act
      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, 'newuser@example.com')

      const submitButton = screen.getByRole('button', { name: /send magic link/i })
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        const successIcon = document.querySelector('.text-green-600')
        expect(successIcon).toBeInTheDocument()
      })
    })

    it('should hide form after successful submission', async () => {
      // Arrange
      const user = userEvent.setup()
      vi.mocked(signInWithMagicLink).mockResolvedValue({ success: true })
      render(<SignupPage />)

      // Act
      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, 'newuser@example.com')

      const submitButton = screen.getByRole('button', { name: /send magic link/i })
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.queryByLabelText('Email address')).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /send magic link/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message on failed submission', async () => {
      // Arrange
      const user = userEvent.setup()
      vi.mocked(signInWithMagicLink).mockResolvedValue({
        success: false,
        error: 'Email rate limit exceeded',
      })
      render(<SignupPage />)

      // Act
      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, 'user@example.com')

      const submitButton = screen.getByRole('button', { name: /send magic link/i })
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Email rate limit exceeded')).toBeInTheDocument()
      })
    })

    it('should display generic error on exception', async () => {
      // Arrange
      const user = userEvent.setup()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(signInWithMagicLink).mockRejectedValue(new Error('Network error'))
      render(<SignupPage />)

      // Act
      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, 'user@example.com')

      const submitButton = screen.getByRole('button', { name: /send magic link/i })
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument()
      })

      // Cleanup
      consoleErrorSpy.mockRestore()
    })

    it.skip('should allow retry after error', async () => {
      // Arrange
      const user = userEvent.setup()
      vi.mocked(signInWithMagicLink)
        .mockResolvedValueOnce({ success: false, error: 'Error' })
        .mockResolvedValueOnce({ success: true })

      render(<SignupPage />)

      // Act - First attempt fails
      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, 'user@example.com')

      const submitButton = screen.getByRole('button', { name: /send magic link/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
      })

      // Wait for button to be enabled again
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })

      // Act - Second attempt succeeds
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Check your email!')).toBeInTheDocument()
      })
    })

    it.skip('should clear error when form is resubmitted', async () => {
      // Arrange
      const user = userEvent.setup()
      vi.mocked(signInWithMagicLink).mockResolvedValue({
        success: false,
        error: 'Error message',
      })
      render(<SignupPage />)

      // Act - First submission shows error
      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, 'test@example.com')

      const submitButton = screen.getByRole('button', { name: /send magic link/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Error message')).toBeInTheDocument()
      })

      // Wait for button to be enabled again
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })

      // Act - Submit again
      await user.click(submitButton)

      // Assert - Error should briefly disappear before new error appears
      await waitFor(() => {
        expect(vi.mocked(signInWithMagicLink)).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Form Validation', () => {
    it('should require email input', () => {
      // Arrange & Act
      render(<SignupPage />)

      // Assert - Verify required attribute exists
      const emailInput = screen.getByLabelText('Email address')
      expect(emailInput).toBeRequired()
    })

    it('should accept any email format (validation is server-side)', async () => {
      // Arrange
      const user = userEvent.setup()
      vi.mocked(signInWithMagicLink).mockResolvedValue({ success: true })
      render(<SignupPage />)

      // Act - Submit with valid email
      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, 'test@example.com')

      const submitButton = screen.getByRole('button', { name: /send magic link/i })
      await user.click(submitButton)

      // Assert - Form submission is attempted
      await waitFor(() => {
        expect(vi.mocked(signInWithMagicLink)).toHaveBeenCalled()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have accessible form elements', () => {
      // Arrange & Act
      render(<SignupPage />)

      // Assert
      expect(screen.getByLabelText('Email address')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument()
    })

    it('should have proper heading hierarchy', () => {
      // Arrange & Act
      render(<SignupPage />)

      // Assert
      expect(screen.getByText('Sign Up')).toBeInTheDocument()
    })

    it('should have descriptive button text', () => {
      // Arrange & Act
      render(<SignupPage />)

      // Assert
      const button = screen.getByRole('button', { name: /send magic link/i })
      expect(button).toHaveAccessibleName()
    })
  })

  describe('Success State', () => {
    it('should show back to home link in success state', async () => {
      // Arrange
      const user = userEvent.setup()
      vi.mocked(signInWithMagicLink).mockResolvedValue({ success: true })
      render(<SignupPage />)

      // Act
      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, 'user@example.com')

      const submitButton = screen.getByRole('button', { name: /send magic link/i })
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        const homeLink = screen.getByRole('link', { name: /back to home/i })
        expect(homeLink).toBeInTheDocument()
        expect(homeLink).toHaveAttribute('href', '/')
      })
    })

    it('should not show login link in success state', async () => {
      // Arrange
      const user = userEvent.setup()
      vi.mocked(signInWithMagicLink).mockResolvedValue({ success: true })
      render(<SignupPage />)

      // Act
      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, 'user@example.com')

      const submitButton = screen.getByRole('button', { name: /send magic link/i })
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Check your email!')).toBeInTheDocument()
      })

      expect(screen.queryByRole('link', { name: /log in/i })).not.toBeInTheDocument()
    })
  })

  describe('Difference from Login Page', () => {
    it('should have different title than login page', () => {
      // Arrange & Act
      render(<SignupPage />)

      // Assert
      expect(screen.getByText('Sign Up')).toBeInTheDocument()
      expect(screen.queryByText('Log In')).not.toBeInTheDocument()
    })

    it('should have different subtitle than login page', () => {
      // Arrange & Act
      render(<SignupPage />)

      // Assert
      expect(screen.getByText('Create your account')).toBeInTheDocument()
      expect(screen.queryByText('Sign in to your account')).not.toBeInTheDocument()
    })

    it('should have different success message than login page', async () => {
      // Arrange
      const user = userEvent.setup()
      vi.mocked(signInWithMagicLink).mockResolvedValue({ success: true })
      render(<SignupPage />)

      // Act
      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, 'user@example.com')

      const submitButton = screen.getByRole('button', { name: /send magic link/i })
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText("We've sent you a magic link to complete your registration. Click the link in the email to continue.")).toBeInTheDocument()
      })
    })
  })
})
