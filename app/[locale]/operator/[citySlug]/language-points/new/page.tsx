/**
 * Create Language Point Page
 *
 * Allows operators to create new language points with geographic coordinates
 */

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguagePointForm } from '@/components/language-points/language-point-form'
import {
  getLanguagesForPoints,
  getNeighborhoodsForPoints,
} from '@/app/actions/language-points'

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
 * Create Language Point Page.
 * Server component that fetches necessary data and renders the creation form.
 *
 * @param params - The page parameters containing locale and citySlug
 * @param params.params.locale - The current locale
 * @param params.params.citySlug - The slug of the city
 * @returns JSX element containing the create form or error message
 */
export default async function CreateLanguagePointPage({ params }: PageParams) {
  const { locale, citySlug } = params

  // Validate route parameters
  if (!locale || typeof locale !== 'string') {
    console.error('Invalid locale received:', locale)
    throw new Error('Invalid locale parameter')
  }

  if (!citySlug || typeof citySlug !== 'string') {
    console.error('Invalid citySlug received:', citySlug)
    throw new Error('Invalid citySlug parameter')
  }

  try {
    // Fetch languages and neighborhoods in parallel
    const [languages, neighborhoods] = await Promise.all([
      getLanguagesForPoints(citySlug, locale),
      getNeighborhoodsForPoints(citySlug, locale),
    ])

    return (
      <div className="space-y-6">
        {/* Back Button */}
        <Link href={`/${locale}/operator/${citySlug}/language-points`}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Language Points
          </Button>
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create Language Point
          </h1>
          <p className="text-muted-foreground">
            Add a new geographic location where a language is spoken
          </p>
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          {languages.length === 0 ? (
            <div className="rounded-md bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                No languages available. Please create languages first before adding
                language points.
              </p>
              <Link href={`/${locale}/operator/${citySlug}/languages/new`}>
                <Button variant="link" className="mt-2 p-0 h-auto text-yellow-900">
                  Create a language →
                </Button>
              </Link>
            </div>
          ) : (
            <LanguagePointForm
              citySlug={citySlug}
              locale={locale}
              languages={languages}
              neighborhoods={neighborhoods}
              mode="create"
            />
          )}
        </div>
      </div>
    )
  } catch (error) {
    let errorMessage = 'An unknown error occurred.'
    if (error instanceof Error) {
      console.error('Error loading create page:', {
        citySlug,
        locale,
        message: error.message,
        stack: error.stack,
      })
      errorMessage = `Failed to load form data: ${error.message}. Please try again.`
    } else {
      console.error('Error loading create page:', {
        citySlug,
        locale,
        error,
      })
      errorMessage = 'Failed to load form data. Please try again.'
    }
    return (
      <div className="space-y-6">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      </div>
    )
  }
}
