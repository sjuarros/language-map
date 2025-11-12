/**
 * Description Translation Form Component
 * =======================================
 * Form for editing or creating a description translation for a specific locale.
 *
 * This is a client component that allows inline editing of translations.
 * Uses a textarea for multi-line description text.
 *
 * @module components/descriptions/description-translation-form
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Save, Trash2, Edit, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  upsertDescriptionTranslation,
  deleteDescriptionTranslation,
  type DescriptionTranslation,
} from '@/app/actions/description-translations'
import { VALIDATION_LIMITS } from '@/lib/sanitization'

/**
 * Props for DescriptionTranslationForm component
 *
 * @param citySlug - The city identifier
 * @param descriptionId - The description UUID
 * @param translation - Existing translation data (if editing)
 * @param localeCode - Locale code (if creating new)
 * @param localeName - Display name for the locale (e.g., "English", "Nederlands")
 */
interface DescriptionTranslationFormProps {
  citySlug: string
  descriptionId: string
  translation?: DescriptionTranslation
  localeCode?: string
  localeName: string
}

/**
 * Description Translation Form Component
 *
 * Provides inline editing for description translations.
 * - For existing translations: Shows current value with edit/delete buttons
 * - For missing translations: Shows textarea field to add translation
 *
 * Error Handling:
 * - Displays user-friendly error messages on save/delete failures
 * - Prevents submission with empty values
 * - Shows loading state during async operations
 *
 * @param props - Component props
 * @returns Description translation form component
 * @throws {Error} If required props are missing or invalid
 */
export function DescriptionTranslationForm({
  citySlug,
  descriptionId,
  translation,
  localeCode,
  localeName,
}: DescriptionTranslationFormProps) {
  // Validate required props at component entry
  if (!citySlug || typeof citySlug !== 'string' || citySlug.trim() === '') {
    throw new Error('citySlug is required and must be a non-empty string')
  }

  if (!descriptionId || typeof descriptionId !== 'string' || descriptionId.trim() === '') {
    throw new Error('descriptionId is required and must be a non-empty string')
  }

  if (!localeName || typeof localeName !== 'string' || localeName.trim() === '') {
    throw new Error('localeName is required and must be a non-empty string')
  }

  if (!translation && !localeCode) {
    throw new Error('Either translation or localeCode must be provided')
  }

  const t = useTranslations('descriptionTranslations.form')
  const tCommon = useTranslations('common')
  const router = useRouter()

  const isExisting = !!translation
  const currentLocaleCode = translation?.locale || localeCode!

  const [isEditing, setIsEditing] = useState(!isExisting) // New translations start in edit mode
  const [text, setText] = useState(translation?.text || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Handle form submission (create or update translation)
   *
   * @async
   * @returns Promise<void>
   */
  const handleSubmit = async () => {
    try {
      // Validation
      if (!text.trim()) {
        setError(t('validation.textRequired'))
        return
      }

      setError(null)
      setIsSubmitting(true)

      await upsertDescriptionTranslation(citySlug, descriptionId, {
        locale: currentLocaleCode,
        text: text.trim(),
      })

      setIsEditing(false)
      router.refresh()
    } catch (err) {
      console.error('Error saving translation:', err)
      setError(err instanceof Error ? err.message : tCommon('error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle translation deletion
   *
   * @async
   * @returns Promise<void>
   */
  const handleDelete = async () => {
    try {
      if (!window.confirm(t('confirmDelete'))) {
        return
      }

      setError(null)
      setIsDeleting(true)

      await deleteDescriptionTranslation(citySlug, descriptionId, currentLocaleCode)

      router.refresh()
    } catch (err) {
      console.error('Error deleting translation:', err)
      setError(err instanceof Error ? err.message : tCommon('error'))
    } finally {
      setIsDeleting(false)
    }
  }

  /**
   * Handle cancel edit
   *
   * Resets form to original state
   */
  const handleCancel = () => {
    if (isExisting) {
      setText(translation.text)
      setIsEditing(false)
      setError(null)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Locale Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-base font-semibold">{localeName}</Label>
              <Badge variant="secondary" className="text-xs">
                {currentLocaleCode}
              </Badge>
              {translation?.is_ai_translated && (
                <Badge variant="outline" className="text-xs bg-amber-100 text-amber-900 border-amber-300">
                  AI
                </Badge>
              )}
            </div>
            {isExisting && !isEditing && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  disabled={isDeleting}
                  aria-label={tCommon('actions.edit')}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive"
                  aria-label={tCommon('actions.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Display Mode (for existing translations) */}
          {isExisting && !isEditing && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm whitespace-pre-wrap">{translation.text}</p>
            </div>
          )}

          {/* Edit Mode */}
          {isEditing && (
            <div className="space-y-3">
              <div>
                <Label htmlFor={`text-${currentLocaleCode}`}>
                  {t('textLabel')}
                </Label>
                <Textarea
                  id={`text-${currentLocaleCode}`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t('textPlaceholder')}
                  disabled={isSubmitting}
                  className="mt-1 min-h-[150px]"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {text.length} / {VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} {t('charactersLabel')}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !text.trim()}
                  size="sm"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? tCommon('actions.saving') : tCommon('actions.save')}
                </Button>
                {isExisting && (
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    size="sm"
                  >
                    <X className="mr-2 h-4 w-4" />
                    {tCommon('actions.cancel')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* AI Translation Info */}
          {translation?.is_ai_translated && (
            <div className="text-xs text-muted-foreground">
              {t('aiTranslatedInfo', {
                model: translation.ai_model || 'Unknown',
                date: translation.ai_translated_at
                  ? new Date(translation.ai_translated_at).toLocaleDateString()
                  : 'Unknown',
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
