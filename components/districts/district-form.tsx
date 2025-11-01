/**
 * District Form Component
 * =======================
 * Reusable form for creating and editing districts with multilingual support.
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save } from 'lucide-react'

const districtFormSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  isActive: z.boolean().default(true),
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

type DistrictFormValues = z.infer<typeof districtFormSchema>

interface DistrictFormProps {
  cityId: string
  citySlug: string
  locale: string
  initialData?: {
    id: string
    slug: string
    is_active: boolean
    translations: Array<{
      locale: string
      name: string
      description: string | null
    }>
  }
  onSubmit: (data: DistrictFormValues) => Promise<void>
  submitLabel?: string
}

// Explicit type for form values to avoid type inference issues
type FormValues = {
  slug: string
  isActive?: boolean
  name_en: string
  description_en?: string
  name_nl?: string
  description_nl?: string
  name_fr?: string
  description_fr?: string
}

export default function DistrictForm({
  initialData,
  onSubmit,
  submitLabel = 'Save District',
}: DistrictFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(districtFormSchema),
    defaultValues: {
      slug: initialData?.slug || '',
      isActive: initialData?.is_active ?? true,
      name_en:
        initialData?.translations.find((t) => t.locale === 'en')?.name || '',
      description_en:
        initialData?.translations.find((t) => t.locale === 'en')?.description || '',
      name_nl:
        initialData?.translations.find((t) => t.locale === 'nl')?.name || '',
      description_nl:
        initialData?.translations.find((t) => t.locale === 'nl')?.description || '',
      name_fr:
        initialData?.translations.find((t) => t.locale === 'fr')?.name || '',
      description_fr:
        initialData?.translations.find((t) => t.locale === 'fr')?.description || '',
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

  const handleFormSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Transform form data to match the expected DistrictFormValues type
      const transformedData = {
        slug: data.slug,
        isActive: data.isActive ?? true,
        name_en: data.name_en,
        description_en: data.description_en,
        name_nl: data.name_nl,
        description_nl: data.description_nl,
        name_fr: data.name_fr,
        description_fr: data.description_fr,
      }
      await onSubmit(transformedData)
    } catch (err) {
      console.error('Form submission error:', err)
      let errorMessage = 'An unexpected error occurred'

      if (err instanceof Error) {
        const message = err.message.toLowerCase()

        if (message.includes('unauthorized') || message.includes('permission')) {
          errorMessage = 'You do not have permission to perform this action. Please contact your administrator.'
        } else if (message.includes('validation') || message.includes('invalid')) {
          errorMessage = 'Please check your input and try again. Make sure all required fields are filled correctly.'
        } else if (message.includes('network') || message.includes('fetch')) {
          errorMessage = 'A network error occurred. Please check your connection and try again.'
        } else if (message.includes('duplicate') || message.includes('unique')) {
          errorMessage = 'A district with this slug already exists. Please choose a different slug.'
        } else {
          errorMessage = `An error occurred while saving: ${err.message}`
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
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            District identifier and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug <span className="text-red-500">*</span>
            </Label>
            <Input
              id="slug"
              {...register('slug')}
              placeholder="e.g., centrum, west, north"
            />
            {errors.slug && (
              <p className="text-sm text-red-500">{errors.slug.message}</p>
            )}
            <p className="text-xs text-gray-500">
              URL-friendly identifier. Only lowercase letters, numbers, and hyphens.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="isActive"
              type="checkbox"
              {...register('isActive')}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
          <p className="text-xs text-gray-500">
            Inactive districts are hidden from the public interface
          </p>
        </CardContent>
      </Card>

      {/* English Translation (Required) */}
      <Card>
        <CardHeader>
          <CardTitle>English Translation</CardTitle>
          <CardDescription>
            Required translation - Primary language
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name_en">
              District Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name_en"
              {...register('name_en')}
              placeholder="e.g., City Center"
            />
            {errors.name_en && (
              <p className="text-sm text-red-500">{errors.name_en.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_en">Description</Label>
            <Textarea
              id="description_en"
              {...register('description_en')}
              placeholder="Brief description of the district..."
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
          <CardTitle>Dutch Translation (Optional)</CardTitle>
          <CardDescription>
            Secondary language for Dutch-speaking users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name_nl">District Name</Label>
            <Input
              id="name_nl"
              {...register('name_nl')}
              placeholder="e.g., Centrum"
            />
            {errors.name_nl && (
              <p className="text-sm text-red-500">{errors.name_nl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_nl">Description</Label>
            <Textarea
              id="description_nl"
              {...register('description_nl')}
              placeholder="Korte beschrijving van het district..."
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
          <CardTitle>French Translation (Optional)</CardTitle>
          <CardDescription>
            Secondary language for French-speaking users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name_fr">District Name</Label>
            <Input
              id="name_fr"
              {...register('name_fr')}
              placeholder="e.g., Centre-ville"
            />
            {errors.name_fr && (
              <p className="text-sm text-red-500">{errors.name_fr.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_fr">Description</Label>
            <Textarea
              id="description_fr"
              {...register('description_fr')}
              placeholder="Brève description du quartier..."
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
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
