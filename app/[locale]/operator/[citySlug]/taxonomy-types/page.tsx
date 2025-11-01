/**
 * Taxonomy Types List Page
 * ========================
 * Displays all taxonomy types for a city with CRUD operations.
 *
 * @async
 * @param props - Component props
 * @param props.params - Route parameters
 * @param props.params.locale - Current locale code
 * @param props.params.citySlug - City identifier
 * @returns Page component JSX
 */

import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTaxonomyTypes } from '@/app/actions/taxonomy-types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Tag } from 'lucide-react'
import { getDatabaseClient } from '@/lib/database/client'

interface TaxonomyType {
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

interface Props {
  params: {
    locale: string
    citySlug: string
  }
}

export default async function TaxonomyTypesPage({ params }: Props) {
  const { locale, citySlug } = params
  const currentLocale = await getLocale()

  if (locale !== currentLocale) {
    redirect(`/${currentLocale}/operator/${citySlug}/taxonomy-types`)
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
          <h1 className="text-3xl font-bold">Taxonomy Types</h1>
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

  // Get taxonomy types
  const taxonomyTypes = await getTaxonomyTypes(citySlug)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Taxonomy Types</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage classification types for {city.translations[0]?.name || city.name}
          </p>
        </div>
        <Link href={`/${locale}/operator/${citySlug}/taxonomy-types/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Taxonomy Type
          </Button>
        </Link>
      </div>

      {/* Taxonomy types list */}
      {taxonomyTypes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Taxonomy Types Yet</CardTitle>
            <CardDescription>
              Get started by creating your first taxonomy type for this city. Taxonomy types
              define classification systems like &quot;Size&quot; or &quot;Status&quot; that can be applied to
              languages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/operator/${citySlug}/taxonomy-types/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Taxonomy Type
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {taxonomyTypes.map((taxonomyType: TaxonomyType) => {
            const currentTranslation =
              taxonomyType.translations.find((t) => t.locale_code === locale) ||
              taxonomyType.translations.find((t) => t.locale_code === 'en')

            return (
              <Card key={taxonomyType.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-gray-600" />
                        {currentTranslation?.name || 'Unnamed Taxonomy Type'}
                      </CardTitle>
                      {currentTranslation?.description && (
                        <CardDescription>{currentTranslation.description}</CardDescription>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 flex-wrap">
                        <span>Slug: {taxonomyType.slug}</span>
                        <span>•</span>
                        <span>
                          Translations:{' '}
                          {taxonomyType.translations.map((t) => t.locale_code).join(', ')}
                        </span>
                        {taxonomyType.is_required && (
                          <>
                            <span>•</span>
                            <span className="text-orange-600 font-medium">Required</span>
                          </>
                        )}
                        {taxonomyType.allow_multiple && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600 font-medium">Multiple Values</span>
                          </>
                        )}
                        {taxonomyType.use_for_map_styling && (
                          <>
                            <span>•</span>
                            <span className="text-green-600 font-medium">Map Styling</span>
                          </>
                        )}
                        {taxonomyType.use_for_filtering && (
                          <>
                            <span>•</span>
                            <span className="text-purple-600 font-medium">Filtering</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/${locale}/operator/${citySlug}/taxonomy-types/${taxonomyType.id}`}>
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
          <CardTitle>About Taxonomy Types</CardTitle>
          <CardDescription>
            Taxonomy types define classification systems for languages. Each city can create
            its own custom taxonomy types instead of using hardcoded classifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Example Taxonomy Types</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Size (Small/Medium/Large) - for community size</li>
                <li>• Status (Endangered/Stable) - for endangerment status</li>
                <li>• Script Type (Logographic/Syllabic/Alphabetic) - for writing systems</li>
                <li>• Official Status (Official/Recognized/Minority) - for official recognition</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Configuration Options</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>
                  • <strong>Required:</strong> Languages must have this taxonomy assigned
                </li>
                <li>
                  • <strong>Multiple Values:</strong> Languages can have multiple values from this
                  taxonomy
                </li>
                <li>
                  • <strong>Map Styling:</strong> Use this taxonomy to style language points on the
                  map
                </li>
                <li>
                  • <strong>Filtering:</strong> Show this taxonomy in the public map filter
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
