/**
 * AI Source Form Component
 *
 * Provides a form for creating and editing AI sources (whitelist/blacklist)
 * for controlling which sources can be used in AI description generation.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createAISource,
  updateAISource,
  type AISourceFormData,
} from '@/app/actions/ai-sources'

/**
 * Existing AI source data for editing
 */
interface ExistingAISource {
  id: string
  url: string
  list_type: 'whitelist' | 'blacklist'
  notes: string | null
}

interface AISourceFormProps {
  citySlug: string
  existingAISource?: ExistingAISource
  mode: 'create' | 'edit'
}

/**
 * Constants
 */
const MAX_URL_LENGTH = 500
const MAX_NOTES_LENGTH = 1000
const NOTES_TEXTAREA_ROWS = 4

/**
 * AISourceForm component
 *
 * Renders a form for creating or editing AI sources with validation.
 * Supports both create and edit modes with different behaviors for each mode.
 *
 * @param props - Component props
 * @param props.citySlug - The slug of the city (e.g., 'amsterdam', 'paris')
 * @param props.existingAISource - Existing AI source data for edit mode (undefined in create mode)
 * @param props.mode - Form mode: 'create' for new sources, 'edit' for updating existing sources
 * @returns React functional component rendering the AI source form
 */
export function AISourceForm({
  citySlug,
  existingAISource,
  mode,
}: AISourceFormProps): React.JSX.Element {
  // Input validation - validate props at component entry
  if (!citySlug || typeof citySlug !== 'string' || citySlug.trim() === '') {
    throw new Error('citySlug is required and must be a non-empty string')
  }

  if (mode !== 'create' && mode !== 'edit') {
    throw new Error('mode must be "create" or "edit"')
  }

  // If in edit mode, existingAISource is required
  if (mode === 'edit' && !existingAISource) {
    throw new Error('existingAISource is required when mode is "edit"')
  }

  const t = useTranslations('aiSources')
  const router = useRouter()

  // Form state
  const [url, setUrl] = useState(existingAISource?.url || '')
  const [listType, setListType] = useState<'whitelist' | 'blacklist'>(
    existingAISource?.list_type || 'whitelist'
  )
  const [notes, setNotes] = useState(existingAISource?.notes || '')

  // UI state
  const [error, setError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Handles form submission
   * Validates input, calls the appropriate server action, and handles the response
   *
   * @async
   * @param e - Form submission event
   * @returns Promise that resolves when submission is complete
   * @throws {Error} If validation fails or server action fails
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // Validate required fields client-side before submitting
      if (!url.trim()) {
        throw new Error(t('errors.urlRequired'))
      }

      if (url.length > MAX_URL_LENGTH) {
        throw new Error(t('errors.urlTooLong', { max: MAX_URL_LENGTH }))
      }

      if (notes.length > MAX_NOTES_LENGTH) {
        throw new Error(t('errors.notesTooLong', { max: MAX_NOTES_LENGTH }))
      }

      // Prepare form data
      const formData: AISourceFormData = {
        url: url.trim(),
        list_type: listType,
        notes: notes.trim() || null,
      }

      // Call the appropriate server action
      if (mode === 'create') {
        await createAISource(citySlug, formData)
      } else {
        if (!existingAISource) {
          throw new Error('Cannot update: AI source data is missing')
        }
        await updateAISource(citySlug, existingAISource.id, formData)
      }

      // Redirect to the AI sources list on success
      router.push(`/${citySlug}/ai-sources`)
    } catch (err) {
      // Display error message to user with granular error handling
      console.error('Error saving AI source:', err)

      if (err instanceof Error) {
        // Check for specific error types to provide better user feedback
        if (err.message.includes('Validation failed')) {
          setError(err.message)
        } else if (err.message.includes('authenticated')) {
          setError(t('errors.authenticationRequired'))
        } else if (err.message.includes('already exists') || err.message.includes('already in the')) {
          setError(t('errors.duplicateUrl'))
        } else if (err.message.includes('City not found')) {
          setError(t('errors.cityNotFound'))
        } else if (err.message.includes('permission')) {
          setError(t('errors.permissionDenied'))
        } else {
          setError(err.message)
        }
      } else {
        setError(t('errors.saveFailed'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handles cancel button click
   * Navigates back to the AI sources list without saving
   *
   * @returns void
   */
  const handleCancel = (): void => {
    // Validate citySlug before navigation to prevent broken URLs
    if (!citySlug || typeof citySlug !== 'string' || citySlug.trim() === '') {
      console.error('Cannot navigate: invalid citySlug')
      setError(t('errors.navigationFailed'))
      return
    }
    router.push(`/${citySlug}/ai-sources`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message display */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      {/* URL field */}
      <div className="space-y-2">
        <Label htmlFor="url">
          {t('fields.url.label')} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="url"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t('fields.url.placeholder')}
          maxLength={MAX_URL_LENGTH}
          required
          aria-required="true"
          aria-describedby="url-help"
        />
        <p id="url-help" className="text-sm text-gray-500">
          {t('fields.url.help')}
        </p>
      </div>

      {/* List type field */}
      <div className="space-y-2">
        <Label htmlFor="list-type">
          {t('fields.listType.label')} <span className="text-red-500">*</span>
        </Label>
        <Select value={listType} onValueChange={(value) => setListType(value as 'whitelist' | 'blacklist')}>
          <SelectTrigger id="list-type" aria-required="true">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="whitelist">{t('fields.listType.whitelist')}</SelectItem>
            <SelectItem value="blacklist">{t('fields.listType.blacklist')}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500">
          {listType === 'whitelist'
            ? t('fields.listType.whitelistHelp')
            : t('fields.listType.blacklistHelp')}
        </p>
      </div>

      {/* Notes field */}
      <div className="space-y-2">
        <Label htmlFor="notes">{t('fields.notes.label')}</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('fields.notes.placeholder')}
          rows={NOTES_TEXTAREA_ROWS}
          maxLength={MAX_NOTES_LENGTH}
          aria-describedby="notes-help"
        />
        <p id="notes-help" className="text-sm text-gray-500">
          {t('fields.notes.help')} ({notes.length}/{MAX_NOTES_LENGTH})
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t('actions.saving')
            : mode === 'create'
            ? t('actions.create')
            : t('actions.update')}
        </Button>
        <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
          {t('actions.cancel')}
        </Button>
      </div>
    </form>
  )
}
