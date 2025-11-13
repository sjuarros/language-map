/**
 * Description Translations Management Page
 * =========================================
 * Page for managing translations of a description's text across different locales.
 *
 * This page allows operators to add, edit, and delete translations for
 * community descriptions in different languages (EN/NL/FR).
 *
 * @module app/[locale]/operator/[citySlug]/descriptions/[id]/translations/page
 */

import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getDescription } from '@/app/actions/descriptions'
import {
  getDescriptionTranslations,
  getAvailableLocales,
} from '@/app/actions/description-translations'
import { DescriptionTranslationForm } from '@/components/descriptions/description-translation-form'

/**
 * Props interface for the Description Translations Page component
 *
 * @param params - Route parameters
 * @param params.locale - The UI locale code (e.g., 'en', 'nl', 'fr')
 * @param params.citySlug - The city identifier slug
 * @param params.id - The description UUID
 */
interface DescriptionTranslationsPageProps {
  params: Promise<{
    locale: string
    citySlug: string
    id: string
  }>
}

/**
 * Description Translations Management Page Component
 *
 * Server component that displays and manages translations for a description.
 *
 * Authentication & Authorization:
 * - Protected by parent layout (app/[locale]/operator/layout.tsx)
 * - Requires operator/admin/superuser role
 * - City-level access controlled via city_users table and RLS policies
 *
 * @param props - Page props containing route parameters
 * @returns Description translations management page
 * @throws {Error} If input parameters are invalid
 */
export default async function DescriptionTranslationsPage({ params }: DescriptionTranslationsPageProps): Promise<React.JSX.Element> {
  // Input validation
  const { locale: rawLocale, citySlug: rawCitySlug, id: rawId } = await params

  if (!rawLocale || typeof rawLocale !== 'string') {
    console.error('[Description Translations Page] Invalid locale parameter')
    return notFound()
  }

  if (!rawCitySlug || typeof rawCitySlug !== 'string') {
    console.error('[Description Translations Page] Invalid citySlug parameter')
    return notFound()
  }

  if (!rawCitySlug.match(/^[a-z0-9-]+$/)) {
    console.error('[Description Translations Page] Invalid citySlug format:', rawCitySlug)
    return notFound()
  }

  if (!rawId || !rawId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    console.error('[Description Translations Page] Invalid description ID format:', rawId)
    return notFound()
  }

  const locale = rawLocale
  const citySlug = rawCitySlug
  const descriptionId = rawId

  const t = await getTranslations('descriptionTranslations')
  const tCommon = await getTranslations('common')

  // Fetch description details
  let description
  let error: string | null = null

  try {
    description = await getDescription(citySlug, descriptionId, locale)
  } catch (err) {
    console.error('Error fetching description:', err)
    error = err instanceof Error ? err.message : `Failed to load description details: ${String(err)}`
  }

  if (error || !description) {
    return notFound()
  }

  // Fetch existing translations
  let translations: Awaited<ReturnType<typeof getDescriptionTranslations>> = []
  let availableLocales: Awaited<ReturnType<typeof getAvailableLocales>> = []

  try {
    translations = await getDescriptionTranslations(citySlug, descriptionId)
    availableLocales = await getAvailableLocales(citySlug)
  } catch (err) {
    console.error('Error fetching translations or locales:', err)
    error = err instanceof Error ? err.message : `Failed to load translations or locales: ${String(err)}`
  }

  // Determine which locales are missing translations
  const existingLocaleCodes = new Set(translations.map(t => t.locale))
  const missingLocales = availableLocales.filter(l => !existingLocaleCodes.has(l.code))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/operator/${citySlug}/descriptions`}>
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
            <FileText className="h-4 w-4" />
            <span className="font-medium">
              {description.language_name}
              {description.neighborhood_name && ` • ${description.neighborhood_name}`}
            </span>
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
                <DescriptionTranslationForm
                  key={`${translation.description_id}-${translation.locale}`}
                  citySlug={citySlug}
                  descriptionId={descriptionId}
                  translation={translation}
                  localeName={
                    availableLocales.find(l => l.code === translation.locale)?.native_name ||
                    translation.locale
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
                <DescriptionTranslationForm
                  key={missingLocale.code}
                  citySlug={citySlug}
                  descriptionId={descriptionId}
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
