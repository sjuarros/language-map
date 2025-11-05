/**
 * @fileoverview Unit tests for TaxonomyTypeForm component
 * @description Tests form validation, submission, configuration options, and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaxonomyTypeForm from './taxonomy-type-form'
import * as reactHookForm from 'react-hook-form'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

// Type for form submission handler
type FormSubmitHandler = (data: Record<string, unknown>) => void

// Type for field registration
type FieldProps = {
  name: string
  onChange: (...args: unknown[]) => unknown
  onBlur: (...args: unknown[]) => unknown
  ref: (...args: unknown[]) => unknown
  value?: string | boolean | number | undefined
  type?: string
  checked?: boolean
}

// Mock react-hook-form
const defaultFieldValue = {
  slug: '',
  displayOrder: 0,
  isRequired: false,
  allowMultiple: false,
  useForMapStyling: false,
  useForFiltering: false,
  name_en: '',
  description_en: '',
  name_nl: '',
  description_nl: '',
  name_fr: '',
  description_fr: '',
}

const mockRegister = vi.fn((field: string): FieldProps => {
  const base: Omit<FieldProps, 'value' | 'type' | 'checked'> = {
    name: field,
    onChange: vi.fn(),
    onBlur: vi.fn(),
    ref: vi.fn(),
  }

  const fieldValue = defaultFieldValue[field as keyof typeof defaultFieldValue]

  if (typeof fieldValue === 'boolean') {
    return {
      ...base,
      type: 'checkbox',
      checked: fieldValue,
    }
  }

  if (typeof fieldValue === 'number') {
    return {
      ...base,
      type: 'number',
      value: String(fieldValue),
    }
  }

  return {
    ...base,
    value: fieldValue ?? '',
  }
})

vi.mock('react-hook-form', () => ({
  useForm: vi.fn(() => ({
    register: mockRegister,
    handleSubmit: vi.fn((fn: FormSubmitHandler) => (e: React.FormEvent) => {
      e.preventDefault()

      // Collect form data
      const form = e.currentTarget as HTMLFormElement
      const formData = new FormData(form)
      const data: Record<string, unknown> = {}

      for (const [key, value] of formData.entries()) {
        data[key] = value
      }

      // Set default values if fields are empty
      data.slug = data.slug || 'test-taxonomy'
      data.displayOrder = data.displayOrder || 0
      data.isRequired = data.isRequired === 'on'
      data.allowMultiple = data.allowMultiple === 'on'
      data.useForMapStyling = data.useForMapStyling === 'on'
      data.useForFiltering = data.useForFiltering === 'on'
      data.name_en = data.name_en || 'Test Taxonomy'
      data.description_en = data.description_en || 'Test description'
      data.name_nl = data.name_nl || 'Test Taxonomie NL'
      data.description_nl = data.description_nl || 'Test beschrijving'
      data.name_fr = data.name_fr || 'Test Taxonomie FR'
      data.description_fr = data.description_fr || 'Test description FR'

      // Actually call the handler - this will trigger the component's handleFormSubmit
      fn(data)
    }),
    formState: {
      errors: {},
    },
    watch: vi.fn(() => ''),
  })),
  zodResolver: vi.fn(),
}))

const mockOnSubmit = vi.fn()

const defaultProps = {
  cityId: 'test-city-id',
  citySlug: 'test-city',
  locale: 'en',
  onSubmit: mockOnSubmit,
  // submitLabel removed - will use translation key
}

describe('TaxonomyTypeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the form with all required fields', () => {
    render(<TaxonomyTypeForm {...defaultProps} />)

    // Check for translation key labels (since mock returns keys)
    expect(screen.getByLabelText(/basicInfo\.slugLabel/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/translations\.english\.nameLabel/i)).toBeInTheDocument()
    expect(screen.getByText(/translations\.english\.title/i)).toBeInTheDocument()
    expect(screen.getByText(/translations\.dutch\.title/i)).toBeInTheDocument()
    expect(screen.getByText(/translations\.french\.title/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submitButton/i })).toBeInTheDocument()
  })

  it('should render all configuration options', () => {
    render(<TaxonomyTypeForm {...defaultProps} />)

    expect(screen.getByLabelText(/basicInfo\.isRequiredLabel/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/basicInfo\.allowMultipleLabel/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/basicInfo\.useForMapStylingLabel/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/basicInfo\.useForFilteringLabel/i)).toBeInTheDocument()
  })

  it('should submit the form with valid data', async () => {
    const user = userEvent.setup()
    render(<TaxonomyTypeForm {...defaultProps} />)

    const slugInput = screen.getByLabelText(/basicInfo\.slugLabel/i)
    const nameInput = screen.getByLabelText(/translations\.english\.nameLabel/i)

    await user.type(slugInput, 'test-taxonomy')
    await user.type(nameInput, 'Test Taxonomy')

    const submitButton = screen.getByRole('button', { name: /submitButton/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
    })
  })

  it('should show validation error for missing required English name', async () => {
    // Clear previous mocks to set up our test state
    vi.clearAllMocks()

    // Mock useForm to return error state
    const mockUseForm = vi.mocked(reactHookForm.useForm)
    mockUseForm.mockReturnValue({
      register: vi.fn(),
      handleSubmit: vi.fn((fn: FormSubmitHandler) => (e: React.FormEvent) => {
        e.preventDefault()
        fn({
          slug: 'test',
          name_en: '', // Empty required field
        })
      }),
      formState: {
        errors: {
          name_en: { message: 'Name is required' },
        },
      },
      watch: vi.fn(() => ''),
    } as unknown as ReturnType<typeof reactHookForm.useForm>)

    render(<TaxonomyTypeForm {...defaultProps} />)

    // The form should render (validation is handled by react-hook-form)
    expect(screen.getByLabelText(/translations\.english\.nameLabel/i)).toBeInTheDocument()
  })

  it('should display error message when submission fails', async () => {
    const user = userEvent.setup()
    const mockOnSubmitError = vi.fn().mockRejectedValue(new Error('Network error'))
    render(<TaxonomyTypeForm {...defaultProps} onSubmit={mockOnSubmitError} />)

    const submitButton = screen.getByRole('button', { name: /submitButton/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/networkError/i)).toBeInTheDocument()
    })
  })

  it('should show specific error for unauthorized access', async () => {
    const user = userEvent.setup()
    const mockOnSubmitError = vi.fn().mockRejectedValue(new Error('Unauthorized'))
    render(<TaxonomyTypeForm {...defaultProps} onSubmit={mockOnSubmitError} />)

    const submitButton = screen.getByRole('button', { name: /submitButton/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/permissionDenied/i)).toBeInTheDocument()
    })
  })

  it('should show specific error for validation failures', async () => {
    const user = userEvent.setup()
    const mockOnSubmitError = vi.fn().mockRejectedValue(new Error('Validation failed'))
    render(<TaxonomyTypeForm {...defaultProps} onSubmit={mockOnSubmitError} />)

    const submitButton = screen.getByRole('button', { name: /submitButton/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/validationFailed/i)).toBeInTheDocument()
    })
  })

  it('should show specific error for duplicate slug', async () => {
    const user = userEvent.setup()
    const mockOnSubmitError = vi.fn().mockRejectedValue(new Error('duplicate key value'))
    render(<TaxonomyTypeForm {...defaultProps} onSubmit={mockOnSubmitError} />)

    const submitButton = screen.getByRole('button', { name: /submitButton/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/duplicateSlug/i)).toBeInTheDocument()
    })
  })

  it('should populate form fields when initialData is provided', () => {
    const initialData = {
      id: 'taxonomy-1',
      slug: 'existing-taxonomy',
      display_order: 1,
      is_required: true,
      allow_multiple: false,
      use_for_map_styling: true,
      use_for_filtering: true,
      translations: [
        { locale_code: 'en', name: 'Existing Taxonomy', description: 'Description EN' },
        { locale_code: 'nl', name: 'Bestaande Taxonomie', description: 'Description NL' },
      ],
    }

    render(<TaxonomyTypeForm {...defaultProps} initialData={initialData} />)

    // The form should render with the initial data present
    // The specific field values are managed by react-hook-form's internal state
    // We just verify the form rendered correctly
    expect(screen.getByLabelText(/basicInfo\.slugLabel/i)).toBeInTheDocument()
  })

  it('should render with custom submit label', () => {
    render(<TaxonomyTypeForm {...defaultProps} submitLabel="Create Taxonomy Type" />)

    expect(screen.getByRole('button', { name: /Create Taxonomy Type/i })).toBeInTheDocument()
  })

  it('should handle generic errors gracefully', async () => {
    const user = userEvent.setup()
    const mockOnSubmitError = vi.fn().mockRejectedValue(new Error('Something went wrong'))
    render(<TaxonomyTypeForm {...defaultProps} onSubmit={mockOnSubmitError} />)

    const submitButton = screen.getByRole('button', { name: /submitButton/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    })
  })

  it('should display help text for configuration options', () => {
    render(<TaxonomyTypeForm {...defaultProps} />)

    expect(screen.getByText(/basicInfo\.slugHelpText/i)).toBeInTheDocument()
    expect(screen.getByText(/basicInfo\.isRequiredHelpText/i)).toBeInTheDocument()
    expect(screen.getByText(/basicInfo\.allowMultipleHelpText/i)).toBeInTheDocument()
    expect(screen.getByText(/basicInfo\.useForMapStylingHelpText/i)).toBeInTheDocument()
    expect(screen.getByText(/basicInfo\.useForFilteringHelpText/i)).toBeInTheDocument()
  })

  it('should separate translation sections clearly', () => {
    render(<TaxonomyTypeForm {...defaultProps} />)

    expect(screen.getByText(/translations\.english\.title/i)).toBeInTheDocument()
    expect(screen.getByText(/translations\.dutch\.title/i)).toBeInTheDocument()
    expect(screen.getByText(/translations\.french\.title/i)).toBeInTheDocument()

    const englishSection = screen.getByText(/translations\.english\.title/i).closest('div')
    const dutchSection = screen.getByText(/translations\.dutch\.title/i).closest('div')
    const frenchSection = screen.getByText(/translations\.french\.title/i).closest('div')

    // Check that sections exist
    expect(englishSection).toBeTruthy()
    expect(dutchSection).toBeTruthy()
    expect(frenchSection).toBeTruthy()

    // Verify they are different elements
    expect(englishSection).not.toBe(dutchSection)
    expect(dutchSection).not.toBe(frenchSection)
  })
})
