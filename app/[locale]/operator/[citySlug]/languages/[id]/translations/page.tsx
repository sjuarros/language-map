/**
 * Language Translations Management Page
 * ======================================
 * Page for managing translations of a language's name across different locales.
 *
 * IMPORTANT: This page manages UI locale translations (e.g., "English" in EN,
 * "Engels" in NL, "Anglais" in FR). The endonym (native language name) is NOT
 * translated and is managed in the main language form.
 *
 * @module app/[locale]/operator/[citySlug]/languages/[id]/translations/page
 */

import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ArrowLeft, Languages as LanguagesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getLanguage } from '@/app/actions/languages'
import {
  getLanguageTranslations,
  getAvailableLocales,
} from '@/app/actions/language-translations'
import { LanguageTranslationForm } from '@/components/languages/language-translation-form'

/**
 * Props interface for the Language Translations Page component
 *
 * @param params - Route parameters
 * @param params.locale - The UI locale code (e.g., 'en', 'nl', 'fr')
 * @param params.citySlug - The city identifier slug
 * @param params.id - The language UUID
 */
interface LanguageTranslationsPageProps {
  params: Promise<{
    locale: string
    citySlug: string
    id: string
  }>
}

/**
 * Language Translations Management Page Component
 *
 * Server component that displays and manages translations for a language.
 *
 * Authentication & Authorization:
 * - Protected by parent layout (app/[locale]/operator/layout.tsx)
 * - Requires operator/admin/superuser role
 * - City-level access controlled via city_users table and RLS policies
 *
 * @param props - Page props containing route parameters
 * @returns Language translations management page
 * @throws {Error} If input parameters are invalid
 */
export default async function LanguageTranslationsPage({ params }: LanguageTranslationsPageProps) {
  // Input validation
  const { locale: rawLocale, citySlug: rawCitySlug, id: rawId } = await params

  if (!rawLocale || typeof rawLocale !== 'string') {
    console.error('[Language Translations Page] Invalid locale parameter')
    return notFound()
  }

  if (!rawCitySlug || typeof rawCitySlug !== 'string') {
    console.error('[Language Translations Page] Invalid citySlug parameter')
    return notFound()
  }

  if (!rawCitySlug.match(/^[a-z0-9-]+$/)) {
    console.error('[Language Translations Page] Invalid citySlug format:', rawCitySlug)
    return notFound()
  }

  if (!rawId || !rawId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    console.error('[Language Translations Page] Invalid language ID format:', rawId)
    return notFound()
  }

  const locale = rawLocale
  const citySlug = rawCitySlug
  const languageId = rawId

  const t = await getTranslations('languageTranslations')
  const tCommon = await getTranslations('common')

  // Fetch language details
  let language
  let error: string | null = null

  try {
    language = await getLanguage(citySlug, languageId)
  } catch (err) {
    console.error('Error fetching language:', err)
    error = err instanceof Error ? err.message : `Failed to load language details: ${String(err)}`
  }

  if (error || !language) {
    return notFound()
  }

  // Fetch existing translations
  let translations: Awaited<ReturnType<typeof getLanguageTranslations>> = []
  let availableLocales: Awaited<ReturnType<typeof getAvailableLocales>> = []

  try {
    translations = await getLanguageTranslations(citySlug, languageId)
    availableLocales = await getAvailableLocales(citySlug)
  } catch (err) {
    console.error('Error fetching translations or locales:', err)
    error = err instanceof Error ? err.message : `Failed to load translations or locales: ${String(err)}`
  }

  // Determine which locales are missing translations
  const existingLocaleCodes = new Set(translations.map(t => t.locale_code))
  const missingLocales = availableLocales.filter(l => !existingLocaleCodes.has(l.code))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/operator/${citySlug}/languages`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tCommon('actions.back')}
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('title')}
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <LanguagesIcon className="h-4 w-4" />
            <span className="font-medium">{language.endonym}</span>
          </div>
        </div>
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

      {/* Help Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">{t('help.title')}</CardTitle>
          <CardDescription className="text-blue-700">
            {t('help.description')}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Existing Translations */}
      {!error && translations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('existingTranslations.title')}</CardTitle>
            <CardDescription>
              {t('existingTranslations.description', { count: translations.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {translations.map(translation => (
                <LanguageTranslationForm
                  key={translation.id}
                  citySlug={citySlug}
                  languageId={languageId}
                  translation={translation}
                  localeName={
                    availableLocales.find(l => l.code === translation.locale_code)?.native_name ||
                    translation.locale_code
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing Translations */}
      {!error && missingLocales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('missingTranslations.title')}</CardTitle>
            <CardDescription>
              {t('missingTranslations.description', { count: missingLocales.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {missingLocales.map(missingLocale => (
                <LanguageTranslationForm
                  key={missingLocale.code}
                  citySlug={citySlug}
                  languageId={languageId}
                  localeCode={missingLocale.code}
                  localeName={missingLocale.native_name}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Translations Yet */}
      {!error && translations.length === 0 && missingLocales.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
              {t('noTranslations')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* AI Translation Badge Info */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300">
              AI
            </Badge>
            <CardTitle className="text-amber-900">{t('aiInfo.title')}</CardTitle>
          </div>
          <CardDescription className="text-amber-700">
            {t('aiInfo.description')}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
