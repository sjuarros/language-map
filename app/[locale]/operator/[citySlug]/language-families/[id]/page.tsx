/**
 * Edit Language Family Page
 * ==========================
 * Page for editing an existing language family with translations.
 *
 * @module app/[locale]/operator/[citySlug]/language-families/[id]/page
 */

import { getTranslations } from 'next-intl/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import LanguageFamilyForm from '@/components/language-families/language-family-form'
import { DeleteFamilyButton } from '@/components/language-families/delete-family-button'
import {
  getLanguageFamily,
  updateLanguageFamily,
  deleteLanguageFamily,
  type LanguageFamilyInput,
} from '@/app/actions/language-families'

interface EditLanguageFamilyPageProps {
  params: Promise<{
    locale: string
    citySlug: string
    id: string
  }>
}

/**
 * Edit Language Family Page Component
 *
 * @param props - Page props containing locale, citySlug, and language family ID
 * @returns Edit language family page
 */
export default async function EditLanguageFamilyPage({
  params,
}: EditLanguageFamilyPageProps) {
  const { locale, citySlug, id } = await params
  const t = await getTranslations('operator.languageFamilies.edit')

  // Fetch the language family
  let family: Awaited<ReturnType<typeof getLanguageFamily>> | null = null

  try {
    family = await getLanguageFamily(citySlug, id)
  } catch (error) {
    console.error('Error fetching language family:', error)
    notFound()
  }

  if (!family) {
    notFound()
  }

  /**
   * Handle form submission for updating the language family
   *
   * @param data - Form data
   */
  async function handleSubmit(data: LanguageFamilyInput) {
    'use server'

    try {
      await updateLanguageFamily(citySlug, id, data)
      redirect(`/${locale}/operator/${citySlug}/language-families`)
    } catch (error) {
      // Error will be handled by the form component
      throw error
    }
  }

  /**
   * Server action wrapper for language family deletion
   * This wraps the deleteLanguageFamily action for use with the client component
   *
   * @async
   * @param familyId - The language family UUID to delete
   * @throws Will throw error if deletion fails
   */
  async function handleDelete(familyId: string) {
    'use server'

    try {
      // Validate family ID matches the page ID for security
      if (familyId !== id) {
        throw new Error('Invalid family ID')
      }

      await deleteLanguageFamily(citySlug, familyId)
    } catch (error) {
      // Re-throw to let client component handle display
      throw error
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/operator/${citySlug}/language-families`}>
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('back')}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-gray-500 mt-1">
              {family.translations.find((t) => t.locale_code === locale)?.name ||
                family.translations[0]?.name ||
                family.slug}
            </p>
          </div>
        </div>

        {/* Delete Button with Confirmation */}
        <DeleteFamilyButton
          familyId={id}
          familyName={
            family.translations.find((t) => t.locale_code === locale)?.name ||
            family.translations[0]?.name ||
            family.slug
          }
          citySlug={citySlug}
          locale={locale}
          onDelete={handleDelete}
        />
      </div>

      {/* Form */}
      <LanguageFamilyForm
        initialData={family}
        onSubmit={handleSubmit}
        submitLabel={t('updateButton')}
      />

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">{t('dangerZone.title')}</CardTitle>
          <CardDescription className="text-red-700">
            {t('dangerZone.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteFamilyButton
            familyId={id}
            familyName={
              family.translations.find((t) => t.locale_code === locale)?.name ||
              family.translations[0]?.name ||
              family.slug
            }
            citySlug={citySlug}
            locale={locale}
            onDelete={handleDelete}
            size="default"
          />
        </CardContent>
      </Card>
    </div>
  )
}
