/**
 * Language Families List Page
 * ===========================
 * Displays all language families in the system.
 *
 * Note: Language families are global entities, not city-specific.
 * However, they are managed through the operator panel for organizational purposes.
 *
 * @module app/[locale]/operator/[citySlug]/language-families/page
 */

import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getLanguageFamilies } from '@/app/actions/language-families'

interface LanguageFamiliesPageProps {
  params: Promise<{
    locale: string
    citySlug: string
  }>
}

/**
 * Language Families List Page Component
 *
 * @param props - Page props containing locale and citySlug
 * @returns Language families list page
 */
export default async function LanguageFamiliesPage({
  params,
}: LanguageFamiliesPageProps) {
  const { locale, citySlug } = await params
  const t = await getTranslations('operator.languageFamilies.list')
  const tCommon = await getTranslations('common')

  // Fetch all language families
  let families: Awaited<ReturnType<typeof getLanguageFamilies>> = []
  let error: string | null = null

  try {
    families = await getLanguageFamilies(citySlug)
  } catch (err) {
    console.error('Error fetching language families:', err)
    error = err instanceof Error ? err.message : 'Unknown error'
  }

  // Find translations for current locale
  const getFamilyName = (family: typeof families[0]) => {
    const translation = family.translations.find((t) => t.locale_code === locale)
    return translation?.name || family.translations[0]?.name || family.slug
  }

  const getFamilyDescription = (family: typeof families[0]) => {
    const translation = family.translations.find((t) => t.locale_code === locale)
    return translation?.description
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-gray-500 mt-1">{t('description')}</p>
        </div>
        <Link href={`/${locale}/operator/${citySlug}/language-families/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('createButton')}
          </Button>
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">{tCommon('error')}</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Language Families List */}
      {!error && families.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 text-center mb-4">{t('empty')}</p>
            <Link href={`/${locale}/operator/${citySlug}/language-families/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('createFirst')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!error && families.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {families.map((family) => (
            <Link
              key={family.id}
              href={`/${locale}/operator/${citySlug}/language-families/${family.id}`}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {getFamilyName(family)}
                    <span className="text-xs text-gray-500 font-mono font-normal">
                      {family.slug}
                    </span>
                  </CardTitle>
                  {getFamilyDescription(family) && (
                    <CardDescription className="line-clamp-2">
                      {getFamilyDescription(family)}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 text-xs text-gray-500">
                    <span>
                      {family.translations.length} {t('translations')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Help Text */}
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
