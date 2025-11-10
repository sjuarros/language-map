/**
 * Languages List Page
 * ===================
 * Displays all languages for a city with translations and taxonomy assignments.
 *
 * @module app/[locale]/operator/[citySlug]/languages/page
 */

import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Plus, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { getLanguages } from '@/app/actions/languages'

/**
 * Language structure returned by getLanguages server action
 *
 * This type represents the processed language data after Supabase joins
 * and post-processing in the getLanguages function.
 */
type Language = {
  id: string
  endonym: string | null
  iso_639_3_code: string | null
  speaker_count: number | null
  created_at: string
  updated_at: string
  translations: Array<{
    id: string
    locale_code: string
    name: string
    is_ai_translated: boolean
  }>
  language_family: {
    id: string
    slug: string
    translations: Array<{
      locale_code: string
      name: string
    }>
  } | null
  country_of_origin: {
    id: string
    iso_code_2: string
    iso_code_3: string
    translations: Array<{
      locale_code: string
      name: string
    }>
  } | null
  taxonomies: Array<{
    id: string
    taxonomy_value_id: string
    taxonomy_value: {
      id: string
      slug: string
      color_hex: string | null
      icon_name: string | null
      translations: Array<{
        locale_code: string
        name: string
      }>
    }
  }>
}

/**
 * Props interface for the Languages Page component
 *
 * @param params - Route parameters containing locale and citySlug
 * @param params.locale - The locale code (e.g., 'en', 'nl', 'fr')
 * @param params.citySlug - The city identifier slug (e.g., 'amsterdam', 'paris')
 */
interface LanguagesPageProps {
  params: Promise<{
    locale: string
    citySlug: string
  }>
}

/**
 * Languages List Page Component
 *
 * Server component that displays all languages for a city with support for:
 * - Multi-language translations
 * - Taxonomy assignments
 * - Language family and country relationships
 * - CRUD operations (create, edit, delete)
 *
 * Authentication & Authorization:
 * - This page is protected by the parent layout (app/[locale]/operator/layout.tsx)
 * - The layout uses AuthProvider and checks authentication before rendering
 * - Users must be authenticated and have operator/admin/superuser role
 * - City-level access is controlled via city_users table and RLS policies
 *
 * @param props - Page props containing locale and citySlug
 * @returns Languages list page
 * @throws {Error} If input parameters are invalid
 */
export default async function LanguagesPage({ params }: LanguagesPageProps) {
  // CRITICAL FIX 1: Input Validation
  // Validate all external parameters to prevent runtime errors and security issues
  const { locale: rawLocale, citySlug: rawCitySlug } = await params

  if (!rawLocale || typeof rawLocale !== 'string') {
    console.error('[Languages Page] Invalid locale parameter')
    return notFound()
  }

  if (!rawCitySlug || typeof rawCitySlug !== 'string') {
    console.error('[Languages Page] Invalid citySlug parameter')
    return notFound()
  }

  if (!rawCitySlug.match(/^[a-z0-9-]+$/)) {
    console.error('[Languages Page] Invalid citySlug format:', String(rawCitySlug))
    return notFound()
  }

  const locale = rawLocale
  const citySlug = rawCitySlug

  const t = await getTranslations('languages')
  const tCommon = await getTranslations('common')

  // CRITICAL FIX 2: Type Safety - Explicit type definition
  // Fetch all languages for this city
  let languages: Language[] = []
  let error: string | null = null

  try {
    languages = await getLanguages(citySlug, locale)
  } catch (err) {
    console.error('Error fetching languages:', err)
    error = err instanceof Error ? err.message : 'Unknown error'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <Link href={`/${locale}/operator/${citySlug}/languages/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('actions.create')}
          </Button>
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">{tCommon('error')}</CardTitle>
            <CardDescription className="text-destructive/80">{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Languages List */}
      {!error && languages.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center mb-4">{t('list.empty')}</p>
            <Link href={`/${locale}/operator/${citySlug}/languages/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('actions.createFirst')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!error && languages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('list.title')}</CardTitle>
            <CardDescription>
              {t('list.count', { count: languages.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('list.columns.endonym')}</TableHead>
                  <TableHead>{t('list.columns.name')}</TableHead>
                  <TableHead>{t('list.columns.family')}</TableHead>
                  <TableHead>{t('list.columns.taxonomies')}</TableHead>
                  <TableHead className="text-right">{t('list.columns.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {languages.map(language => {
                  const translation = language.translations[0]
                  // Handle language_family as potential array or object
                  const languageFamily = Array.isArray(language.language_family)
                    ? language.language_family[0]
                    : language.language_family
                  const familyTranslation = Array.isArray(languageFamily?.translations)
                    ? languageFamily?.translations[0]
                    : languageFamily?.translations

                  return (
                    <TableRow key={language.id}>
                      <TableCell className="font-medium">
                        {language.endonym || '-'}
                        {language.iso_639_3_code && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            [{language.iso_639_3_code}]
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{translation?.name || '-'}</TableCell>
                      <TableCell>
                        {familyTranslation?.name || languageFamily?.slug || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {language.taxonomies && language.taxonomies.length > 0 ? (
                            // Note: Taxonomy structure from Supabase joins is dynamic.
                            // Each taxonomy contains a taxonomy_value which may be a single object or array.
                            // We handle this dynamically with Array.isArray() checks.
                            // Using 'any' is necessary due to the complex join structure from the server action.
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            language.taxonomies.map((taxonomy: any) => {
                              const taxonomyValue = Array.isArray(taxonomy.taxonomy_value)
                                ? taxonomy.taxonomy_value[0]
                                : taxonomy.taxonomy_value
                              const valueTranslation = Array.isArray(taxonomyValue?.translations)
                                ? taxonomyValue?.translations[0]
                                : taxonomyValue?.translations

                              return (
                                <Badge
                                  key={taxonomyValue?.id || Math.random()}
                                  variant="outline"
                                  style={{
                                    borderColor: taxonomyValue?.color_hex || '#cccccc',
                                    backgroundColor: `${taxonomyValue?.color_hex || '#cccccc'}15`,
                                  }}
                                >
                                  {valueTranslation?.name || taxonomyValue?.slug || '-'}
                                </Badge>
                              )
                            })
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/${locale}/operator/${citySlug}/languages/${language.id}`}
                          >
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">{t('help.title')}</CardTitle>
          <CardDescription className="text-blue-700">
            {t('help.description')}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
