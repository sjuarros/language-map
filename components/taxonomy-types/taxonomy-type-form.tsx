/**
 * Taxonomy Type Form Component
 * ============================
 * Reusable form for creating and editing taxonomy types with multilingual support.
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

const taxonomyTypeFormSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  isRequired: z.boolean().default(false),
  allowMultiple: z.boolean().default(false),
  useForMapStyling: z.boolean().default(false),
  useForFiltering: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
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

type TaxonomyTypeFormValues = z.infer<typeof taxonomyTypeFormSchema>

interface TaxonomyTypeFormProps {
  cityId: string
  citySlug: string
  locale: string
  initialData?: {
    id: string
    slug: string
    is_required: boolean
    allow_multiple: boolean
    use_for_map_styling: boolean
    use_for_filtering: boolean
    display_order: number
    translations: Array<{
      locale_code: string
      name: string
      description: string | null
    }>
  }
  onSubmit: (data: TaxonomyTypeFormValues) => Promise<void>
  submitLabel?: string
}

// Explicit type for form values to avoid type inference issues
type FormValues = {
  slug: string
  isRequired?: boolean
  allowMultiple?: boolean
  useForMapStyling?: boolean
  useForFiltering?: boolean
  displayOrder?: number
  name_en: string
  description_en?: string
  name_nl?: string
  description_nl?: string
  name_fr?: string
  description_fr?: string
}

export default function TaxonomyTypeForm({
  initialData,
  onSubmit,
  submitLabel = 'Save Taxonomy Type',
}: TaxonomyTypeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(taxonomyTypeFormSchema),
    defaultValues: {
      slug: initialData?.slug || '',
      isRequired: initialData?.is_required ?? false,
      allowMultiple: initialData?.allow_multiple ?? false,
      useForMapStyling: initialData?.use_for_map_styling ?? false,
      useForFiltering: initialData?.use_for_filtering ?? true,
      displayOrder: initialData?.display_order ?? 0,
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

  const handleFormSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Transform form data to match the expected TaxonomyTypeFormValues type
      const transformedData = {
        slug: data.slug,
        isRequired: data.isRequired ?? false,
        allowMultiple: data.allowMultiple ?? false,
        useForMapStyling: data.useForMapStyling ?? false,
        useForFiltering: data.useForFiltering ?? true,
        displayOrder: data.displayOrder ?? 0,
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
      let errorMessage = 'An error occurred'

      if (err instanceof Error) {
        const message = err.message.toLowerCase()

        if (message.includes('unauthorized') || message.includes('permission')) {
          errorMessage = 'You do not have permission to perform this action. Please contact your administrator.'
        } else if (message.includes('validation') || message.includes('invalid')) {
          errorMessage = 'Please check your input and try again. Make sure all required fields are filled correctly.'
        } else if (message.includes('network') || message.includes('fetch')) {
          errorMessage = 'A network error occurred. Please check your connection and try again.'
        } else if (message.includes('duplicate') || message.includes('unique')) {
          errorMessage = 'A taxonomy type with this slug already exists. Please choose a different slug.'
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
            Taxonomy type identifier, configuration, and display settings
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
              placeholder="e.g., size, status, script-type"
            />
            {errors.slug && (
              <p className="text-sm text-red-500">{errors.slug.message}</p>
            )}
            <p className="text-xs text-gray-500">
              URL-friendly identifier. Only lowercase letters, numbers, and hyphens.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayOrder">Display Order</Label>
            <Input
              id="displayOrder"
              type="number"
              min="0"
              {...register('displayOrder', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.displayOrder && (
              <p className="text-sm text-red-500">{errors.displayOrder.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Order in which this taxonomy type appears in lists (0 = first)
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <h4 className="text-sm font-medium">Configuration Options</h4>

            <div className="flex items-center space-x-2">
              <input
                id="isRequired"
                type="checkbox"
                {...register('isRequired')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="isRequired">Required</Label>
            </div>
            <p className="text-xs text-gray-500 ml-6">
              Languages must have a value from this taxonomy assigned
            </p>

            <div className="flex items-center space-x-2">
              <input
                id="allowMultiple"
                type="checkbox"
                {...register('allowMultiple')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="allowMultiple">Allow Multiple Values</Label>
            </div>
            <p className="text-xs text-gray-500 ml-6">
              Languages can have multiple values from this taxonomy
            </p>

            <div className="flex items-center space-x-2">
              <input
                id="useForMapStyling"
                type="checkbox"
                {...register('useForMapStyling')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="useForMapStyling">Use for Map Styling</Label>
            </div>
            <p className="text-xs text-gray-500 ml-6">
              Use this taxonomy to style language points on the map (color, size)
            </p>

            <div className="flex items-center space-x-2">
              <input
                id="useForFiltering"
                type="checkbox"
                {...register('useForFiltering')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="useForFiltering">Show in Filters</Label>
            </div>
            <p className="text-xs text-gray-500 ml-6">
              Show this taxonomy in the public map filter interface
            </p>
          </div>
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
              Taxonomy Type Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name_en"
              {...register('name_en')}
              placeholder="e.g., Community Size"
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
              placeholder="Brief description of this classification system..."
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
            <Label htmlFor="name_nl">Taxonomy Type Name</Label>
            <Input
              id="name_nl"
              {...register('name_nl')}
              placeholder="e.g., Gemeenschapsgrootte"
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
              placeholder="Korte beschrijving van dit classificatiesysteem..."
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
            <Label htmlFor="name_fr">Taxonomy Type Name</Label>
            <Input
              id="name_fr"
              {...register('name_fr')}
              placeholder="e.g., Taille de la Communauté"
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
              placeholder="Brève description de ce système de classification..."
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
