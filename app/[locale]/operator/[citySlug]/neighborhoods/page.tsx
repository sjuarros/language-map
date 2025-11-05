/**
 * Neighborhood List Page
 * ======================
 * Displays all neighborhoods for a city with CRUD operations.
 */

import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getNeighborhoods } from '@/app/actions/neighborhoods'
import { getServerSupabaseWithCookies } from '@/lib/supabase/server-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, MapPin, Home } from 'lucide-react'

interface Neighborhood {
  id: string
  slug: string
  district_id: string
  translations: Array<{
    locale_code: string
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

export default async function NeighborhoodsPage({ params }: Props) {
  const { locale, citySlug } = await params
  const currentLocale = await getLocale()

  if (locale !== currentLocale) {
    redirect(`/${currentLocale}/operator/${citySlug}/neighborhoods`)
  }

  const supabase = await getServerSupabaseWithCookies(citySlug)

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
    .select('id, slug')
    .eq('slug', citySlug)
    .single()

  if (!city) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Neighborhoods</h1>
          <p className="mt-2 text-sm text-gray-600">City not found</p>
        </div>
      </div>
    )
  }

  // Get city name translation
  const { data: cityTranslation } = await supabase
    .from('city_translations')
    .select('name')
    .eq('city_id', city.id)
    .eq('locale_code', locale)
    .single()

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

  // Get neighborhoods
  const neighborhoods = await getNeighborhoods(citySlug)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Neighborhoods</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage neighborhoods for {cityTranslation?.name || citySlug}
          </p>
        </div>
        <Link href={`/${locale}/operator/${citySlug}/neighborhoods/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Neighborhood
          </Button>
        </Link>
      </div>

      {/* Neighborhoods list */}
      {neighborhoods.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Neighborhoods Yet</CardTitle>
            <CardDescription>
              Get started by creating your first neighborhood for this city
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/operator/${citySlug}/neighborhoods/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Neighborhood
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {neighborhoods.map((neighborhood: Neighborhood) => {
            const currentTranslation = neighborhood.translations.find((t) => t.locale_code === locale) ||
              neighborhood.translations.find((t) => t.locale_code === 'en')

            return (
              <Card key={neighborhood.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Home className="h-5 w-5 text-gray-600" />
                        {currentTranslation?.name || 'Unnamed Neighborhood'}
                      </CardTitle>
                      {currentTranslation?.description && (
                        <CardDescription>{currentTranslation.description}</CardDescription>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          District: {neighborhood.district_id.substring(0, 8)}...
                        </span>
                        <span>•</span>
                        <span>Slug: {neighborhood.slug}</span>
                        <span>•</span>
                        <span>
                          Translations: {neighborhood.translations.map((t) => t.locale_code).join(', ')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/${locale}/operator/${citySlug}/neighborhoods/${neighborhood.id}`}>
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
          <CardTitle>About Neighborhoods</CardTitle>
          <CardDescription>
            Neighborhoods are smaller geographic divisions within districts. They provide a more
            granular level of geographic organization for language data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Geographic Hierarchy</h4>
              <p className="text-sm text-gray-600">
                The geographic hierarchy follows this structure: <strong>City → District → Neighborhood</strong>.
                This allows for precise organization of language points within specific areas.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Translations</h4>
              <p className="text-sm text-gray-600">
                Neighborhood names and descriptions should be translated into all supported languages
                (English, Dutch, French) to ensure accessibility for all users.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">District Assignment</h4>
              <p className="text-sm text-gray-600">
                Each neighborhood must be assigned to a district. This creates the geographic hierarchy
                and allows for better organization of data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
