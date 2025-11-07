/**
 * Create Language Family Page
 * ============================
 * Page for creating a new language family with translations.
 *
 * @module app/[locale]/operator/[citySlug]/language-families/new/page
 */

import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LanguageFamilyForm from '@/components/language-families/language-family-form'
import { createLanguageFamily, type LanguageFamilyInput } from '@/app/actions/language-families'

interface NewLanguageFamilyPageProps {
  params: Promise<{
    locale: string
    citySlug: string
  }>
}

/**
 * Create Language Family Page Component
 *
 * @param props - Page props containing locale and citySlug
 * @returns Create language family page
 */
export default async function NewLanguageFamilyPage({
  params,
}: NewLanguageFamilyPageProps) {
  const { locale, citySlug } = await params
  const t = await getTranslations('operator.languageFamilies.create.new')
  const tForm = await getTranslations('operator.languageFamilies.create.form.actions')

  /**
   * Handle form submission for creating a new language family
   *
   * @param data - Form data
   */
  async function handleSubmit(data: LanguageFamilyInput) {
    'use server'

    try {
      await createLanguageFamily(citySlug, data)
      redirect(`/${locale}/operator/${citySlug}/language-families`)
    } catch (error) {
      // Error will be handled by the form component
      throw error
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/operator/${citySlug}/language-families`}>
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('back')}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-gray-500 mt-1">{t('description')}</p>
        </div>
      </div>

      {/* Form */}
      <LanguageFamilyForm
        onSubmit={handleSubmit}
        submitLabel={tForm('createButton')}
      />
    </div>
  )
}
