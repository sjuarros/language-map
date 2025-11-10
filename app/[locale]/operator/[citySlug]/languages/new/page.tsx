/**
 * Create Language Page
 * ====================
 * Page for creating a new language with translations and taxonomy assignments.
 *
 * @module app/[locale]/operator/[citySlug]/languages/new/page
 */

import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageForm } from '@/components/languages/language-form'
import { FormErrorBoundary } from '@/components/ui/form-error-boundary'
import {
  getLanguageFamiliesForSelect,
  getCountriesForSelect,
  getTaxonomyValuesForSelect,
} from '@/app/actions/languages'

/**
 * Page props
 */
interface NewLanguagePageProps {
  params: Promise<{
    locale: string
    citySlug: string
  }>
}

/**
 * Create Language Page Component
 *
 * @param props - Page props containing locale and citySlug
 * @returns Create language page
 */
export default async function NewLanguagePage({ params }: NewLanguagePageProps) {
  const { locale, citySlug } = await params
  const t = await getTranslations('languages')

  // Fetch reference data for dropdowns
  let languageFamilies: Awaited<ReturnType<typeof getLanguageFamiliesForSelect>> = []
  let countries: Awaited<ReturnType<typeof getCountriesForSelect>> = []
  let taxonomyTypes: Awaited<ReturnType<typeof getTaxonomyValuesForSelect>> = []
  let error: string | null = null

  try {
    [languageFamilies, countries, taxonomyTypes] = await Promise.all([
      getLanguageFamiliesForSelect(citySlug, locale),
      getCountriesForSelect(citySlug, locale),
      getTaxonomyValuesForSelect(citySlug, locale),
    ])
  } catch (err) {
    console.error('Error fetching reference data:', err)
    error = err instanceof Error ? err.message : 'Failed to load form data'
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <Link href={`/${locale}/operator/${citySlug}/languages`}>
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t('actions.back')}
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-destructive mb-4">{t('error.title')}</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Back Button */}
      <div>
        <Link href={`/${locale}/operator/${citySlug}/languages`}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t('actions.back')}
          </Button>
        </Link>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('create.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('create.description')}</p>
      </div>

      {/* Language Form */}
      <FormErrorBoundary>
        <LanguageForm
          citySlug={citySlug}
          locale={locale}
          languageFamilies={languageFamilies}
          countries={countries}
          taxonomyTypes={taxonomyTypes}
          mode="create"
        />
      </FormErrorBoundary>
    </div>
  )
}
