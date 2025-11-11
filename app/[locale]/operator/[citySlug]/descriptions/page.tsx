/**
 * Descriptions List Page
 *
 * Displays all descriptions for a city in a table format with
 * language, neighborhood, and translation information.
 */

import React, { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getDescriptions, deleteDescription } from '@/app/actions/descriptions'
import { Plus, FileText, Edit, Trash2, Languages } from 'lucide-react'

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
 * This component renders a form with a server action to delete a description.
 *
 * @param citySlug - The slug of the city the description belongs to
 * @param descriptionId - The ID of the description to be deleted
 * @returns JSX element containing a form with a delete button
 */
async function DeleteButton({
  citySlug,
  descriptionId,
}: {
  citySlug: string
  descriptionId: string
}) {
  'use server'

  return (
    <form
      action={async () => {
        'use server'
        // Server action to handle description deletion
        // Wraps deleteDescription() to provide structured error logging
        // and ensure proper cache revalidation via revalidatePath in the action.
        // Errors are re-thrown to be caught by Next.js error boundary for UI feedback.
        try {
          await deleteDescription(citySlug, descriptionId)
          // Success - page will be revalidated by the server action
        } catch (error) {
          console.error('Failed to delete description:', {
            citySlug,
            descriptionId,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          // Re-throw to show error in UI through Next.js error boundary
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
 * Descriptions List component.
 * Fetches and displays a list of descriptions for a given city and locale.
 *
 * @param citySlug - The slug of the city to fetch descriptions for
 * @param locale - The current locale for translations
 * @returns JSX element displaying the list of descriptions or a message if none are found/an error occurs
 * @throws {Error} If there is an issue fetching descriptions
 */
async function DescriptionsList({
  citySlug,
  locale,
}: {
  citySlug: string
  locale: string
}) {
  try {
    const descriptions = await getDescriptions(citySlug, locale)

    if (descriptions.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">
            No descriptions
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by creating a new description.
          </p>
          <div className="mt-6">
            <Link href={`/${locale}/operator/${citySlug}/descriptions/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Description
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
              <TableHead>Description Preview</TableHead>
              <TableHead>Translations</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {descriptions.map((description) => {
              // Get current locale translation
              const currentTranslation = description.translations.find(
                (t) => t.locale === locale
              )

              return (
                <TableRow key={description.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span>{description.language_name}</span>
                      {description.language_endonym && (
                        <span className="text-sm text-muted-foreground">
                          ({description.language_endonym})
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {description.neighborhood_name || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="flex flex-col gap-1">
                      <p className="line-clamp-2 text-sm">
                        {currentTranslation?.text || (
                          <span className="text-muted-foreground italic">
                            No translation for {locale}
                          </span>
                        )}
                      </p>
                      {description.is_ai_generated && (
                        <Badge variant="secondary" className="w-fit">
                          AI Generated
                        </Badge>
                      )}
                      {currentTranslation?.is_ai_translated && (
                        <Badge variant="outline" className="w-fit">
                          AI Translated
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Languages className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {description.translations.length}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/${locale}/operator/${citySlug}/descriptions/${description.id}/translations`}
                      >
                        <Button variant="ghost" size="icon">
                          <Languages className="h-4 w-4" />
                          <span className="sr-only">Translations</span>
                        </Button>
                      </Link>
                      <Link
                        href={`/${locale}/operator/${citySlug}/descriptions/${description.id}`}
                      >
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </Link>
                      <DeleteButton
                        citySlug={citySlug}
                        descriptionId={description.id}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  } catch (error) {
    console.error('Error loading descriptions:', {
      citySlug,
      locale,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return (
      <div className="text-center py-12">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Failed to load descriptions</p>
          <p className="mt-1">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
        </div>
      </div>
    )
  }
}

/**
 * Descriptions Page component.
 * Main page component that displays the descriptions list with header and actions.
 *
 * @param params - Page parameters including locale and citySlug
 * @returns Promise resolving to JSX element containing the descriptions page
 */
export default async function DescriptionsPage({
  params
}: PageParams): Promise<React.JSX.Element> {
  const { locale, citySlug } = params

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Descriptions</h1>
          <p className="text-muted-foreground">
            Manage community stories and language descriptions
          </p>
        </div>
        <Link href={`/${locale}/operator/${citySlug}/descriptions/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Description
          </Button>
        </Link>
      </div>

      {/* Descriptions List */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading descriptions...</div>
          </div>
        }
      >
        <DescriptionsList citySlug={citySlug} locale={locale} />
      </Suspense>
    </div>
  )
}
