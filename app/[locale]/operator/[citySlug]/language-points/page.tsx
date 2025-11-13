/**
 * Language Points List Page
 *
 * Displays all language points for a city in a table format with
 * coordinates, language, and neighborhood information.
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getLanguagePoints, deleteLanguagePoint } from '@/app/actions/language-points'
import { Plus, MapPin, Edit, Trash2 } from 'lucide-react'

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
 * Delete button component.
 * This component renders a form with a server action to delete a language point.
 *
 * @param citySlug - The slug of the city the language point belongs to
 * @param pointId - The ID of the language point to be deleted
 * @returns JSX element containing a form with a delete button
 */
async function DeleteButton({
  citySlug,
  pointId,
}: {
  citySlug: string
  pointId: string
}) {
  'use server'

  return (
    <form
      action={async () => {
        'use server'
        try {
          await deleteLanguagePoint(citySlug, pointId)
          // Success - page will be revalidated by the server action
        } catch (error) {
          console.error('Failed to delete language point:', {
            citySlug,
            pointId,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          // Re-throw to show error in UI
          throw error
        }
      }}
    >
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Delete</span>
      </Button>
    </form>
  )
}

/**
 * Language Points List component.
 * Fetches and displays a list of language points for a given city and locale.
 *
 * @param citySlug - The slug of the city to fetch language points for
 * @param locale - The current locale for translations
 * @returns JSX element displaying the list of language points or a message if none are found/an error occurs
 * @throws {Error} If there is an issue fetching language points
 */
async function LanguagePointsList({
  citySlug,
  locale,
}: {
  citySlug: string
  locale: string
}) {
  try {
    const points = await getLanguagePoints(citySlug, locale)

    if (points.length === 0) {
      return (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">
            No language points
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by creating a new language point.
          </p>
          <div className="mt-6">
            <Link href={`/${locale}/operator/${citySlug}/language-points/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Language Point
              </Button>
            </Link>
          </div>
        </div>
      )
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Language</TableHead>
              <TableHead>Neighborhood</TableHead>
              <TableHead>Coordinates</TableHead>
              <TableHead>Community Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {points.map((point) => (
              <TableRow key={point.id}>
                <TableCell className="font-medium">
                  {point.language
                    ? point.language.translations?.[0]?.name ||
                      point.language.endonym ||
                      'Unknown'
                    : 'Unknown'}
                </TableCell>
                <TableCell>
                  {point.neighborhood
                    ? point.neighborhood.translations?.[0]?.name
                    : '-'}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                </TableCell>
                <TableCell>{point.community_name || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/${locale}/operator/${citySlug}/language-points/${point.id}`}
                    >
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </Link>
                    <DeleteButton
                      citySlug={citySlug}
                      pointId={point.id}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  } catch (error) {
    let errorMessage = 'An unknown error occurred.'
    if (error instanceof Error) {
      console.error('Error loading language points:', {
        citySlug,
        locale,
        message: error.message,
        stack: error.stack,
      })
      errorMessage = `Failed to load language points: ${error.message}. Please try again.`
    } else {
      console.error('Error loading language points:', {
        citySlug,
        locale,
        error,
      })
      errorMessage = 'Failed to load language points. Please try again.'
    }
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-600">{errorMessage}</p>
      </div>
    )
  }
}

/**
 * Language Points Page.
 * Server component that renders the language points list with navigation and a header.
 *
 * @param params - The page parameters containing locale and citySlug (Promise in Next.js 15+)
 * @param params.params.locale - The current locale
 * @param params.params.citySlug - The slug of the city
 * @returns JSX element containing the language points page
 */
export default async function LanguagePointsPage({ params }: PageParams) {
  const { locale, citySlug } = await params

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Language Points</h1>
          <p className="text-muted-foreground">
            Manage geographic locations where languages are spoken
          </p>
        </div>
        <Link href={`/${locale}/operator/${citySlug}/language-points/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Language Point
          </Button>
        </Link>
      </div>

      {/* Language Points List */}
      <Suspense fallback={<div>Loading language points...</div>}>
        <LanguagePointsList citySlug={citySlug} locale={locale} />
      </Suspense>
    </div>
  )
}
