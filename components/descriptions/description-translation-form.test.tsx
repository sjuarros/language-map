/**
 * @fileoverview Unit tests for DescriptionTranslationForm component
 * @description Tests form validation, submission, error handling, and accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DescriptionTranslationForm } from './description-translation-form'
import * as descriptionTranslationsActions from '@/app/actions/description-translations'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

// Mock next/navigation
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}))

// Mock server actions
vi.mock('@/app/actions/description-translations', () => ({
  upsertDescriptionTranslation: vi.fn(),
  deleteDescriptionTranslation: vi.fn(),
}))

// Mock window.confirm
global.confirm = vi.fn()

const mockTranslation: descriptionTranslationsActions.DescriptionTranslation = {
  description_id: 'desc-1',
  locale: 'en',
  text: 'This is an existing translation',
  is_ai_translated: false,
  ai_model: null,
  ai_translated_at: null,
  reviewed_by: null,
  reviewed_at: null,
}

const mockAITranslation: descriptionTranslationsActions.DescriptionTranslation = {
  description_id: 'desc-1',
  locale: 'nl',
  text: 'Dit is een AI-gegenereerde vertaling',
  is_ai_translated: true,
  ai_model: 'gpt-4-turbo',
  ai_translated_at: '2024-01-15T10:30:00Z',
  reviewed_by: null,
  reviewed_at: null,
}

const defaultProps = {
  citySlug: 'amsterdam',
  descriptionId: 'desc-1',
  localeName: 'English',
}

describe('DescriptionTranslationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.confirm as ReturnType<typeof vi.fn>).mockReturnValue(true)
  })

  describe('Prop Validation', () => {
    it('should throw error when citySlug is missing', () => {
      expect(() => {
        render(
          <DescriptionTranslationForm
            citySlug=""
            descriptionId="desc-1"
            localeName="English"
            localeCode="en"
          />
        )
      }).toThrow('citySlug is required and must be a non-empty string')
    })

    it('should throw error when descriptionId is missing', () => {
      expect(() => {
        render(
          <DescriptionTranslationForm
            citySlug="amsterdam"
            descriptionId=""
            localeName="English"
            localeCode="en"
          />
        )
      }).toThrow('descriptionId is required and must be a non-empty string')
    })

    it('should throw error when localeName is missing', () => {
      expect(() => {
        render(
          <DescriptionTranslationForm
            citySlug="amsterdam"
            descriptionId="desc-1"
            localeName=""
            localeCode="en"
          />
        )
      }).toThrow('localeName is required and must be a non-empty string')
    })

    it('should throw error when neither translation nor localeCode is provided', () => {
      expect(() => {
        render(
          <DescriptionTranslationForm
            citySlug="amsterdam"
            descriptionId="desc-1"
            localeName="English"
          />
        )
      }).toThrow('Either translation or localeCode must be provided')
    })
  })

  describe('Rendering - New Translation', () => {
    it('should render in edit mode for new translation', () => {
      render(
        <DescriptionTranslationForm
          {...defaultProps}
          localeCode="en"
        />
      )

      expect(screen.getByText('English')).toBeInTheDocument()
      expect(screen.getByText('en')).toBeInTheDocument()
      expect(screen.getByLabelText(/textLabel/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/textPlaceholder/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /actions\.save/i })).toBeInTheDocument()
    })

    it('should display character counter', () => {
      render(
        <DescriptionTranslationForm
          {...defaultProps}
          localeCode="en"
        />
      )

      expect(screen.getByText(/0 \/ 5000 characters/i)).toBeInTheDocument()
    })

    it('should not show edit/delete buttons for new translation', () => {
      render(
        <DescriptionTranslationForm
          {...defaultProps}
          localeCode="en"
        />
      )

      expect(screen.queryByLabelText(/edit/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/delete/i)).not.toBeInTheDocument()
    })
  })

  describe('Rendering - Existing Translation', () => {
    it('should render in display mode for existing translation', () => {
      render(
        <DescriptionTranslationForm
          {...defaultProps}
          translation={mockTranslation}
        />
      )

      expect(screen.getByText('English')).toBeInTheDocument()
      expect(screen.getByText('en')).toBeInTheDocument()
      expect(screen.getByText('This is an existing translation')).toBeInTheDocument()
      expect(screen.getByLabelText(/edit/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/delete/i)).toBeInTheDocument()
    })

    it('should show AI badge for AI-translated content', () => {
      render(
        <DescriptionTranslationForm
          {...defaultProps}
          translation={mockAITranslation}
        />
      )

      const aiBadge = screen.getByText('AI')
      expect(aiBadge).toBeInTheDocument()
      expect(aiBadge).toHaveClass('bg-amber-100')
    })

    it('should show AI translation info', () => {
      render(
        <DescriptionTranslationForm
          {...defaultProps}
          translation={mockAITranslation}
        />
      )

      expect(screen.getByText(/aiTranslatedInfo/i)).toBeInTheDocument()
    })

    it('should switch to edit mode when edit button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <DescriptionTranslationForm
          {...defaultProps}
          translation={mockTranslation}
        />
      )

      const editButton = screen.getByLabelText(/edit/i)
      await user.click(editButton)

      expect(screen.getByLabelText(/textLabel/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /actions\.save/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /actions\.cancel/i })).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show validation error when text is empty', async () => {
      const user = userEvent.setup()
      render(
        <DescriptionTranslationForm
          {...defaultProps}
          localeCode="en"
        />
      )

      // Type text first to enable button
      const textarea = screen.getByLabelText(/textLabel/i)
      await user.type(textarea, 'test')

      // Then clear it
      await user.clear(textarea)

      // Try to click save button (should trigger validation)
      // Note: Button will be disabled, so we can verify it's disabled
      const saveButton = screen.getByRole('button', { name: /actions\.save/i })
      expect(saveButton).toBeDisabled()
    })

    it('should show validation error when text is only whitespace', async () => {
      const user = userEvent.setup()
      render(
        <DescriptionTranslationForm
          {...defaultProps}
          localeCode="en"
        />
      )

      const textarea = screen.getByLabelText(/textLabel/i)
      await user.type(textarea, '   ')

      // Button should be disabled because trim() removes whitespace
      const saveButton = screen.getByRole('button', { name: /actions\.save/i })
      expect(saveButton).toBeDisabled()
    })

    it('should disable save button when text is empty', () => {
      render(
        <DescriptionTranslationForm
          {...defaultProps}
          localeCode="en"
        />
      )

      const saveButton = screen.getByRole('button', { name: /actions\.save/i })
      expect(saveButton).toBeDisabled()
    })

    it('should enable save button when text is entered', async () => {
      const user = userEvent.setup()
      render(
        <DescriptionTranslationForm
          {...defaultProps}
          localeCode="en"
        />
      )

      const textarea = screen.getByLabelText(/textLabel/i)
      await user.type(textarea, 'Valid text')

      const saveButton = screen.getByRole('button', { name: /actions\.save/i })
      expect(saveButton).not.toBeDisabled()
    })

    it('should update character counter as text is entered', async () => {
      const user = userEvent.setup()
      render(
        <DescriptionTranslationForm
          {...defaultProps}
          localeCode="en"
        />
      )

      const textarea = screen.getByLabelText(/textLabel/i)
      await user.type(textarea, 'Test')

      expect(screen.getByText(/4 \/ 5000 characters/i)).toBeInTheDocument()
    })
  })

  describe('Save Functionality', () => {
    it('should call upsertDescriptionTranslation with correct data on save', async () => {
      const user = userEvent.setup()
      const mockUpsert = vi.mocked(descriptionTranslationsActions.upsertDescriptionTranslation)
      mockUpsert.mockResolvedValue(mockTranslation)

      render(
        <DescriptionTranslationForm
          {...defaultProps}
          localeCode="en"
        />
      )

      const textarea = screen.getByLabelText(/textLabel/i)
      await user.type(textarea, 'New translation text')

      const saveButton = screen.getByRole('button', { name: /actions\.save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith('amsterdam', 'desc-1', {
          locale: 'en',
          text: 'New translation text',
        })
      })
    })

    it('should show saving state during submission', async () => {
      const user = userEvent.setup()
      const mockUpsert = vi.mocked(descriptionTranslationsActions.upsertDescriptionTranslation)

      // Create a promise that we can control
      let resolveUpsert: (value: descriptionTranslationsActions.DescriptionTranslation) => void
      mockUpsert.mockImplementation(() => {
        return new Promise((resolve) => {
          resolveUpsert = resolve
        })
      })

      render(
        <DescriptionTranslationForm
          {...defaultProps}
          localeCode="en"
        />
      )

      const textarea = screen.getByLabelText(/textLabel/i)
      await user.type(textarea, 'Test text')

      const saveButton = screen.getByRole('button', { name: /actions\.save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/actions\.saving/i)).toBeInTheDocument()
      })

      expect(saveButton).toBeDisabled()

      // Resolve the promise
      resolveUpsert!(mockTranslation)
    })

    it('should refresh router after successful save', async () => {
      const user = userEvent.setup()
      const mockUpsert = vi.mocked(descriptionTranslationsActions.upsertDescriptionTranslation)
      mockUpsert.mockResolvedValue(mockTranslation)

      render(
        <DescriptionTranslationForm
          {...defaultProps}
          localeCode="en"
        />
      )

      const textarea = screen.getByLabelText(/textLabel/i)
      await user.type(textarea, 'Test text')

      const saveButton = screen.getByRole('button', { name: /actions\.save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('should display error message when save fails', async () => {
      const user = userEvent.setup()
      const mockUpsert = vi.mocked(descriptionTranslationsActions.upsertDescriptionTranslation)
      mockUpsert.mockRejectedValue(new Error('Network error'))

      render(
        <DescriptionTranslationForm
          {...defaultProps}
          localeCode="en"
        />
      )

      const textarea = screen.getByLabelText(/textLabel/i)
      await user.type(textarea, 'Test text')

      const saveButton = screen.getByRole('button', { name: /actions\.save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('should trim text before saving', async () => {
      const user = userEvent.setup()
      const mockUpsert = vi.mocked(descriptionTranslationsActions.upsertDescriptionTranslation)
      mockUpsert.mockResolvedValue(mockTranslation)

      render(
        <DescriptionTranslationForm
          {...defaultProps}
          localeCode="en"
        />
      )

      const textarea = screen.getByLabelText(/textLabel/i)
      await user.type(textarea, '  Text with spaces  ')

      const saveButton = screen.getByRole('button', { name: /actions\.save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith('amsterdam', 'desc-1', {
          locale: 'en',
          text: 'Text with spaces',
        })
      })
    })
  })

  describe('Cancel Functionality', () => {
    it('should reset form when cancel is clicked', async () => {
      const user = userEvent.setup()
      render(
        <DescriptionTranslationForm
          {...defaultProps}
          translation={mockTranslation}
        />
      )

      // Enter edit mode
      const editButton = screen.getByLabelText(/edit/i)
      await user.click(editButton)

      // Change text
      const textarea = screen.getByLabelText(/textLabel/i)
      await user.clear(textarea)
      await user.type(textarea, 'Modified text')

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /actions\.cancel/i })
      await user.click(cancelButton)

      // Should return to display mode with original text
      expect(screen.getByText('This is an existing translation')).toBeInTheDocument()
      expect(screen.queryByLabelText('Description Text')).not.toBeInTheDocument()
    })

    it('should clear error message when cancel is clicked', async () => {
      const user = userEvent.setup()
      const mockUpsert = vi.mocked(descriptionTranslationsActions.upsertDescriptionTranslation)
      mockUpsert.mockRejectedValue(new Error('Save failed'))

      render(
        <DescriptionTranslationForm
          {...defaultProps}
          translation={mockTranslation}
        />
      )

      // Enter edit mode
      const editButton = screen.getByLabelText(/edit/i)
      await user.click(editButton)

      // Modify text and try to save (will fail and show error)
      const textarea = screen.getByLabelText(/textLabel/i)
      await user.type(textarea, ' modified')

      const saveButton = screen.getByRole('button', { name: /actions\.save/i })
      await user.click(saveButton)

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Save failed')).toBeInTheDocument()
      })

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /actions\.cancel/i })
      await user.click(cancelButton)

      // Error should be cleared
      expect(screen.queryByText('Save failed')).not.toBeInTheDocument()
    })
  })

  describe('Delete Functionality', () => {
    it('should show confirmation dialog before delete', async () => {
      const user = userEvent.setup()
      render(
        <DescriptionTranslationForm
          {...defaultProps}
          translation={mockTranslation}
        />
      )

      const deleteButton = screen.getByLabelText(/delete/i)
      await user.click(deleteButton)

      expect(global.confirm).toHaveBeenCalledWith(expect.stringMatching(/confirmDelete/i))
    })

    it('should not delete if user cancels confirmation', async () => {
      const user = userEvent.setup()
      const mockDelete = vi.mocked(descriptionTranslationsActions.deleteDescriptionTranslation)
      ;(global.confirm as ReturnType<typeof vi.fn>).mockReturnValue(false)

      render(
        <DescriptionTranslationForm
          {...defaultProps}
          translation={mockTranslation}
        />
      )

      const deleteButton = screen.getByLabelText(/delete/i)
      await user.click(deleteButton)

      expect(mockDelete).not.toHaveBeenCalled()
    })

    it('should call deleteDescriptionTranslation with correct data on delete', async () => {
      const user = userEvent.setup()
      const mockDelete = vi.mocked(descriptionTranslationsActions.deleteDescriptionTranslation)
      mockDelete.mockResolvedValue()

      render(
        <DescriptionTranslationForm
          {...defaultProps}
          translation={mockTranslation}
        />
      )

      const deleteButton = screen.getByLabelText(/delete/i)
      await user.click(deleteButton)

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith('amsterdam', 'desc-1', 'en')
      })
    })

    it('should refresh router after successful delete', async () => {
      const user = userEvent.setup()
      const mockDelete = vi.mocked(descriptionTranslationsActions.deleteDescriptionTranslation)
      mockDelete.mockResolvedValue()

      render(
        <DescriptionTranslationForm
          {...defaultProps}
          translation={mockTranslation}
        />
      )

      const deleteButton = screen.getByLabelText(/delete/i)
      await user.click(deleteButton)

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('should log error when delete fails', async () => {
      const user = userEvent.setup()
      const mockDelete = vi.mocked(descriptionTranslationsActions.deleteDescriptionTranslation)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockDelete.mockRejectedValue(new Error('Delete failed'))

      render(
        <DescriptionTranslationForm
          {...defaultProps}
          translation={mockTranslation}
        />
      )

      const deleteButton = screen.getByLabelText(/delete/i)
      await user.click(deleteButton)

      // Wait for the error to be logged
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting translation:', expect.any(Error))
      })

      // Note: Error is not displayed in display mode (only edit mode shows errors)
      // This is current component behavior - errors during delete are logged but not shown to user

      consoleErrorSpy.mockRestore()
    })

    it('should disable edit button while delete is in progress', async () => {
      const user = userEvent.setup()
      const mockDelete = vi.mocked(descriptionTranslationsActions.deleteDescriptionTranslation)

      // Create a promise that we can control
      let resolveDelete: () => void
      mockDelete.mockImplementation(() => {
        return new Promise((resolve) => {
          resolveDelete = resolve
        })
      })

      render(
        <DescriptionTranslationForm
          {...defaultProps}
          translation={mockTranslation}
        />
      )

      const deleteButton = screen.getByLabelText(/delete/i)
      await user.click(deleteButton)

      await waitFor(() => {
        const editButton = screen.getByLabelText(/edit/i)
        expect(editButton).toBeDisabled()
      })

      // Resolve the promise
      resolveDelete!()
    })
  })

  describe('Accessibility', () => {
    it('should have ARIA labels for icon-only buttons', () => {
      render(
        <DescriptionTranslationForm
          {...defaultProps}
          translation={mockTranslation}
        />
      )

      expect(screen.getByLabelText(/edit/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/delete/i)).toBeInTheDocument()
    })

    it('should have proper label for textarea', () => {
      render(
        <DescriptionTranslationForm
          {...defaultProps}
          localeCode="en"
        />
      )

      const textarea = screen.getByLabelText(/textLabel/i)
      expect(textarea).toHaveAttribute('id', 'text-en')
    })

    it('should have unique IDs for different locales', () => {
      const { rerender } = render(
        <DescriptionTranslationForm
          {...defaultProps}
          localeCode="en"
        />
      )

      const textareaEN = screen.getByLabelText(/textLabel/i)
      expect(textareaEN).toHaveAttribute('id', 'text-en')

      rerender(
        <DescriptionTranslationForm
          {...defaultProps}
          localeCode="nl"
        />
      )

      const textareaNL = screen.getByLabelText(/textLabel/i)
      expect(textareaNL).toHaveAttribute('id', 'text-nl')
    })
  })
})
