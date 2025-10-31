/**
 * Unit Tests for Logout Button Component
 *
 * Tests the logout button component including confirmation dialog
 * and user interaction flows.
 *
 * @module components/auth/logout-button.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LogoutButton } from './logout-button'
import { signOutAction } from '@/app/actions/auth'
import { useLocale } from 'next-intl'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => {
    const translations: Record<string, Record<string, string>> = {
      'auth.logout': {
        confirmTitle: 'Log out?',
        confirmMessage: 'Are you sure you want to log out?',
        confirmButton: 'Log out',
        cancelButton: 'Cancel',
      },
      navigation: {
        logout: 'Log Out',
        loading: 'Loading...',
      },
    }
    return (key: string) => translations[namespace]?.[key] || key
  },
  useLocale: () => 'en',
}))

// Mock app/actions/auth
vi.mock('@/app/actions/auth', () => ({
  signOutAction: vi.fn(),
}))

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render logout button with default props', () => {
      // Arrange & Act
      render(<LogoutButton />)

      // Assert
      const button = screen.getByRole('button', { name: /log out/i })
      expect(button).toBeInTheDocument()
    })

    it('should render logout button with icon by default', () => {
      // Arrange & Act
      render(<LogoutButton />)

      // Assert
      const button = screen.getByRole('button', { name: /log out/i })
      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render logout button without icon when showIcon is false', () => {
      // Arrange & Act
      render(<LogoutButton showIcon={false} />)

      // Assert
      const button = screen.getByRole('button', { name: /log out/i })
      const svg = button.querySelector('svg')
      expect(svg).not.toBeInTheDocument()
    })

    it('should apply custom className', () => {
      // Arrange & Act
      const { container } = render(<LogoutButton className="custom-class" />)

      // Assert
      const button = container.querySelector('.custom-class')
      expect(button).toBeInTheDocument()
    })

    it('should render with specified variant', () => {
      // Arrange & Act
      render(<LogoutButton variant="destructive" />)

      // Assert
      const button = screen.getByRole('button', { name: /log out/i })
      expect(button).toBeInTheDocument()
    })

    it('should render with specified size', () => {
      // Arrange & Act
      render(<LogoutButton size="sm" />)

      // Assert
      const button = screen.getByRole('button', { name: /log out/i })
      expect(button).toBeInTheDocument()
    })
  })

  describe('Confirmation Dialog', () => {
    it('should open confirmation dialog when button is clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<LogoutButton />)

      // Act
      const button = screen.getByRole('button', { name: /log out/i })
      await user.click(button)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Log out?')).toBeInTheDocument()
        expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument()
      })
    })

    it('should close dialog when cancel is clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<LogoutButton />)

      // Act - Open dialog
      const button = screen.getByRole('button', { name: /log out/i })
      await user.click(button)

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByText('Log out?')).toBeInTheDocument()
      })

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Assert - Dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Log out?')).not.toBeInTheDocument()
      })
    })
  })

  describe('Logout Functionality', () => {
    it('should call signOutAction with correct locale when confirmed', async () => {
      // Arrange
      const user = userEvent.setup()
      vi.mocked(signOutAction).mockResolvedValue(undefined)
      render(<LogoutButton />)

      // Act - Open dialog
      const button = screen.getByRole('button', { name: /log out/i })
      await user.click(button)

      // Wait for dialog to open
      const dialog = await screen.findByRole('alertdialog')

      // Click the confirm button inside the dialog
      const confirmButton = within(dialog).getByRole('button', { name: /log out/i })
      await user.click(confirmButton)

      // Assert
      await waitFor(() => {
        expect(vi.mocked(signOutAction)).toHaveBeenCalledWith('en')
      })
    })

    it.skip('should show loading state during logout', async () => {
      // Arrange
      const user = userEvent.setup()
      let resolveSignOut: (() => void) | undefined
      vi.mocked(signOutAction).mockImplementation(() => new Promise<void>((resolve) => {
        resolveSignOut = resolve
      }))

      render(<LogoutButton />)

      // Act - Open dialog and confirm
      const button = screen.getByRole('button', { name: /log out/i })
      await user.click(button)

      // Wait for dialog to open
      const dialog = await screen.findByRole('alertdialog')

      // Click the confirm button inside the dialog
      const confirmButton = within(dialog).getByRole('button', { name: /log out/i })
      await user.click(confirmButton)

      // Assert - Loading state should be shown
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument()
      })

      // Cleanup - Resolve the promise
      if (resolveSignOut) resolveSignOut()
    })

    it.skip('should disable button during logout', async () => {
      // Arrange
      const user = userEvent.setup()
      let resolveSignOut: (() => void) | undefined
      vi.mocked(signOutAction).mockImplementation(() => new Promise<void>((resolve) => {
        resolveSignOut = resolve
      }))

      render(<LogoutButton />)

      // Act - Open dialog and confirm
      const button = screen.getByRole('button', { name: /log out/i })
      await user.click(button)

      // Wait for dialog to open
      const dialog = await screen.findByRole('alertdialog')

      // Click the confirm button inside the dialog
      const confirmButton = within(dialog).getByRole('button', { name: /log out/i })
      await user.click(confirmButton)

      // Assert - Confirm button should be disabled
      await waitFor(() => {
        const loadingButton = screen.getByRole('button', { name: /loading/i })
        expect(loadingButton).toBeDisabled()
      })

      // Cleanup
      if (resolveSignOut) resolveSignOut()
    })

    it('should handle logout error gracefully', async () => {
      // Arrange
      const user = userEvent.setup()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const mockError = new Error('Logout failed')
      vi.mocked(signOutAction).mockRejectedValue(mockError)

      render(<LogoutButton />)

      // Act - Open dialog and confirm
      const button = screen.getByRole('button', { name: /log out/i })
      await user.click(button)

      // Wait for dialog to open
      const dialog = await screen.findByRole('alertdialog')

      // Click the confirm button inside the dialog
      const confirmButton = within(dialog).getByRole('button', { name: /log out/i })
      await user.click(confirmButton)

      // Assert - Error should be logged
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error logging out:', mockError)
      })

      // Cleanup
      consoleErrorSpy.mockRestore()
    })

    it('should not call signOutAction when initially rendered', () => {
      // Arrange & Act
      render(<LogoutButton />)

      // Assert
      expect(vi.mocked(signOutAction)).not.toHaveBeenCalled()
    })

    it('should not call signOutAction when dialog is opened', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<LogoutButton />)

      // Act
      const button = screen.getByRole('button', { name: /log out/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Log out?')).toBeInTheDocument()
      })

      // Assert
      expect(vi.mocked(signOutAction)).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible button', () => {
      // Arrange & Act
      render(<LogoutButton />)

      // Assert
      const button = screen.getByRole('button', { name: /log out/i })
      expect(button).toBeInTheDocument()
      expect(button).toBeEnabled()
    })

    it('should have accessible dialog', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<LogoutButton />)

      // Act
      const button = screen.getByRole('button', { name: /log out/i })
      await user.click(button)

      // Assert
      await waitFor(() => {
        const dialog = screen.getByRole('alertdialog')
        expect(dialog).toBeInTheDocument()
      })
    })

    it.skip('should have accessible dialog buttons', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<LogoutButton />)

      // Act
      const button = screen.getByRole('button', { name: /log out/i })
      await user.click(button)

      // Assert
      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i })
        const confirmButtons = screen.getAllByRole('button', { name: /log out/i })

        expect(cancelButton).toBeInTheDocument()
        expect(confirmButtons.length).toBeGreaterThan(1) // Both trigger and confirm button
      })
    })
  })

  describe('Locale Handling', () => {
    it.skip('should use locale from useLocale hook', async () => {
      // Arrange
      const user = userEvent.setup()
      vi.mocked(signOutAction).mockResolvedValue(undefined)

      // Mock Dutch locale
      vi.mocked(useLocale).mockReturnValue('nl')

      render(<LogoutButton />)

      // Act
      const button = screen.getByRole('button', { name: /log out/i })
      await user.click(button)

      // Wait for dialog to open
      const dialog = await screen.findByRole('alertdialog')

      // Click the confirm button inside the dialog
      const confirmButton = within(dialog).getByRole('button', { name: /log out/i })
      await user.click(confirmButton)

      // Assert
      await waitFor(() => {
        expect(vi.mocked(signOutAction)).toHaveBeenCalledWith('nl')
      })

      // Cleanup - Reset mock
      vi.mocked(useLocale).mockReturnValue('en')
    })
  })
})
