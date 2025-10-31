/**
 * New City Creation Page
 *
 * Page for creating a new city with multilingual support.
 */

import { createCity } from '@/app/actions/cities'
import { createCityFormSchema } from '@/lib/validations/city'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default async function NewCityPage() {
  const locale = await getLocale()

  async function createCityAction(formData: FormData) {
    'use server'

    // Extract form data
    const data = {
      slug: formData.get('slug') as string,
      country: formData.get('country') as string,
      center_lat: parseFloat(formData.get('center_lat') as string),
      center_lng: parseFloat(formData.get('center_lng') as string),
      default_zoom: parseInt(formData.get('default_zoom') as string, 10),
      // English translations
      name_en: formData.get('name_en') as string,
      description_en: formData.get('description_en') as string,
      // Dutch translations
      name_nl: formData.get('name_nl') as string,
      description_nl: formData.get('description_nl') as string,
      // French translations
      name_fr: formData.get('name_fr') as string,
      description_fr: formData.get('description_fr') as string,
    }

    // Validate
    const validation = createCityFormSchema.safeParse(data)
    if (!validation.success) {
      throw new Error('Validation failed: ' + validation.error.message)
    }

    try {
      await createCity(validation.data)
      redirect(`/${locale}/superuser/cities`)
    } catch (error) {
      throw error
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href={`/${locale}/superuser/cities`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New City</h1>
          <p className="mt-2 text-sm text-gray-600">
            Add a new city to the platform with multilingual support
          </p>
        </div>
      </div>

      <form action={createCityAction}>
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
                  pattern="^[a-z0-9-]+$"
                  title="Lowercase letters, numbers, and hyphens only"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL-friendly identifier (lowercase letters, numbers, and hyphens)
                </p>
              </div>

              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  name="country"
                  placeholder="Netherlands"
                  required
                />
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
                />
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
                />
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
                />
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
                />
              </div>

              <div>
                <Label htmlFor="description_en">Description (English) *</Label>
                <Textarea
                  id="description_en"
                  name="description_en"
                  placeholder="Amsterdam is the capital and most populous city of the Netherlands..."
                  required
                  rows={4}
                />
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
                />
              </div>

              <div>
                <Label htmlFor="description_nl">Description (Dutch) *</Label>
                <Textarea
                  id="description_nl"
                  name="description_nl"
                  placeholder="Amsterdam is de hoofdstad en grootste stad van Nederland..."
                  required
                  rows={4}
                />
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
                />
              </div>

              <div>
                <Label htmlFor="description_fr">Description (French) *</Label>
                <Textarea
                  id="description_fr"
                  name="description_fr"
                  placeholder="Amsterdam est la capitale et la ville la plus peuplée des Pays-Bas..."
                  required
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit button */}
        <div className="mt-6 flex justify-end">
          <Button type="submit" size="lg">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Create City
          </Button>
        </div>
      </form>
    </div>
  )
}
