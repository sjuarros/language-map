/**
 * Edit Description Page
 *
 * Page for editing an existing description's metadata (language, neighborhood).
 * Note: Description text is edited via the translations page.
 */

import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { DescriptionForm } from '@/components/descriptions/description-form'
import {
  getDescription,
  getLanguagesForDescription,
  getNeighborhoodsForDescription,
} from '@/app/actions/descriptions'

/**
 * Page parameters
 */
interface PageParams {
  params: {
    locale: string
    citySlug: string
    id: string
  }
}

/**
 * Edit Description Page component.
 * Displays a form to edit an existing description's metadata.
 *
 * @param params - Page parameters including locale, citySlug, and description ID
 * @returns Promise resolving to JSX element containing the edit description page
 */
export default async function EditDescriptionPage({
  params
}: PageParams): Promise<React.JSX.Element> {
  const { locale, citySlug, id } = await params

  try {
    // Fetch description and related data
    const [description, languages, neighborhoods] = await Promise.all([
      getDescription(citySlug, id, locale),
      getLanguagesForDescription(citySlug, locale),
      getNeighborhoodsForDescription(citySlug, locale),
    ])

    // If description not found, show 404
    if (!description) {
      notFound()
    }

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/operator/${citySlug}/descriptions`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Edit Description
            </h1>
            <p className="text-muted-foreground">
              Update description metadata for {description.language_name}
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="max-w-2xl rounded-md bg-blue-50 p-4 text-sm">
          <p className="font-semibold text-blue-900">
            Editing metadata only
          </p>
          <p className="mt-1 text-blue-800">
            To edit the description text or add translations, use the{' '}
            <Link
              href={`/${locale}/operator/${citySlug}/descriptions/${id}/translations`}
              className="font-medium underline"
            >
              Translations
            </Link>{' '}
            page.
          </p>
        </div>

        {/* Description Form */}
        <div className="max-w-2xl">
          <DescriptionForm
            citySlug={citySlug}
            locale={locale}
            languages={languages}
            neighborhoods={neighborhoods}
            existingDescription={{
              id: description.id,
              language_id: description.language_id,
              neighborhood_id: description.neighborhood_id,
              is_ai_generated: description.is_ai_generated,
              ai_model: description.ai_model,
              translations: description.translations,
            }}
            mode="edit"
          />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading edit description page:', {
      citySlug,
      locale,
      id,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/operator/${citySlug}/descriptions`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Description
          </h1>
        </div>

        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Failed to load page</p>
          <p className="mt-1">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
        </div>
      </div>
    )
  }
}
