/**
 * Taxonomy Values List Page
 * =========================
 * Displays all taxonomy values for a taxonomy type with CRUD operations.
 *
 * @component
 */

'use client'

import { notFound } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, ArrowLeft, Edit } from 'lucide-react'
import { getTaxonomyValues, getTaxonomyTypeForValues } from '@/app/actions/taxonomy-values'
import type { TaxonomyType, TaxonomyValue } from '@/types/taxonomy'

export default function TaxonomyValuesPage({
  params
}: {
  params: {
    locale: string
    citySlug: string
    taxonomyTypeId: string
  }
}) {
  const t = useTranslations('TaxonomyValues')
  const [taxonomyType, setTaxonomyType] = useState<TaxonomyType | null>(null)
  const [taxonomyValues, setTaxonomyValues] = useState<TaxonomyValue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [typeData, valuesData] = await Promise.all([
          getTaxonomyTypeForValues(params.citySlug, params.taxonomyTypeId),
          getTaxonomyValues(params.citySlug, params.taxonomyTypeId),
        ])
        setTaxonomyType(typeData)
        setTaxonomyValues(valuesData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [params.citySlug, params.taxonomyTypeId])

  if (!taxonomyType) {
    notFound()
  }

  // Get taxonomy type name for current locale
  const taxonomyTypeName = taxonomyType.translations.find(
    (translation) => translation.locale_code === params.locale
  )?.name || taxonomyType.translations.find((translation) => translation.locale_code === 'en')?.name || taxonomyType.slug

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link href={`/${params.locale}/operator/${params.citySlug}/taxonomy-types`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Taxonomy Types
          </Button>
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {t('list.title', { typeName: taxonomyTypeName })}
            </h1>
            <p className="text-muted-foreground">
              {t('list.description')}
            </p>
          </div>

          <Link href={`/${params.locale}/operator/${params.citySlug}/taxonomy-types/${params.taxonomyTypeId}/values/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('list.actions.create')}
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : taxonomyValues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">{t('list.empty')}</p>
            <Link href={`/${params.locale}/operator/${params.citySlug}/taxonomy-types/${params.taxonomyTypeId}/values/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('list.actions.createFirst')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {taxonomyValues.map((value) => {
            // Get translation for current locale
            const translation = value.translations.find(
              (t) => t.locale_code === params.locale
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
                            {t('badges.aiGenerated')}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="space-y-1">
                        <div>Slug: <code className="bg-muted px-1 py-0.5 rounded text-sm">{value.slug}</code></div>
                        {value.icon_name && (
                          <div>
                            {t('list.details.icon')}: {value.icon_name} ({(value.icon_size_multiplier * 100).toFixed(0)}%)
                          </div>
                        )}
                        <div>{t('list.details.order')}: {value.display_order}</div>
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
                        href={`/${params.locale}/operator/${params.citySlug}/taxonomy-types/${params.taxonomyTypeId}/values/${value.id}/edit`}
                      >
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          {t('list.actions.edit')}
                        </Button>
                      </Link>
                      {/* TODO: Add delete confirmation */}
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
