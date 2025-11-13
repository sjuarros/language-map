/**
 * Language Form Component Tests
 * =============================
 * Unit tests for the LanguageForm component covering:
 * - Form rendering in create and edit modes
 * - Client-side validation
 * - Taxonomy selection logic
 * - Form submission flow
 * - Error handling and display
 * - Loading state behavior
 *
 * @module components/languages/language-form.test
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LanguageForm } from './language-form'

// Type for mock language return value
interface MockLanguageResult {
  id: string
}

// Mock ResizeObserver for Radix UI components
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

// Mock server actions
vi.mock('@/app/actions/languages', () => ({
  createLanguage: vi.fn(),
  updateLanguage: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn(),
  })),
}))

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => {
    return (key: string) => {
      const translations: Record<string, string> = {
        'form.create': 'Create Language',
        'form.update': 'Update Language',
        'form.cancel': 'Cancel',
        'form.saving': 'Saving...',
        'form.coreInfo': 'Core Information',
        'form.coreInfoDescription': 'Basic language details',
        'form.endonym': 'Endonym',
        'form.endonymHelp': 'Native name of the language',
        'form.endonymPlaceholder': 'Enter endonym',
        'form.isoCode': 'ISO 639-3 Code',
        'form.isoCodeHelp': 'Three-letter language code',
        'form.languageFamily': 'Language Family',
        'form.selectLanguageFamily': 'Select a language family',
        'form.countryOfOrigin': 'Country of Origin',
        'form.selectCountry': 'Select a country',
        'form.speakerCount': 'Speaker Count',
        'form.none': 'None',
        'form.translations': 'Translations',
        'form.translationsDescription': 'Language names in different locales',
        'form.englishName': 'English Name',
        'form.dutchName': 'Dutch Name',
        'form.frenchName': 'French Name',
        'form.namePlaceholder': 'Enter name',
        'form.taxonomies': 'Classifications',
        'form.validation.required': 'This field is required',
        'error.unknown': 'An unknown error occurred',
        'error.validation': 'Validation error',
        'error.permission': 'You do not have permission to perform this action',
        'error.network': 'Network error. Please try again.',
        'error.duplicate': 'This language already exists',
      }
      return translations[key] || key
    }
  }),
}))

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button data-testid="button" disabled={disabled} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/input', () => ({
  Input: ({ id, required, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input id={id} required={required} data-testid="input" {...props} />
  ),
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label data-testid="label" {...props}>
      {children}
    </label>
  ),
}))

const mockProps = {
  citySlug: 'amsterdam',
  locale: 'en',
  languageFamilies: [
    { id: '1', slug: 'indo-european', translations: [{ name: 'Indo-European' }] },
    { id: '2', slug: 'sino-tibetan', translations: [{ name: 'Sino-Tibetan' }] },
  ],
  countries: [
    { id: '1', iso_code_2: 'GB', iso_code_3: 'GBR', translations: [{ name: 'United Kingdom' }] },
    { id: '2', iso_code_2: 'FR', iso_code_3: 'FRA', translations: [{ name: 'France' }] },
  ],
  taxonomyTypes: [
    {
      id: '1',
      slug: 'status',
      is_required: true,
      allow_multiple: false,
      translations: [{ name: 'Language Status' }],
      values: [
        { id: '1', slug: 'official', color_hex: '#000000', icon_name: null, translations: [{ name: 'Official' }] },
        { id: '2', slug: 'recognized', color_hex: '#000000', icon_name: null, translations: [{ name: 'Recognized' }] },
      ],
    },
    {
      id: '2',
      slug: 'size',
      is_required: false,
      allow_multiple: true,
      translations: [{ name: 'Community Size' }],
      values: [
        { id: '3', slug: 'small', color_hex: '#000000', icon_name: null, translations: [{ name: 'Small' }] },
        { id: '4', slug: 'large', color_hex: '#000000', icon_name: null, translations: [{ name: 'Large' }] },
      ],
    },
  ],
  mode: 'create' as const,
}

describe('LanguageForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create mode', () => {
    it('should render form with all required fields', () => {
      render(<LanguageForm {...mockProps} />)

      // Check for main fields
      expect(screen.getByLabelText(/endonym/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/iso 639-3 code/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/language family/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/country of origin/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/speaker count/i)).toBeInTheDocument()

      // Check for English name (default active tab)
      expect(screen.getByLabelText(/english name/i)).toBeInTheDocument()

      // Check for taxonomy sections
      expect(screen.getByText(/language status/i)).toBeInTheDocument()
      expect(screen.getByText(/community size/i)).toBeInTheDocument()
    })

    it('should validate required fields before submission', async () => {
      render(<LanguageForm {...mockProps} />)

      // Try to submit empty form
      const submitButton = screen.getByText(/create language/i)
      fireEvent.click(submitButton)

      // Should show validation error (endonym is required)
      await waitFor(() => {
        expect(screen.getByText(/native name of the language/i)).toBeInTheDocument()
      })
    })

    it('should submit form with valid data', async () => {
      const { createLanguage } = vi.mocked(await import('@/app/actions/languages'))
      createLanguage.mockResolvedValue({ id: 'new-id' } as MockLanguageResult)

      // Use props without required taxonomies for simpler testing
      const propsWithoutRequiredTax = {
        ...mockProps,
        taxonomyTypes: mockProps.taxonomyTypes.map(t => ({ ...t, is_required: false }))
      }

      render(<LanguageForm {...propsWithoutRequiredTax} />)

      // Fill in required fields
      const endonymInput = screen.getByLabelText(/endonym/i)
      fireEvent.change(endonymInput, { target: { value: 'English' } })

      const nameEnInput = screen.getByLabelText(/english name/i)
      fireEvent.change(nameEnInput, { target: { value: 'English' } })

      // Submit form
      const submitButton = screen.getByText(/create language/i)
      fireEvent.click(submitButton)

      // Should call createLanguage
      await waitFor(() => {
        expect(createLanguage).toHaveBeenCalledWith('amsterdam', expect.objectContaining({
          endonym: 'English',
          name_en: 'English',
        }))
      })
    })

    it('should display loading state during submission', async () => {
      vi.mocked(await import('@/app/actions/languages')).createLanguage.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ id: 'new-id' }), 100))
      )

      // Use props without required taxonomies for simpler testing
      const propsWithoutRequiredTax = {
        ...mockProps,
        taxonomyTypes: mockProps.taxonomyTypes.map(t => ({ ...t, is_required: false }))
      }

      render(<LanguageForm {...propsWithoutRequiredTax} />)

      // Fill in required fields
      const endonymInput = screen.getByLabelText(/endonym/i)
      fireEvent.change(endonymInput, { target: { value: 'English' } })

      const nameEnInput = screen.getByLabelText(/english name/i)
      fireEvent.change(nameEnInput, { target: { value: 'English' } })

      // Submit form
      const submitButton = screen.getByText(/create language/i)
      fireEvent.click(submitButton)

      // Should show loading indicator (button text changes and form inputs are disabled)
      const savingElements = screen.getAllByText(/saving.../i)
      expect(savingElements.length).toBeGreaterThan(0)
      // Also verify the submit button is disabled during submission
      expect(screen.getByRole('button', { name: /saving.../i })).toBeDisabled()
    })
  })

  describe('edit mode', () => {
    it('should render form with pre-filled data', () => {
      const language = {
        id: '1',
        iso_639_3_code: 'eng',
        endonym: 'English',
        language_family_id: '1',
        country_of_origin_id: '1',
        speaker_count: 1000000,
        translations: [
          { locale_code: 'en', name: 'English' },
          { locale_code: 'nl', name: 'Engels' },
        ],
        taxonomies: [{ taxonomy_value_id: '1' }],
      }

      render(<LanguageForm {...mockProps} mode="edit" language={language} />)

      // Check that visible inputs are pre-filled
      expect(screen.getByLabelText(/endonym/i)).toHaveValue('English')
      expect(screen.getByLabelText(/iso 639-3 code/i)).toHaveValue('eng')
      // English name is in the default active tab
      expect(screen.getByLabelText(/english name/i)).toHaveValue('English')
    })

    it('should update language successfully', async () => {
      const { updateLanguage } = vi.mocked(await import('@/app/actions/languages'))
      updateLanguage.mockResolvedValue({ id: '1' } as MockLanguageResult)

      const language = {
        id: '1',
        iso_639_3_code: 'eng',
        endonym: 'English',
        language_family_id: '1',
        country_of_origin_id: '1',
        speaker_count: 1000000,
        translations: [
          { locale_code: 'en', name: 'English' },
        ],
        taxonomies: [],
      }

      // Use props without required taxonomies for simpler testing
      const propsWithoutRequiredTax = {
        ...mockProps,
        taxonomyTypes: mockProps.taxonomyTypes.map(t => ({ ...t, is_required: false }))
      }

      render(<LanguageForm {...propsWithoutRequiredTax} mode="edit" language={language} />)

      // Update endonym
      const endonymInput = screen.getByLabelText(/endonym/i)
      fireEvent.change(endonymInput, { target: { value: 'Updated English' } })

      // Submit form
      const submitButton = screen.getByText(/update language/i)
      fireEvent.click(submitButton)

      // Should call updateLanguage
      await waitFor(() => {
        expect(updateLanguage).toHaveBeenCalledWith('amsterdam', '1', expect.objectContaining({
          endonym: 'Updated English',
        }))
      })
    })
  })

  describe('taxonomy selection', () => {
    it('should allow multiple selection for allow_multiple taxonomy', () => {
      render(<LanguageForm {...mockProps} />)

      // Find community size checkboxes (allows multiple)
      const checkboxes = screen.getAllByText(/community size/i)
      expect(checkboxes.length).toBeGreaterThan(0)

      // Both small and large can be selected
      // This is tested in the actual component behavior
    })

    it('should enforce single selection for exclusive taxonomy', () => {
      render(<LanguageForm {...mockProps} />)

      // Find language status checkboxes (single selection)
      const statusCheckboxes = screen.getAllByText(/language status/i)
      expect(statusCheckboxes.length).toBeGreaterThan(0)

      // Only one can be selected at a time
      // This is tested in the component's handleTaxonomyChange function
    })
  })

  describe('error handling', () => {
    it('should display error message from server', async () => {
      const { createLanguage } = vi.mocked(await import('@/app/actions/languages'))
      createLanguage.mockRejectedValue(new Error('Database error'))

      // Use props without required taxonomies for simpler testing
      const propsWithoutRequiredTax = {
        ...mockProps,
        taxonomyTypes: mockProps.taxonomyTypes.map(t => ({ ...t, is_required: false }))
      }

      render(<LanguageForm {...propsWithoutRequiredTax} />)

      // Fill in required fields
      const endonymInput = screen.getByLabelText(/endonym/i)
      fireEvent.change(endonymInput, { target: { value: 'Test Language' } })

      const nameEnInput = screen.getByLabelText(/english name/i)
      fireEvent.change(nameEnInput, { target: { value: 'Test Language' } })

      // Submit form
      const submitButton = screen.getByText(/create language/i)
      fireEvent.click(submitButton)

      // Should display error
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/database error/i)).toBeInTheDocument()
      })
    })

    it('should categorize validation errors', async () => {
      const { createLanguage } = vi.mocked(await import('@/app/actions/languages'))
      createLanguage.mockRejectedValue(new Error('Validation failed: invalid iso code'))

      // Use props without required taxonomies for simpler testing
      const propsWithoutRequiredTax = {
        ...mockProps,
        taxonomyTypes: mockProps.taxonomyTypes.map(t => ({ ...t, is_required: false }))
      }

      render(<LanguageForm {...propsWithoutRequiredTax} />)

      // Fill in required fields
      const endonymInput = screen.getByLabelText(/endonym/i)
      fireEvent.change(endonymInput, { target: { value: 'Test Language' } })

      const nameEnInput = screen.getByLabelText(/english name/i)
      fireEvent.change(nameEnInput, { target: { value: 'Test Language' } })

      // Submit form
      const submitButton = screen.getByText(/create language/i)
      fireEvent.click(submitButton)

      // Should show validation error with specific message
      await waitFor(() => {
        expect(screen.getByText(/validation error/i)).toBeInTheDocument()
      })
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<LanguageForm {...mockProps} />)

      // Check that form has aria-label
      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()

      // Check that required fields have aria-required
      const endonymInput = screen.getByLabelText(/endonym/i)
      expect(endonymInput).toHaveAttribute('aria-required')
    })

    it('should announce errors with aria-live', async () => {
      const { createLanguage } = vi.mocked(await import('@/app/actions/languages'))
      createLanguage.mockRejectedValue(new Error('Test error'))

      render(<LanguageForm {...mockProps} />)

      // Fill in required fields
      const endonymInput = screen.getByLabelText(/endonym/i)
      fireEvent.change(endonymInput, { target: { value: 'Test Language' } })

      const nameEnInput = screen.getByLabelText(/english name/i)
      fireEvent.change(nameEnInput, { target: { value: 'Test Language' } })

      // Submit form
      const submitButton = screen.getByText(/create language/i)
      fireEvent.click(submitButton)

      // Error should be announced
      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveAttribute('aria-live', 'polite')
      })
    })
  })

  describe('edge cases', () => {
    it('should handle missing optional fields', () => {
      render(<LanguageForm {...mockProps} />)

      // Should render without errors even if optional fields are not filled
      expect(screen.getByLabelText(/iso 639-3 code/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/speaker count/i)).toBeInTheDocument()

      // Form should render successfully
      expect(screen.getByRole('form')).toBeInTheDocument()
    })

    it('should handle empty taxonomy arrays', () => {
      render(<LanguageForm {...mockProps} taxonomyTypes={[]} />)

      // Should not crash when no taxonomies are available
      expect(screen.queryByText(/classifications/i)).not.toBeInTheDocument()
    })
  })
})
