/**
 * District List Page
 * ==================
 * Displays all districts for a city with CRUD operations.
 */

import { getDatabaseClient } from '@/lib/database/client'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getDistricts } from '@/app/actions/districts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, MapPin } from 'lucide-react'

interface District {
  id: string
  slug: string
  is_active: boolean
  translations: Array<{
    locale: string
    name: string
    description: string | null
  }>
}

interface Props {
  params: {
    locale: string
    citySlug: string
  }
}

export default async function DistrictsPage({ params }: Props) {
  const { locale, citySlug } = params
  const currentLocale = await getLocale()

  if (locale !== currentLocale) {
    redirect(`/${currentLocale}/operator/${citySlug}/districts`)
  }

  const supabase = getDatabaseClient(citySlug)

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  // Get city info
  const { data: city } = await supabase
    .from('cities')
    .select('id, name, slug, translations!inner(name, locale)')
    .eq('slug', citySlug)
    .eq('translations.locale', locale)
    .single()

  if (!city) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Districts</h1>
          <p className="mt-2 text-sm text-gray-600">City not found</p>
        </div>
      </div>
    )
  }

  // Check if user has access to this city
  const { data: cityAccess } = await supabase
    .from('city_users')
    .select('city_id, role')
    .eq('user_id', user.id)
    .eq('city_id', city.id)
    .single()

  if (!cityAccess) {
    redirect(`/${locale}/operator`)
  }

  // Get districts
  const districts = await getDistricts(citySlug)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Districts</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage districts for {city.translations[0]?.name || city.name}
          </p>
        </div>
        <Link href={`/${locale}/operator/${citySlug}/districts/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add District
          </Button>
        </Link>
      </div>

      {/* Districts list */}
      {districts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Districts Yet</CardTitle>
            <CardDescription>
              Get started by creating your first district for this city
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/operator/${citySlug}/districts/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create District
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {districts.map((district: District) => {
            const currentTranslation = district.translations.find((t) => t.locale === locale) ||
              district.translations.find((t) => t.locale === 'en')

            return (
              <Card key={district.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-gray-600" />
                        {currentTranslation?.name || 'Unnamed District'}
                        {!district.is_active && (
                          <span className="text-xs font-normal text-gray-500">(Inactive)</span>
                        )}
                      </CardTitle>
                      {currentTranslation?.description && (
                        <CardDescription>{currentTranslation.description}</CardDescription>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                        <span>Slug: {district.slug}</span>
                        <span>•</span>
                        <span>
                          Translations: {district.translations.map((t) => t.locale).join(', ')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/${locale}/operator/${citySlug}/districts/${district.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      )}

      {/* Info card */}
      <Card>
        <CardHeader>
          <CardTitle>About Districts</CardTitle>
          <CardDescription>
            Districts are the primary geographic divisions within a city. They help organize
            neighborhoods and provide a hierarchical structure for organizing language data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Districts vs Neighborhoods</h4>
              <p className="text-sm text-gray-600">
                Districts are larger geographic areas, while neighborhoods are smaller divisions
                within districts. This creates a clear hierarchy: City → District → Neighborhood.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Translations</h4>
              <p className="text-sm text-gray-600">
                District names and descriptions should be translated into all supported languages
                (English, Dutch, French) to ensure accessibility for all users.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
