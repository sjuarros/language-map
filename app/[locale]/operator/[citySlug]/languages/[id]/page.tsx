/**
 * Edit Language Page
 * ==================
 * Page for editing an existing language with translations and taxonomy assignments.
 *
 * @module app/[locale]/operator/[citySlug]/languages/[id]/page
 */

import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageForm } from '@/components/languages/language-form'
import { FormErrorBoundary } from '@/components/ui/form-error-boundary'
import {
  getLanguage,
  getLanguageFamiliesForSelect,
  getCountriesForSelect,
  getTaxonomyValuesForSelect,
} from '@/app/actions/languages'

/**
 * Page props
 */
interface EditLanguagePageProps {
  params: Promise<{
    locale: string
    citySlug: string
    id: string
  }>
}

/**
 * Edit Language Page Component
 *
 * @param props - Page props containing locale, citySlug, and language ID
 * @returns Edit language page
 */
export default async function EditLanguagePage({ params }: EditLanguagePageProps) {
  const { locale, citySlug, id } = await params
  const t = await getTranslations('languages')

  // Fetch language and reference data
  let language: Awaited<ReturnType<typeof getLanguage>> | null = null
  let languageFamilies: Awaited<ReturnType<typeof getLanguageFamiliesForSelect>> = []
  let countries: Awaited<ReturnType<typeof getCountriesForSelect>> = []
  let taxonomyTypes: Awaited<ReturnType<typeof getTaxonomyValuesForSelect>> = []
  let error: string | null = null

  try {
    ;[language, languageFamilies, countries, taxonomyTypes] = await Promise.all([
      getLanguage(citySlug, id),
      getLanguageFamiliesForSelect(citySlug, locale),
      getCountriesForSelect(citySlug, locale),
      getTaxonomyValuesForSelect(citySlug, locale),
    ])
  } catch (err) {
    console.error('Error fetching language or reference data:', err)
    if (err instanceof Error && err.message.includes('not found')) {
      return notFound()
    }
    error = err instanceof Error ? err.message : 'Failed to load language data'
  }

  if (error || !language) {
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
          <p className="text-muted-foreground">{error || t('error.notFound')}</p>
        </div>
      </div>
    )
  }

  // Transform language data for form
  const existingLanguage = {
    id: language.id,
    iso_639_3_code: language.iso_639_3_code,
    endonym: language.endonym,
    language_family_id: language.language_family_id,
    country_of_origin_id: language.country_of_origin_id,
    speaker_count: language.speaker_count,
    translations: language.translations,
    taxonomies: language.taxonomies.map(t => ({
      taxonomy_value_id: t.taxonomy_value_id,
    })),
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
        <h1 className="text-3xl font-bold tracking-tight">{t('edit.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('edit.description', { name: language.endonym })}
        </p>
      </div>

      {/* Language Form */}
      <FormErrorBoundary>
        <LanguageForm
          citySlug={citySlug}
          locale={locale}
          languageFamilies={languageFamilies}
          countries={countries}
          taxonomyTypes={taxonomyTypes}
          language={existingLanguage}
          mode="edit"
        />
      </FormErrorBoundary>
    </div>
  )
}
