/**
 * Create Description Page
 *
 * Page for creating a new description for a language with initial translation.
 */

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { DescriptionForm } from '@/components/descriptions/description-form'
import {
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
  }
}

/**
 * Create Description Page component.
 * Displays a form to create a new description with language and neighborhood selection.
 *
 * @param params - Page parameters including locale and citySlug
 * @returns Promise resolving to JSX element containing the create description page
 */
export default async function CreateDescriptionPage({
  params
}: PageParams): Promise<React.JSX.Element> {
  const { locale, citySlug } = params

  try {
    // Fetch languages and neighborhoods for the selectors
    const [languages, neighborhoods] = await Promise.all([
      getLanguagesForDescription(citySlug, locale),
      getNeighborhoodsForDescription(citySlug, locale),
    ])

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
              Create Description
            </h1>
            <p className="text-muted-foreground">
              Add a new community story or language description
            </p>
          </div>
        </div>

        {/* Description Form */}
        <div className="max-w-2xl">
          <DescriptionForm
            citySlug={citySlug}
            locale={locale}
            languages={languages}
            neighborhoods={neighborhoods}
            mode="create"
          />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading create description page:', {
      citySlug,
      locale,
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
            Create Description
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
