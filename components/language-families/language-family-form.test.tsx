/**
 * @fileoverview Unit tests for Language Family Form component
 * @description Tests form rendering, validation, submission, and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import LanguageFamilyForm from './language-family-form'

// Mock messages for translations
const messages = {
  operator: {
    languageFamilies: {
      create: {
        form: {
          basicInfo: {
            title: 'Basic Information',
            description: 'Family identifier and URL slug',
            slugLabel: 'Slug',
            slugPlaceholder: 'e.g., indo-european',
            slugHelpText: 'URL-friendly identifier',
          },
          english: {
            title: 'English (Required)',
            description: 'English name and description',
            nameLabel: 'Name',
            namePlaceholder: 'e.g., Indo-European',
            descriptionLabel: 'Description',
            descriptionPlaceholder: 'Brief description...',
          },
          dutch: {
            title: 'Dutch (Optional)',
            description: 'Nederlandse vertaling',
            nameLabel: 'Naam',
            namePlaceholder: 'bijv. Indo-Europees',
            descriptionLabel: 'Beschrijving',
            descriptionPlaceholder: 'Korte beschrijving...',
          },
          french: {
            title: 'French (Optional)',
            description: 'Traduction française',
            nameLabel: 'Nom',
            namePlaceholder: 'par ex. Indo-européen',
            descriptionLabel: 'Description',
            descriptionPlaceholder: 'Brève description...',
          },
        },
      },
    },
  },
  common: {
    save: 'Save',
    saving: 'Saving...',
    error: 'An error occurred',
  },
  errors: {
    permissionDenied: 'Permission denied',
    validationFailed: 'Validation failed',
    networkError: 'Network error',
    duplicateSlug: 'Duplicate slug',
    saveFailed: 'Save failed',
  },
}

/**
 * Helper to render component with i18n provider
 */
function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  )
}

describe('LanguageFamilyForm', () => {
  let mockOnSubmit: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnSubmit = vi.fn()
  })

  describe('Rendering', () => {
    it('should render all required form fields', () => {
      renderWithIntl(<LanguageFamilyForm onSubmit={mockOnSubmit} />)

      // Basic info
      expect(screen.getByLabelText(/slug/i)).toBeInTheDocument()

      // English fields (required)
      expect(screen.getByPlaceholderText('e.g., Indo-European')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Brief description...')).toBeInTheDocument()

      // Dutch fields (optional)
      expect(screen.getByPlaceholderText('bijv. Indo-Europees')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Korte beschrijving...')).toBeInTheDocument()

      // French fields (optional)
      expect(screen.getByPlaceholderText('par ex. Indo-européen')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Brève description...')).toBeInTheDocument()

      // Submit button
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    })

    it('should render with initial data in edit mode', () => {
      const initialData = {
        id: '123-uuid',
        slug: 'indo-european',
        translations: [
          { locale_code: 'en', name: 'Indo-European', description: 'A language family' },
          { locale_code: 'nl', name: 'Indo-Europees', description: 'Een taalfamilie' },
          { locale_code: 'fr', name: 'Indo-européen', description: 'Une famille linguistique' },
        ],
      }

      renderWithIntl(<LanguageFamilyForm initialData={initialData} onSubmit={mockOnSubmit} />)

      // Check that fields are populated
      expect(screen.getByDisplayValue('indo-european')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Indo-European')).toBeInTheDocument()
      expect(screen.getByDisplayValue('A language family')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Indo-Europees')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Een taalfamilie')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Indo-européen')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Une famille linguistique')).toBeInTheDocument()
    })

    it('should render custom submit label when provided', () => {
      renderWithIntl(
        <LanguageFamilyForm onSubmit={mockOnSubmit} submitLabel="Create Family" />
      )

      expect(screen.getByRole('button', { name: /create family/i })).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('should show error when slug is empty', async () => {
      const user = userEvent.setup()
      renderWithIntl(<LanguageFamilyForm onSubmit={mockOnSubmit} />)

      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/slug is required/i)).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should show error when slug has invalid format', async () => {
      const user = userEvent.setup()
      renderWithIntl(<LanguageFamilyForm onSubmit={mockOnSubmit} />)

      const slugInput = screen.getByLabelText(/slug/i)
      const englishNameInput = screen.getByPlaceholderText('e.g., Indo-European')
      const submitButton = screen.getByRole('button', { name: /save/i })

      await user.type(slugInput, 'Invalid Slug!')
      await user.type(englishNameInput, 'Test Family')
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/slug must contain only lowercase letters/i)
        ).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should show error when English name is empty', async () => {
      const user = userEvent.setup()
      renderWithIntl(<LanguageFamilyForm onSubmit={mockOnSubmit} />)

      const slugInput = screen.getByLabelText(/slug/i)
      const submitButton = screen.getByRole('button', { name: /save/i })

      await user.type(slugInput, 'test-family')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/english name is required/i)).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should accept valid slug formats', async () => {
      const user = userEvent.setup()
      renderWithIntl(<LanguageFamilyForm onSubmit={mockOnSubmit} />)

      const slugInput = screen.getByLabelText(/slug/i)
      const englishNameInput = screen.getByPlaceholderText('e.g., Indo-European')

      // Valid slugs
      await user.type(slugInput, 'indo-european-123')
      await user.type(englishNameInput, 'Indo-European')

      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValueOnce(undefined)

      renderWithIntl(<LanguageFamilyForm onSubmit={mockOnSubmit} />)

      // Fill in required fields
      await user.type(screen.getByLabelText(/slug/i), 'sino-tibetan')
      await user.type(screen.getByPlaceholderText('e.g., Indo-European'), 'Sino-Tibetan')
      await user.type(
        screen.getAllByPlaceholderText(/brief description/i)[0],
        'A major language family'
      )

      // Fill in optional Dutch translation
      await user.type(screen.getByPlaceholderText(/bijv. Indo-Europees/i), 'Sino-Tibetaans')

      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          slug: 'sino-tibetan',
          name_en: 'Sino-Tibetan',
          description_en: 'A major language family',
          name_nl: 'Sino-Tibetaans',
          description_nl: '',
          name_fr: '',
          description_fr: '',
        })
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      // Mock a delayed submission
      mockOnSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))

      renderWithIntl(<LanguageFamilyForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/slug/i), 'test-family')
      await user.type(screen.getByPlaceholderText('e.g., Indo-European'), 'Test Family')

      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText(/saving/i)).toBeInTheDocument()
        expect(submitButton).toBeDisabled()
      })

      // Wait for submission to complete
      await waitFor(
        () => {
          expect(mockOnSubmit).toHaveBeenCalled()
        },
        { timeout: 200 }
      )
    })

    it('should submit with all three languages', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValueOnce(undefined)

      renderWithIntl(<LanguageFamilyForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/slug/i), 'afro-asiatic')
      await user.type(screen.getByPlaceholderText('e.g., Indo-European'), 'Afro-Asiatic')
      await user.type(screen.getAllByPlaceholderText(/brief description/i)[0], 'EN description')
      await user.type(screen.getByPlaceholderText(/bijv. Indo-Europees/i), 'Afro-Aziatisch')
      await user.type(screen.getAllByPlaceholderText(/korte beschrijving/i)[0], 'NL beschrijving')
      await user.type(screen.getByPlaceholderText(/par ex. Indo-européen/i), 'Afro-asiatique')
      await user.type(screen.getAllByPlaceholderText(/brève description/i)[0], 'FR description')

      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            slug: 'afro-asiatic',
            name_en: 'Afro-Asiatic',
            description_en: 'EN description',
            name_nl: 'Afro-Aziatisch',
            description_nl: 'NL beschrijving',
            name_fr: 'Afro-asiatique',
            description_fr: 'FR description',
          })
        )
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message on submission failure', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockRejectedValueOnce(new Error('Database connection failed'))

      renderWithIntl(<LanguageFamilyForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/slug/i), 'test-family')
      await user.type(screen.getByPlaceholderText('e.g., Indo-European'), 'Test Family')

      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/save failed: database connection failed/i)).toBeInTheDocument()
      })
    })

    it('should display permission denied error', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockRejectedValueOnce(new Error('Unauthorized access'))

      renderWithIntl(<LanguageFamilyForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/slug/i), 'test-family')
      await user.type(screen.getByPlaceholderText('e.g., Indo-European'), 'Test Family')

      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/permission denied/i)).toBeInTheDocument()
      })
    })

    it('should display duplicate slug error', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockRejectedValueOnce(new Error('Duplicate key value violates unique constraint'))

      renderWithIntl(<LanguageFamilyForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/slug/i), 'indo-european')
      await user.type(screen.getByPlaceholderText('e.g., Indo-European'), 'Indo-European')

      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/duplicate slug/i)).toBeInTheDocument()
      })
    })

    it('should display network error', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockRejectedValueOnce(new Error('Network request failed'))

      renderWithIntl(<LanguageFamilyForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/slug/i), 'test-family')
      await user.type(screen.getByPlaceholderText('e.g., Indo-European'), 'Test Family')

      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })

    it('should clear error on new submission attempt', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockRejectedValueOnce(new Error('First error'))

      renderWithIntl(<LanguageFamilyForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/slug/i), 'test-family')
      await user.type(screen.getByPlaceholderText('e.g., Indo-European'), 'Test Family')

      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/first error/i)).toBeInTheDocument()
      })

      // Clear the error and submit again successfully
      mockOnSubmit.mockResolvedValueOnce(undefined)
      await user.clear(screen.getByLabelText(/slug/i))
      await user.type(screen.getByLabelText(/slug/i), 'test-family-2')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/first error/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing initial data gracefully', () => {
      renderWithIntl(
        <LanguageFamilyForm initialData={undefined} onSubmit={mockOnSubmit} />
      )

      // Form should render with empty fields
      expect(screen.getByLabelText(/slug/i)).toHaveValue('')
    })

    it('should handle initial data with missing translations', () => {
      const initialData = {
        id: '123-uuid',
        slug: 'test-family',
        translations: [{ locale_code: 'en', name: 'Test Family', description: null }],
      }

      renderWithIntl(<LanguageFamilyForm initialData={initialData} onSubmit={mockOnSubmit} />)

      expect(screen.getByDisplayValue('Test Family')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/bijv. Indo-Europees/i)).toHaveValue('')
      expect(screen.getByPlaceholderText(/par ex. Indo-européen/i)).toHaveValue('')
    })

    it('should handle non-Error objects in catch block', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockRejectedValueOnce('String error')

      renderWithIntl(<LanguageFamilyForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/slug/i), 'test-family')
      await user.type(screen.getByPlaceholderText('e.g., Indo-European'), 'Test Family')

      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/an error occurred/i)).toBeInTheDocument()
      })
    })
  })
})
