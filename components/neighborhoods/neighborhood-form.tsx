/**
 * Neighborhood Form Component
 * ===========================
 * Reusable form for creating and editing neighborhoods with multilingual support.
 * Includes district selection for geographic hierarchy.
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save } from 'lucide-react'

const neighborhoodFormSchema = z.object({
  districtId: z.string().min(1, 'District is required'),
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

type NeighborhoodFormValues = z.infer<typeof neighborhoodFormSchema>

interface District {
  id: string
  slug: string
  translations: Array<{
    locale_code: string
    name: string
  }>
}

interface NeighborhoodFormProps {
  cityId: string
  citySlug: string
  locale: string
  districts: District[]
  initialData?: {
    id: string
    slug: string
    district_id: string
    translations: Array<{
      locale_code: string
      name: string
      description: string | null
    }>
  }
  onSubmit: (data: NeighborhoodFormValues) => Promise<void>
  submitLabel?: string
}

export default function NeighborhoodForm({
  districts,
  initialData,
  onSubmit,
  submitLabel,
}: NeighborhoodFormProps) {
  const t = useTranslations('auth.neighborhoods.form')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<NeighborhoodFormValues>({
    resolver: zodResolver(neighborhoodFormSchema),
    defaultValues: {
      slug: initialData?.slug || '',
      districtId: initialData?.district_id || (districts.length > 0 ? districts[0].id : ''),
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

  const englishName = watch('name_en')

  // Auto-generate slug from English name
  useEffect(() => {
    if (englishName && !initialData) {
      englishName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      // Note: We can't set the slug directly due to controlled vs uncontrolled warning
      // Users should edit slug manually or we could add a toggle to enable auto-generation
    }
  }, [englishName, initialData])

  const handleFormSubmit = async (data: NeighborhoodFormValues) => {
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
        } else if (message.includes('duplicate') || message.includes('unique')) {
          errorMessage = tErrors('duplicateSlug')
        } else if (message.includes('invalid district')) {
          errorMessage = tErrors('validationFailed')
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
          <CardDescription>
            {t('basicInfo.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="districtId">
              {t('basicInfo.districtLabel')} <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="districtId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="districtId">
                    <SelectValue placeholder={t('basicInfo.districtPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => {
                      const translation = district.translations.find((t) => t.locale_code === 'en') || district.translations[0]
                      return (
                        <SelectItem key={district.id} value={district.id}>
                          {translation?.name || district.slug}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.districtId && (
              <p className="text-sm text-red-500">{errors.districtId.message}</p>
            )}
            <p className="text-xs text-gray-500">
              {t('basicInfo.districtHelpText')}
            </p>
          </div>

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
            <p className="text-xs text-gray-500">
              {t('basicInfo.slugHelpText')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* English Translation (Required) */}
      <Card>
        <CardHeader>
          <CardTitle>{t('translations.english.title')}</CardTitle>
          <CardDescription>
            {t('translations.english.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name_en">
              {t('translations.english.nameLabel')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name_en"
              {...register('name_en')}
              placeholder={t('translations.english.namePlaceholder')}
            />
            {errors.name_en && (
              <p className="text-sm text-red-500">{errors.name_en.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_en">{t('translations.english.descriptionLabel')}</Label>
            <Textarea
              id="description_en"
              {...register('description_en')}
              placeholder={t('translations.english.descriptionPlaceholder')}
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
          <CardTitle>{t('translations.dutch.title')}</CardTitle>
          <CardDescription>
            {t('translations.dutch.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name_nl">{t('translations.dutch.nameLabel')}</Label>
            <Input
              id="name_nl"
              {...register('name_nl')}
              placeholder={t('translations.dutch.namePlaceholder')}
            />
            {errors.name_nl && (
              <p className="text-sm text-red-500">{errors.name_nl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_nl">{t('translations.dutch.descriptionLabel')}</Label>
            <Textarea
              id="description_nl"
              {...register('description_nl')}
              placeholder={t('translations.dutch.descriptionPlaceholder')}
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
          <CardTitle>{t('translations.french.title')}</CardTitle>
          <CardDescription>
            {t('translations.french.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name_fr">{t('translations.french.nameLabel')}</Label>
            <Input
              id="name_fr"
              {...register('name_fr')}
              placeholder={t('translations.french.namePlaceholder')}
            />
            {errors.name_fr && (
              <p className="text-sm text-red-500">{errors.name_fr.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_fr">{t('translations.french.descriptionLabel')}</Label>
            <Textarea
              id="description_fr"
              {...register('description_fr')}
              placeholder={t('translations.french.descriptionPlaceholder')}
              rows={3}
            />
            {errors.description_fr && (
              <p className="text-sm text-red-500">{errors.description_fr.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('submitting')}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {submitLabel || t('submitButton')}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
