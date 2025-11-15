/**
 * Create AI Source Page
 *
 * Page for creating a new AI source (whitelist/blacklist) for a city.
 */

import React from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AISourceForm } from '@/components/ai-sources/ai-source-form'

/**
 * Page parameters
 */
interface PageParams {
  params: Promise<{
    locale: string
    citySlug: string
  }>
}

/**
 * Create AI Source page component.
 * Renders a form for creating a new AI source for a city.
 *
 * @param params - Page parameters containing locale and citySlug
 * @returns JSX element rendering the create AI source page
 */
export default async function CreateAISourcePage({
  params,
}: PageParams): Promise<React.JSX.Element> {
  const { locale, citySlug } = await params
  const t = await getTranslations('aiSources')

  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      {/* Back button and breadcrumb */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/operator/${citySlug}/ai-sources`}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t('actions.back')}
          </Button>
        </Link>
      </div>

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('form.create')}</h1>
        <p className="text-muted-foreground mt-2">{t('form.createDescription')}</p>
      </div>

      {/* Create form */}
      <div className="rounded-lg border bg-card p-6">
        <AISourceForm citySlug={citySlug} mode="create" />
      </div>
    </div>
  )
}
