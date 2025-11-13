/**
 * Language Translation Form Component
 * ====================================
 * Form for editing or creating a language name translation for a specific locale.
 *
 * This is a client component that allows inline editing of translations.
 *
 * @module components/languages/language-translation-form
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Save, Trash2, Edit, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  upsertLanguageTranslation,
  deleteLanguageTranslation,
  type LanguageTranslation,
} from '@/app/actions/language-translations'

/**
 * Props for LanguageTranslationForm component
 *
 * @param citySlug - The city identifier
 * @param languageId - The language UUID
 * @param translation - Existing translation data (if editing)
 * @param localeCode - Locale code (if creating new)
 * @param localeName - Display name for the locale (e.g., "English", "Nederlands")
 */
interface LanguageTranslationFormProps {
  citySlug: string
  languageId: string
  translation?: LanguageTranslation
  localeCode?: string
  localeName: string
}

/**
 * Language Translation Form Component
 *
 * Provides inline editing for language translations.
 * - For existing translations: Shows current value with edit/delete buttons
 * - For missing translations: Shows input field to add translation
 *
 * Error Handling:
 * - Displays user-friendly error messages on save/delete failures
 * - Prevents submission with empty values
 * - Shows loading state during async operations
 *
 * @param props - Component props
 * @returns Language translation form component
 */
export function LanguageTranslationForm({
  citySlug,
  languageId,
  translation,
  localeCode,
  localeName,
}: LanguageTranslationFormProps) {
  const t = useTranslations('languageTranslations.form')
  const tCommon = useTranslations('common')
  const router = useRouter()

  const isExisting = !!translation
  const currentLocaleCode = translation?.locale_code || localeCode || ''

  const [isEditing, setIsEditing] = useState(!isExisting) // New translations start in edit mode
  const [name, setName] = useState(translation?.name || '')
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
      if (!name.trim()) {
        setError(t('validation.nameRequired'))
        return
      }

      setError(null)
      setIsSubmitting(true)

      await upsertLanguageTranslation(citySlug, languageId, {
        locale_code: currentLocaleCode,
        name: name.trim(),
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

      await deleteLanguageTranslation(citySlug, languageId, currentLocaleCode)

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
      setName(translation.name)
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
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Display Mode (for existing translations) */}
          {isExisting && !isEditing && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">{translation.name}</p>
            </div>
          )}

          {/* Edit Mode */}
          {isEditing && (
            <div className="space-y-3">
              <div>
                <Label htmlFor={`name-${currentLocaleCode}`}>
                  {t('nameLabel')}
                </Label>
                <Input
                  id={`name-${currentLocaleCode}`}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  disabled={isSubmitting}
                  className="mt-1"
                />
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
                  disabled={isSubmitting || !name.trim()}
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
