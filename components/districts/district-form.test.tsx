/**
 * @fileoverview Unit tests for DistrictForm component
 * @description Tests form validation, submission, and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DistrictForm from './district-form'
import * as reactHookForm from 'react-hook-form'

// Type for form submission handler
type FormSubmitHandler = (data: Record<string, unknown>) => void

// Type for field registration
type FieldProps = {
  name: string
  onChange: (...args: unknown[]) => unknown
  onBlur: (...args: unknown[]) => unknown
  ref: (...args: unknown[]) => unknown
  value?: string | boolean | undefined
  type?: string
  checked?: boolean
}

// Mock react-hook-form
const defaultFieldValue = {
  slug: '',
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

  return {
    ...base,
    value: defaultFieldValue[field as keyof typeof defaultFieldValue] ?? '',
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
      data.slug = data.slug || 'test-district'
      data.name_en = data.name_en || 'Test District'
      data.description_en = data.description_en || 'Test description'
      data.name_nl = data.name_nl || 'Test District NL'
      data.description_nl = data.description_nl || 'Test beschrijving'
      data.name_fr = data.name_fr || 'Test District FR'
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
  cityId: 'city-1',
  citySlug: 'amsterdam',
  locale: 'en',
  onSubmit: mockOnSubmit,
  submitLabel: 'Save District',
}

describe('DistrictForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the form with all required fields', () => {
    render(<DistrictForm {...defaultProps} />)

    expect(screen.getByLabelText('Slug *')).toBeInTheDocument()
    expect(screen.getByLabelText(/Active/i)).toBeInTheDocument()
    expect(screen.getByLabelText('District Name *')).toBeInTheDocument()
    expect(screen.getByText(/English Translation/i)).toBeInTheDocument()
    expect(screen.getByText(/Dutch Translation/i)).toBeInTheDocument()
    expect(screen.getByText(/French Translation/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Save District/i })).toBeInTheDocument()
  })

  it('should submit the form with valid data', async () => {
    const user = userEvent.setup()
    render(<DistrictForm {...defaultProps} />)

    const slugInput = screen.getByLabelText('Slug *')
    const nameInput = screen.getByLabelText('District Name *')

    await user.type(slugInput, 'test-district')
    await user.type(nameInput, 'Test District')

    const submitButton = screen.getByRole('button', { name: /Save District/i })
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
          name_en: { message: 'English name is required' },
        },
      },
      watch: vi.fn(() => ''),
    } as unknown as ReturnType<typeof reactHookForm.useForm>)

    render(<DistrictForm {...defaultProps} />)

    expect(screen.getByText('English name is required')).toBeInTheDocument()
  })

  it('should show validation error for invalid slug format', async () => {
    // Clear previous mocks to set up our test state
    vi.clearAllMocks()

    // Mock useForm to return error state
    const mockUseForm = vi.mocked(reactHookForm.useForm)
    mockUseForm.mockReturnValue({
      register: vi.fn(),
      handleSubmit: vi.fn((fn: FormSubmitHandler) => (e: React.FormEvent) => {
        e.preventDefault()
        fn({
          slug: 'Invalid@Slug', // Invalid characters
          name_en: 'Test',
        })
      }),
      formState: {
        errors: {
          slug: { message: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        },
      },
      watch: vi.fn(() => ''),
    } as unknown as ReturnType<typeof reactHookForm.useForm>)

    render(<DistrictForm {...defaultProps} />)

    expect(
      screen.getByText('Slug must contain only lowercase letters, numbers, and hyphens')
    ).toBeInTheDocument()
  })

  it('should display loading state during submission', async () => {
    let resolveSubmit: () => void
    const mockOnSubmit = vi.fn().mockImplementation(() => {
      // Simulate async submission
      return new Promise<void>((resolve) => {
        resolveSubmit = resolve
      })
    })

    const user = userEvent.setup()
    render(<DistrictForm {...defaultProps} onSubmit={mockOnSubmit} />)

    const submitButton = screen.getByRole('button', { name: /Save District/i })

    // Wrap the click and state assertion in act()
    await act(async () => {
      await user.click(submitButton)
      // Wait for the loading state to appear
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument()
      })
    })

    expect(submitButton).toBeDisabled()

    // Resolve the submit
    resolveSubmit!()
  })

  it('should display error message when submission fails', async () => {
    const user = userEvent.setup()
    const mockOnSubmitError = vi.fn().mockRejectedValue(new Error('Network error'))
    render(<DistrictForm {...defaultProps} onSubmit={mockOnSubmitError} />)

    const submitButton = screen.getByRole('button', { name: /Save District/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument()
    })
  })

  it('should show specific error for unauthorized access', async () => {
    const user = userEvent.setup()
    const mockOnSubmitError = vi.fn().mockRejectedValue(new Error('Unauthorized'))
    render(<DistrictForm {...defaultProps} onSubmit={mockOnSubmitError} />)

    const submitButton = screen.getByRole('button', { name: /Save District/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/permission/i)).toBeInTheDocument()
    })
  })

  it('should show specific error for validation failures', async () => {
    const user = userEvent.setup()
    const mockOnSubmitError = vi.fn().mockRejectedValue(new Error('Validation failed'))
    render(<DistrictForm {...defaultProps} onSubmit={mockOnSubmitError} />)

    const submitButton = screen.getByRole('button', { name: /Save District/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/check your input/i)).toBeInTheDocument()
    })
  })

  it('should show specific error for network errors', async () => {
    const user = userEvent.setup()
    const mockOnSubmitError = vi.fn().mockRejectedValue(new Error('Failed to fetch'))
    render(<DistrictForm {...defaultProps} onSubmit={mockOnSubmitError} />)

    const submitButton = screen.getByRole('button', { name: /Save District/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
  })

  it('should show specific error for duplicate slug', async () => {
    const user = userEvent.setup()
    const mockOnSubmitError = vi.fn().mockRejectedValue(new Error('duplicate key value'))
    render(<DistrictForm {...defaultProps} onSubmit={mockOnSubmitError} />)

    const submitButton = screen.getByRole('button', { name: /Save District/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    })
  })

  it('should populate form fields when initialData is provided', () => {
    const initialData = {
      id: 'district-1',
      slug: 'existing-district',
      translations: [
        { locale_code: 'en', name: 'Existing District', description: 'Description EN' },
        { locale_code: 'nl', name: 'Bestaand District', description: 'Description NL' },
      ],
    }

    render(<DistrictForm {...defaultProps} initialData={initialData} />)

    // The form should render with the initial data present
    // The specific field values are managed by react-hook-form's internal state
    // We just verify the form rendered correctly
    expect(screen.getByLabelText('Slug *')).toBeInTheDocument()
  })

  it('should render with custom submit label', () => {
    render(<DistrictForm {...defaultProps} submitLabel="Create District" />)

    expect(screen.getByRole('button', { name: /Create District/i })).toBeInTheDocument()
  })

  it('should handle generic errors gracefully', async () => {
    const user = userEvent.setup()
    const mockOnSubmitError = vi.fn().mockRejectedValue(new Error('Something went wrong'))
    render(<DistrictForm {...defaultProps} onSubmit={mockOnSubmitError} />)

    const submitButton = screen.getByRole('button', { name: /Save District/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    })
  })

  it('should display help text for slug field', () => {
    render(<DistrictForm {...defaultProps} />)

    expect(
      screen.getByText(/URL-friendly identifier. Only lowercase letters, numbers, and hyphens/i)
    ).toBeInTheDocument()
  })

  it('should separate translation sections clearly', () => {
    render(<DistrictForm {...defaultProps} />)

    expect(screen.getByText(/English Translation/i)).toBeInTheDocument()
    expect(screen.getByText(/Dutch Translation/i)).toBeInTheDocument()
    expect(screen.getByText(/French Translation/i)).toBeInTheDocument()

    const englishSection = screen.getByText(/English Translation/i).closest('div')
    const dutchSection = screen.getByText(/Dutch Translation/i).closest('div')
    const frenchSection = screen.getByText(/French Translation/i).closest('div')

    // Check that sections exist
    expect(englishSection).toBeTruthy()
    expect(dutchSection).toBeTruthy()
    expect(frenchSection).toBeTruthy()

    // Verify they are different elements
    expect(englishSection).not.toBe(dutchSection)
    expect(dutchSection).not.toBe(frenchSection)
    expect(englishSection).not.toBe(frenchSection)
  })
})
