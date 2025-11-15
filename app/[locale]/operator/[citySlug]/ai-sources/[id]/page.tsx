/**
 * Edit AI Source Page
 *
 * Page for editing an existing AI source (whitelist/blacklist) for a city.
 */

import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AISourceForm } from '@/components/ai-sources/ai-source-form'
import { getAISource } from '@/app/actions/ai-sources'

/**
 * Page parameters
 */
interface PageParams {
  params: Promise<{
    locale: string
    citySlug: string
    id: string
  }>
}

/**
 * Edit AI Source page component.
 * Fetches the AI source data and renders a form for editing it.
 *
 * @param params - Page parameters containing locale, citySlug, and id
 * @returns JSX element rendering the edit AI source page
 */
export default async function EditAISourcePage({
  params,
}: PageParams): Promise<React.JSX.Element> {
  const { locale, citySlug, id } = await params
  const t = await getTranslations('aiSources')

  try {
    // Fetch the AI source data
    const aiSource = await getAISource(citySlug, id)

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
          <h1 className="text-3xl font-bold tracking-tight">{t('form.edit')}</h1>
          <p className="text-muted-foreground mt-2">{t('form.editDescription')}</p>
        </div>

        {/* Edit form */}
        <div className="rounded-lg border bg-card p-6">
          <AISourceForm
            citySlug={citySlug}
            existingAISource={{
              id: aiSource.id,
              url: aiSource.url,
              list_type: aiSource.list_type,
              notes: aiSource.notes,
            }}
            mode="edit"
          />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading AI source:', error)

    // Distinguish between different error types before showing 404
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('AI source not found')) {
        // Actual 404 - AI source doesn't exist
        notFound()
      } else if (error.message.includes('Invalid AI source ID format')) {
        // Invalid ID format - also a 404
        notFound()
      } else {
        // For other errors (network, permissions, etc.), throw to show error boundary
        throw new Error(`Failed to load AI source: ${error.message}`)
      }
    } else {
      // Unknown error type - throw to error boundary
      throw new Error('Failed to load AI source: Unknown error')
    }
  }
}
