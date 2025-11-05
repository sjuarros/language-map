/**
 * Taxonomy Values List Page
 * =========================
 * Displays all taxonomy values for a taxonomy type with CRUD operations.
 *
 * @async
 * @param props - Component props
 * @param props.params - Route parameters
 * @param props.params.locale - Current locale code
 * @param props.params.citySlug - City identifier
 * @param props.params.taxonomyTypeId - Taxonomy type UUID
 * @returns Page component JSX
 */

import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, ArrowLeft, Edit } from 'lucide-react'
import { getTaxonomyValues, getTaxonomyTypeForValues } from '@/app/actions/taxonomy-values'

interface Props {
  params: {
    locale: string
    citySlug: string
    taxonomyTypeId: string
  }
}

export default async function TaxonomyValuesPage({ params }: Props) {
  const { citySlug, taxonomyTypeId } = await params
  const currentLocale = await getLocale()

  // Fetch data on the server
  const [taxonomyType, taxonomyValues] = await Promise.all([
    getTaxonomyTypeForValues(citySlug, taxonomyTypeId),
    getTaxonomyValues(citySlug, taxonomyTypeId),
  ])

  if (!taxonomyType) {
    notFound()
  }

  // Get taxonomy type name for current locale
  const taxonomyTypeName = taxonomyType.translations.find(
    (translation) => translation.locale_code === currentLocale
  )?.name || taxonomyType.translations.find((translation) => translation.locale_code === 'en')?.name || taxonomyType.slug

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link href={`/${currentLocale}/operator/${citySlug}/taxonomy-types`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Taxonomy Types
          </Button>
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {taxonomyTypeName} Values
            </h1>
            <p className="text-muted-foreground">
              Manage values for this taxonomy type
            </p>
          </div>

          <Link href={`/${currentLocale}/operator/${citySlug}/taxonomy-types/${taxonomyTypeId}/values/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Value
            </Button>
          </Link>
        </div>
      </div>

      {taxonomyValues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No values yet</p>
            <Link href={`/${currentLocale}/operator/${citySlug}/taxonomy-types/${taxonomyTypeId}/values/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create First Value
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {taxonomyValues.map((value) => {
            // Get translation for current locale
            const translation = value.translations.find(
              (t) => t.locale_code === currentLocale
            ) || value.translations.find((t) => t.locale_code === 'en')

            return (
              <Card key={value.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: value.color_hex }}
                        />
                        <CardTitle className="text-lg">
                          {translation?.name || value.slug}
                        </CardTitle>
                        {translation?.is_ai_translated && (
                          <Badge variant="secondary">
                            AI Generated
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="space-y-1">
                        <div>Slug: <code className="bg-muted px-1 py-0.5 rounded text-sm">{value.slug}</code></div>
                        {value.icon_name && (
                          <div>
                            Icon: {value.icon_name} ({(value.icon_size_multiplier * 100).toFixed(0)}%)
                          </div>
                        )}
                        <div>Order: {value.sort_order}</div>
                        {translation?.description && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">
                              {translation.description}
                            </p>
                          </div>
                        )}
                      </CardDescription>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/${currentLocale}/operator/${citySlug}/taxonomy-types/${taxonomyTypeId}/values/${value.id}/edit`}
                      >
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
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
    </div>
  )
}
