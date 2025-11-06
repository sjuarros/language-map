/**
 * Language Family Form Component
 * ===============================
 * Reusable form for creating and editing language families with multilingual support.
 *
 * Language families are global entities (e.g., "Indo-European", "Sino-Tibetan")
 * shared across all cities in the platform.
 *
 * @module components/language-families/language-family-form
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save } from 'lucide-react'

/**
 * Validation schema for language family form
 */
const languageFamilyFormSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  // English (required)
  name_en: z.string().min(1, 'English name is required'),
  description_en: z.string().optional(),
  // Dutch (optional)
  name_nl: z.string().optional(),
  description_nl: z.string().optional(),
  // French (optional)
  name_fr: z.string().optional(),
  description_fr: z.string().optional(),
})

type LanguageFamilyFormValues = z.infer<typeof languageFamilyFormSchema>

/**
 * Props for LanguageFamilyForm component
 */
interface LanguageFamilyFormProps {
  /** Existing language family data for edit mode */
  initialData?: {
    id: string
    slug: string
    translations: Array<{
      locale_code: string
      name: string
      description: string | null
    }>
  }
  /** Callback function to handle form submission */
  onSubmit: (data: LanguageFamilyFormValues) => Promise<void>
  /** Label for the submit button (default: "Save") */
  submitLabel?: string
}

/**
 * Language Family Form Component
 *
 * @param props - Component props
 * @returns Form component for creating/editing language families
 */
export default function LanguageFamilyForm({
  initialData,
  onSubmit,
  submitLabel,
}: LanguageFamilyFormProps) {
  const t = useTranslations('operator.languageFamilies.form')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LanguageFamilyFormValues>({
    resolver: zodResolver(languageFamilyFormSchema),
    defaultValues: {
      slug: initialData?.slug || '',
      name_en:
        initialData?.translations.find((t) => t.locale_code === 'en')?.name || '',
      description_en:
        initialData?.translations.find((t) => t.locale_code === 'en')?.description || '',
      name_nl:
        initialData?.translations.find((t) => t.locale_code === 'nl')?.name || '',
      description_nl:
        initialData?.translations.find((t) => t.locale_code === 'nl')?.description || '',
      name_fr:
        initialData?.translations.find((t) => t.locale_code === 'fr')?.name || '',
      description_fr:
        initialData?.translations.find((t) => t.locale_code === 'fr')?.description || '',
    },
  })

  /**
   * Handle form submission with error handling
   *
   * @param data - Form data to submit
   */
  const handleFormSubmit = async (data: LanguageFamilyFormValues) => {
    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit(data)
    } catch (err) {
      console.error('Form submission error:', err)
      let errorMessage = tCommon('error')

      if (err instanceof Error) {
        const message = err.message.toLowerCase()

        if (message.includes('unauthorized') || message.includes('permission')) {
          errorMessage = tErrors('permissionDenied')
        } else if (message.includes('validation') || message.includes('invalid')) {
          errorMessage = tErrors('validationFailed')
        } else if (message.includes('network') || message.includes('fetch')) {
          errorMessage = tErrors('networkError')
        } else if (message.includes('duplicate') || message.includes('unique') || message.includes('already exists')) {
          errorMessage = tErrors('duplicateSlug')
        } else {
          errorMessage = `${tErrors('saveFailed')}: ${err.message}`
        }
      }

      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('basicInfo.title')}</CardTitle>
          <CardDescription>{t('basicInfo.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slug">
              {t('basicInfo.slugLabel')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="slug"
              {...register('slug')}
              placeholder={t('basicInfo.slugPlaceholder')}
            />
            {errors.slug && (
              <p className="text-sm text-red-500">{errors.slug.message}</p>
            )}
            <p className="text-xs text-gray-500">{t('basicInfo.slugHelpText')}</p>
          </div>
        </CardContent>
      </Card>

      {/* English Translation (Required) */}
      <Card>
        <CardHeader>
          <CardTitle>{t('english.title')}</CardTitle>
          <CardDescription>{t('english.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name_en">
              {t('english.nameLabel')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name_en"
              {...register('name_en')}
              placeholder={t('english.namePlaceholder')}
            />
            {errors.name_en && (
              <p className="text-sm text-red-500">{errors.name_en.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_en">{t('english.descriptionLabel')}</Label>
            <Textarea
              id="description_en"
              {...register('description_en')}
              placeholder={t('english.descriptionPlaceholder')}
              rows={3}
            />
            {errors.description_en && (
              <p className="text-sm text-red-500">{errors.description_en.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dutch Translation (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dutch.title')}</CardTitle>
          <CardDescription>{t('dutch.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name_nl">{t('dutch.nameLabel')}</Label>
            <Input
              id="name_nl"
              {...register('name_nl')}
              placeholder={t('dutch.namePlaceholder')}
            />
            {errors.name_nl && (
              <p className="text-sm text-red-500">{errors.name_nl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_nl">{t('dutch.descriptionLabel')}</Label>
            <Textarea
              id="description_nl"
              {...register('description_nl')}
              placeholder={t('dutch.descriptionPlaceholder')}
              rows={3}
            />
            {errors.description_nl && (
              <p className="text-sm text-red-500">{errors.description_nl.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* French Translation (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>{t('french.title')}</CardTitle>
          <CardDescription>{t('french.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name_fr">{t('french.nameLabel')}</Label>
            <Input
              id="name_fr"
              {...register('name_fr')}
              placeholder={t('french.namePlaceholder')}
            />
            {errors.name_fr && (
              <p className="text-sm text-red-500">{errors.name_fr.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_fr">{t('french.descriptionLabel')}</Label>
            <Textarea
              id="description_fr"
              {...register('description_fr')}
              placeholder={t('french.descriptionPlaceholder')}
              rows={3}
            />
            {errors.description_fr && (
              <p className="text-sm text-red-500">{errors.description_fr.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {tCommon('saving')}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {submitLabel || tCommon('save')}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
