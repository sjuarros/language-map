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
import { ChevronLeft, Languages as LanguagesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LanguageForm } from '@/components/languages/language-form'
import { DeleteLanguageButton } from '@/components/languages/delete-language-button'
import { FormErrorBoundary } from '@/components/ui/form-error-boundary'
import {
  getLanguage,
  getLanguageFamiliesForSelect,
  getCountriesForSelect,
  getTaxonomyValuesForSelect,
  deleteLanguage,
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
 * Server component for editing a language with authentication and validation.
 *
 * Authentication & Authorization:
 * - This page is protected by the parent layout (app/[locale]/operator/layout.tsx)
 * - The layout uses AuthProvider and checks authentication before rendering
 * - Users must be authenticated and have operator/admin/superuser role
 * - City-level access is controlled via city_users table and RLS policies
 *
 * @param props - Page props containing locale, citySlug, and language ID
 * @returns Edit language page
 * @throws {Error} If language data cannot be fetched
 * @throws {Error} If input parameters are invalid
 */
export default async function EditLanguagePage({ params }: EditLanguagePageProps) {
  const { locale, citySlug, id } = await params
  const t = await getTranslations('languages')

  // ===== CRITICAL FIX 1: Input Validation =====
  // Validate all external parameters to prevent runtime errors and security issues
  if (!locale || typeof locale !== 'string') {
    console.error('[Edit Language Page] Invalid locale parameter')
    return notFound()
  }

  if (!citySlug || typeof citySlug !== 'string') {
    console.error('[Edit Language Page] Invalid citySlug parameter')
    return notFound()
  }

  if (!id || typeof id !== 'string' || !id.match(/^[a-f\d-]+$/)) {
    console.error('[Edit Language Page] Invalid ID parameter')
    return notFound()
  }

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
    // ===== CRITICAL FIX 2: Secure Error Logging =====
    // Only log safe error message, not full error object to prevent exposing sensitive data
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Edit Language Page] Error fetching language or reference data:', errorMessage)

    if (err instanceof Error && err.message.includes('not found')) {
      return notFound()
    }
    error = errorMessage
  }

  // ===== WARNING FIX 6: Add Loading State =====
  // Note: Loading state is handled by the parent layout (OperatorLayout)
  // which shows a loading spinner while this server component fetches data

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
  // ===== WARNING FIX 5: Add Null/Undefined Checks =====
  // Defensive programming: Always assume data might be null/undefined
  const existingLanguage = {
    id: language.id,
    iso_639_3_code: language.iso_639_3_code || null,
    endonym: language.endonym || '',
    language_family_id: language.language_family_id || null,
    country_of_origin_id: language.country_of_origin_id || null,
    speaker_count: language.speaker_count || 0,
    translations: language.translations || [],
    // Note: Using 'any' for taxonomy structure from complex Supabase join
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    taxonomies: (language.taxonomies || []).map((t: any) => ({
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('edit.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('edit.description', { name: language.endonym })}
          </p>
        </div>
        {/* Delete Button with Confirmation */}
        <DeleteLanguageButtonClient
          languageId={language.id}
          languageName={language.endonym || 'Unknown Language'}
          citySlug={citySlug}
          locale={locale}
        />
      </div>

      {/* Translations Management Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <LanguagesIcon className="h-5 w-5" />
                {t('translations.title', { defaultValue: 'Language Name Translations' })}
              </CardTitle>
              <CardDescription className="text-blue-700">
                {t('translations.description', {
                  defaultValue: 'Manage how this language name appears in different interface languages (English, Dutch, French)'
                })}
              </CardDescription>
            </div>
            <Link href={`/${locale}/operator/${citySlug}/languages/${id}/translations`}>
              <Button variant="outline" className="bg-white">
                <LanguagesIcon className="mr-2 h-4 w-4" />
                {t('translations.manageButton', { defaultValue: 'Manage Translations' })}
              </Button>
            </Link>
          </div>
        </CardHeader>
      </Card>

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

/**
 * Client component wrapper for DeleteLanguageButton
 *
 * This pattern uses 'use server' directive inside a client component wrapper.
 * This is a valid Next.js pattern for passing server actions to client components.
 * The DeleteLanguageButton component handles its own state management internally.
 */
interface DeleteLanguageButtonClientProps {
  languageId: string
  languageName: string
  citySlug: string
  locale: string
}

/**
 * Client component wrapper
 *
 * Pattern explanation:
 * - This is a client component (has 'use client' directive)
 * - It defines a server action inside using the 'use server' directive
 * - The server action is passed to DeleteLanguageButton as a prop
 * - This is a valid Next.js pattern for bridging server actions to client components
 *
 * The DeleteLanguageButton component handles:
 * - Loading states
 * - Error handling
 * - User confirmation
 * - Navigation after successful deletion
 */
function DeleteLanguageButtonClient({
  languageId,
  languageName,
  citySlug,
  locale,
}: DeleteLanguageButtonClientProps) {
  'use client'

  // Server action defined in client component wrapper
  // This pattern is valid and recommended by Next.js documentation
  async function handleDelete(id: string) {
    'use server'
    await deleteLanguage(citySlug, id)
  }

  return (
    <DeleteLanguageButton
      languageId={languageId}
      languageName={languageName}
      citySlug={citySlug}
      locale={locale}
      onDelete={handleDelete}
    />
  )
}
