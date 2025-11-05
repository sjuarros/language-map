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
  isActive: z.boolean().optional(),
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
    is_active: boolean
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
  submitLabel = 'Save Neighborhood',
}: NeighborhoodFormProps) {
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
      isActive: initialData?.is_active ?? true,
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
          errorMessage = 'A neighborhood with this slug already exists. Please choose a different slug.'
        } else if (message.includes('invalid district')) {
          errorMessage = 'The selected district is invalid. Please choose a district from the list.'
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
            Neighborhood identifier and geographic hierarchy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="districtId">
              District <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="districtId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="districtId">
                    <SelectValue placeholder="Select a district" />
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
              Select the district this neighborhood belongs to
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug <span className="text-red-500">*</span>
            </Label>
            <Input
              id="slug"
              {...register('slug')}
              placeholder="e.g., jordaan, de-pijp, vondelpark"
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
            Inactive neighborhoods are hidden from the public interface
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
              Neighborhood Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name_en"
              {...register('name_en')}
              placeholder="e.g., Jordaan"
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
              placeholder="Brief description of the neighborhood..."
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
            <Label htmlFor="name_nl">Neighborhood Name</Label>
            <Input
              id="name_nl"
              {...register('name_nl')}
              placeholder="e.g., Jordaan"
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
              placeholder="Korte beschrijving van de buurt..."
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
            <Label htmlFor="name_fr">Neighborhood Name</Label>
            <Input
              id="name_fr"
              {...register('name_fr')}
              placeholder="e.g., Jordaan"
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
