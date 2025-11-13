/**
 * @file CreateCityForm.tsx
 * @description Client-side form component for creating new cities with multilingual
 * translations (English, Dutch, French). Features client-side validation, error handling,
 * and integration with the createCity server action.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import { createCity } from '@/app/actions/cities'
import { createCityFormSchema, type CreateCityFormData } from '@/lib/validations/city'

type Country = {
  id: string
  slug: string
  translations: Array<{
    name: string
    locale_code: string
  }>
}

type CreateCityFormProps = {
  countries: Country[]
  locale: string
}

type ValidationErrors = Partial<Record<keyof CreateCityFormData, string>>

/**
 * Create City Form Component
 *
 * Client-side form component for creating new cities in the superuser dashboard.
 * Supports multilingual city data for English, Dutch, and French locales.
 *
 * Features:
 * - Client-side validation with Zod schemas
 * - Error handling with user-friendly messages (both field-level and general)
 * - Loading states during submission
 * - Proper accessibility attributes
 * - Shadcn/ui components for consistent UI
 *
 * @param countries - Array of available countries for selection
 * @param locale - Current locale code (e.g., 'en', 'nl', 'fr')
 *
 * @example
 * <CreateCityForm countries={countries} locale="en" />
 */
export function CreateCityForm({ countries, locale }: CreateCityFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({})

  /**
   * Handles form submission with client-side validation
   *
   * @param event - Form submit event
   */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setFieldErrors({})

    const formData = new FormData(event.currentTarget)

    // Extract form data as strings (before conversion)
    const rawData: Record<string, string> = {
      slug: (formData.get('slug') as string) || '',
      country_id: (formData.get('country_id') as string) || '',
      center_lat: (formData.get('center_lat') as string) || '',
      center_lng: (formData.get('center_lng') as string) || '',
      default_zoom: (formData.get('default_zoom') as string) || '',
      name_en: (formData.get('name_en') as string) || '',
      description_en: (formData.get('description_en') as string) || '',
      name_nl: (formData.get('name_nl') as string) || '',
      description_nl: (formData.get('description_nl') as string) || '',
      name_fr: (formData.get('name_fr') as string) || '',
      description_fr: (formData.get('description_fr') as string) || '',
    }

    // Validate using Zod schema with string inputs (will coerce in schema)
    const validation = createCityFormSchema.safeParse(rawData)

    if (!validation.success) {
      // Convert Zod errors to field-level errors
      const errors: ValidationErrors = {}
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof CreateCityFormData
        errors[field] = issue.message
      })
      setFieldErrors(errors)
      setError('Please fix the errors below and try again.')
      setIsSubmitting(false)
      return
    }

    // Submit to server action
    const result = await createCity(validation.data)

    if (result.success) {
      // Success - redirect to superuser dashboard
      router.push(`/${locale}/superuser`)
      router.refresh()
    } else {
      // Show error message to user
      setError(result.error)
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* General Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Required information about the city
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="slug">City Slug *</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="amsterdam"
                required
                pattern="[a-z0-9\-]+"
                title="Lowercase letters, numbers, and hyphens only"
                disabled={isSubmitting}
                aria-invalid={!!fieldErrors.slug}
                aria-describedby={fieldErrors.slug ? 'slug-error' : undefined}
              />
              {fieldErrors.slug && (
                <p id="slug-error" className="text-sm text-red-600 mt-1">
                  {fieldErrors.slug}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                URL-friendly identifier (lowercase letters, numbers, and hyphens)
              </p>
            </div>

            <div>
              <Label htmlFor="country_id">Country *</Label>
              <Select
                name="country_id"
                disabled={isSubmitting}
                onValueChange={(value) => {
                  // Update the hidden input
                  const input = document.getElementById('country_id') as HTMLInputElement
                  if (input) input.value = value
                }}
              >
                <SelectTrigger
                  id="country_id"
                  aria-invalid={!!fieldErrors.country_id}
                  aria-describedby={fieldErrors.country_id ? 'country_id-error' : undefined}
                >
                  <SelectValue placeholder="Select a country..." />
                </SelectTrigger>
                <SelectContent>
                  {countries?.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.translations[0]?.name || country.slug}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" id="country_id" name="country_id" required />
              {fieldErrors.country_id && (
                <p id="country_id-error" className="text-sm text-red-600 mt-1">
                  {fieldErrors.country_id}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="center_lat">Latitude *</Label>
              <Input
                id="center_lat"
                name="center_lat"
                type="number"
                step="any"
                placeholder="52.3676"
                required
                disabled={isSubmitting}
                aria-invalid={!!fieldErrors.center_lat}
                aria-describedby={fieldErrors.center_lat ? 'center_lat-error' : undefined}
              />
              {fieldErrors.center_lat && (
                <p id="center_lat-error" className="text-sm text-red-600 mt-1">
                  {fieldErrors.center_lat}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="center_lng">Longitude *</Label>
              <Input
                id="center_lng"
                name="center_lng"
                type="number"
                step="any"
                placeholder="4.9041"
                required
                disabled={isSubmitting}
                aria-invalid={!!fieldErrors.center_lng}
                aria-describedby={fieldErrors.center_lng ? 'center_lng-error' : undefined}
              />
              {fieldErrors.center_lng && (
                <p id="center_lng-error" className="text-sm text-red-600 mt-1">
                  {fieldErrors.center_lng}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="default_zoom">Default Map Zoom *</Label>
              <Input
                id="default_zoom"
                name="default_zoom"
                type="number"
                min="1"
                max="20"
                placeholder="10"
                required
                disabled={isSubmitting}
                aria-invalid={!!fieldErrors.default_zoom}
                aria-describedby={fieldErrors.default_zoom ? 'default_zoom-error' : undefined}
              />
              {fieldErrors.default_zoom && (
                <p id="default_zoom-error" className="text-sm text-red-600 mt-1">
                  {fieldErrors.default_zoom}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* English Translations */}
        <Card>
          <CardHeader>
            <CardTitle>English Translations</CardTitle>
            <CardDescription>
              English name and description for the city
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name_en">City Name (English) *</Label>
              <Input
                id="name_en"
                name="name_en"
                placeholder="Amsterdam"
                required
                disabled={isSubmitting}
                aria-invalid={!!fieldErrors.name_en}
                aria-describedby={fieldErrors.name_en ? 'name_en-error' : undefined}
              />
              {fieldErrors.name_en && (
                <p id="name_en-error" className="text-sm text-red-600 mt-1">
                  {fieldErrors.name_en}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description_en">Description (English) *</Label>
              <Textarea
                id="description_en"
                name="description_en"
                placeholder="Amsterdam is the capital and most populous city of the Netherlands..."
                required
                rows={4}
                disabled={isSubmitting}
                aria-invalid={!!fieldErrors.description_en}
                aria-describedby={fieldErrors.description_en ? 'description_en-error' : undefined}
              />
              {fieldErrors.description_en && (
                <p id="description_en-error" className="text-sm text-red-600 mt-1">
                  {fieldErrors.description_en}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dutch Translations */}
        <Card>
          <CardHeader>
            <CardTitle>Dutch Translations</CardTitle>
            <CardDescription>
              Dutch name and description for the city
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name_nl">City Name (Dutch) *</Label>
              <Input
                id="name_nl"
                name="name_nl"
                placeholder="Amsterdam"
                required
                disabled={isSubmitting}
                aria-invalid={!!fieldErrors.name_nl}
                aria-describedby={fieldErrors.name_nl ? 'name_nl-error' : undefined}
              />
              {fieldErrors.name_nl && (
                <p id="name_nl-error" className="text-sm text-red-600 mt-1">
                  {fieldErrors.name_nl}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description_nl">Description (Dutch) *</Label>
              <Textarea
                id="description_nl"
                name="description_nl"
                placeholder="Amsterdam is de hoofdstad en grootste stad van Nederland..."
                required
                rows={4}
                disabled={isSubmitting}
                aria-invalid={!!fieldErrors.description_nl}
                aria-describedby={fieldErrors.description_nl ? 'description_nl-error' : undefined}
              />
              {fieldErrors.description_nl && (
                <p id="description_nl-error" className="text-sm text-red-600 mt-1">
                  {fieldErrors.description_nl}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* French Translations */}
        <Card>
          <CardHeader>
            <CardTitle>French Translations</CardTitle>
            <CardDescription>
              French name and description for the city
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name_fr">City Name (French) *</Label>
              <Input
                id="name_fr"
                name="name_fr"
                placeholder="Amsterdam"
                required
                disabled={isSubmitting}
                aria-invalid={!!fieldErrors.name_fr}
                aria-describedby={fieldErrors.name_fr ? 'name_fr-error' : undefined}
              />
              {fieldErrors.name_fr && (
                <p id="name_fr-error" className="text-sm text-red-600 mt-1">
                  {fieldErrors.name_fr}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description_fr">Description (French) *</Label>
              <Textarea
                id="description_fr"
                name="description_fr"
                placeholder="Amsterdam est la capitale et la ville la plus peuplée des Pays-Bas..."
                required
                rows={4}
                disabled={isSubmitting}
                aria-invalid={!!fieldErrors.description_fr}
                aria-describedby={fieldErrors.description_fr ? 'description_fr-error' : undefined}
              />
              {fieldErrors.description_fr && (
                <p id="description_fr-error" className="text-sm text-red-600 mt-1">
                  {fieldErrors.description_fr}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit button */}
      <div className="mt-6 flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating City...
            </>
          ) : (
            'Create City'
          )}
        </Button>
      </div>
    </form>
  )
}
