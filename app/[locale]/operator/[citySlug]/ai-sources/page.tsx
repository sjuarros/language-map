/**
 * AI Sources List Page
 *
 * Displays all AI sources (whitelist/blacklist) for a city in a table format
 * with URL, list type, notes, and action buttons.
 */

import React, { Suspense } from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
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
import { getAISources, deleteAISource } from '@/app/actions/ai-sources'
import { Plus, Shield, Edit, Trash2 } from 'lucide-react'

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
 * Delete button component.
 * This component renders a form with a server action to delete an AI source.
 *
 * @param citySlug - The slug of the city the AI source belongs to
 * @param sourceId - The ID of the AI source to be deleted
 * @returns JSX element containing a form with a delete button
 */
async function DeleteButton({
  citySlug,
  sourceId,
}: {
  citySlug: string
  sourceId: string
}): Promise<React.JSX.Element> {
  'use server'

  return (
    <form
      action={async () => {
        'use server'
        // Server action to handle AI source deletion
        // Wraps deleteAISource() to provide structured error logging
        // and ensure proper cache revalidation via revalidatePath in the action.
        // Errors are re-thrown to be caught by Next.js error boundary for UI feedback.
        try {
          await deleteAISource(citySlug, sourceId)
          // Success - page will be revalidated by the server action
        } catch (error) {
          console.error('Failed to delete AI source:', {
            citySlug,
            sourceId,
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
        aria-label="Delete AI source"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Delete</span>
      </Button>
    </form>
  )
}

/**
 * AI Sources List component.
 * Fetches and displays a list of AI sources for a given city.
 *
 * @param citySlug - The slug of the city to fetch AI sources for
 * @param locale - The current locale for translations
 * @returns JSX element displaying the list of AI sources or a message if none are found/an error occurs
 * @throws {Error} If there is an issue fetching AI sources
 */
async function AISourcesList({
  citySlug,
  locale,
}: {
  citySlug: string
  locale: string
}): Promise<React.JSX.Element> {
  const t = await getTranslations('aiSources')

  try {
    const sources = await getAISources(citySlug)

    // If no AI sources exist, display empty state
    if (sources.length === 0) {
      return (
        <div className="text-center py-12">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">
            {t('list.empty.title')}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('list.empty.description')}
          </p>
          <div className="mt-6">
            <Link href={`/${locale}/operator/${citySlug}/ai-sources/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('actions.create')}
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
              <TableHead>{t('list.columns.url')}</TableHead>
              <TableHead>{t('list.columns.listType')}</TableHead>
              <TableHead>{t('list.columns.notes')}</TableHead>
              <TableHead className="text-right">{t('list.columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source) => (
              <TableRow key={source.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <code className="text-sm">{source.url}</code>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={source.list_type === 'whitelist' ? 'default' : 'destructive'}
                  >
                    {source.list_type === 'whitelist'
                      ? t('fields.listType.whitelist')
                      : t('fields.listType.blacklist')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="max-w-md truncate text-sm text-muted-foreground">
                    {source.notes || '—'}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/${locale}/operator/${citySlug}/ai-sources/${source.id}`}>
                      <Button variant="ghost" size="icon" aria-label="Edit AI source">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </Link>
                    <DeleteButton citySlug={citySlug} sourceId={source.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  } catch (error) {
    console.error('Error loading AI sources:', error)
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-600">
          {t('errors.loadFailed')}
        </p>
      </div>
    )
  }
}

/**
 * AI Sources page component.
 * Main page for managing AI sources (whitelist/blacklist) for a city.
 *
 * @param params - Page parameters containing locale and citySlug
 * @returns JSX element rendering the AI sources management page
 */
export default async function AISourcesPage({
  params,
}: PageParams): Promise<React.JSX.Element> {
  const { locale, citySlug } = await params
  const t = await getTranslations('aiSources')

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('description')}</p>
        </div>
        <Link href={`/${locale}/operator/${citySlug}/ai-sources/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('actions.create')}
          </Button>
        </Link>
      </div>

      {/* AI Sources list with suspense boundary */}
      <Suspense
        fallback={
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">{t('list.loading')}</p>
          </div>
        }
      >
        <AISourcesList citySlug={citySlug} locale={locale} />
      </Suspense>

      {/* Help section */}
      <div className="rounded-lg border bg-muted/50 p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t('help.title')}</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>{t('help.whitelistDescription')}</p>
          <p>{t('help.blacklistDescription')}</p>
          <p>{t('help.example')}</p>
        </div>
      </div>
    </div>
  )
}
