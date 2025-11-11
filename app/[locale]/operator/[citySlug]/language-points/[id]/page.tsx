/**
 * Edit Language Point Page
 *
 * Allows operators to edit existing language points
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguagePointForm } from '@/components/language-points/language-point-form'
import {
  getLanguagePoint,
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
    id: string
  }
}

/**
 * Edit Language Point Page.
 * Server component that fetches language point data and renders the edit form.
 *
 * @param params - The page parameters containing locale, citySlug, and id (Promise in Next.js 15+)
 * @param params.params.locale - The current locale
 * @param params.params.citySlug - The slug of the city
 * @param params.params.id - The ID of the language point to edit
 * @returns JSX element containing the edit form or error message
 */
export default async function EditLanguagePointPage({ params }: PageParams) {
  const { locale, citySlug, id } = await params

  // Validate route parameters
  if (!locale || typeof locale !== 'string') {
    console.error('Invalid locale received:', locale)
    notFound()
  }

  if (!citySlug || typeof citySlug !== 'string') {
    console.error('Invalid citySlug received:', citySlug)
    notFound()
  }

  if (!id || typeof id !== 'string') {
    console.error('Invalid language point ID received:', id)
    notFound()
  }

  // Validate UUID format for id
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    console.error('Invalid UUID format for language point ID:', id)
    notFound()
  }

  try {
    // Fetch all necessary data in parallel
    const [existingPoint, languages, neighborhoods] = await Promise.all([
      getLanguagePoint(citySlug, id),
      getLanguagesForPoints(citySlug, locale),
      getNeighborhoodsForPoints(citySlug, locale),
    ])

    if (!existingPoint) {
      notFound()
    }

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
            Edit Language Point
          </h1>
          <p className="text-muted-foreground">
            Update the geographic location details
          </p>
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          <LanguagePointForm
            citySlug={citySlug}
            locale={locale}
            languages={languages}
            neighborhoods={neighborhoods}
            existingPoint={{
              id: existingPoint.id,
              language_id: existingPoint.language_id,
              neighborhood_id: existingPoint.neighborhood_id,
              latitude: Number(existingPoint.latitude),
              longitude: Number(existingPoint.longitude),
              postal_code: existingPoint.postal_code,
              community_name: existingPoint.community_name,
              notes: existingPoint.notes,
            }}
            mode="edit"
          />
        </div>
      </div>
    )
  } catch (error) {
    let errorMessage = 'An unknown error occurred.'
    if (error instanceof Error) {
      console.error('Error loading edit page:', {
        citySlug,
        locale,
        pointId: id,
        message: error.message,
        stack: error.stack,
      })
      errorMessage = `Failed to load language point data: ${error.message}. Please try again.`
    } else {
      console.error('Error loading edit page:', {
        citySlug,
        locale,
        pointId: id,
        error,
      })
      errorMessage = 'Failed to load language point data. Please try again.'
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
