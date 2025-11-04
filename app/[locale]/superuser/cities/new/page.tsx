/**
 * @file page.tsx
 * @description Server component for creating a new city with multilingual support.
 *              Fetches available countries from the database and renders the
 *              CreateCityForm component for city creation.
 *              Requires superuser authentication to access.
 */

import { getLocale } from 'next-intl/server'
import { getDatabaseClient } from '@/lib/database/client'
import { getServerSupabaseWithCookies } from '@/lib/supabase/server-client'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { CreateCityForm } from './CreateCityForm'

// TypeScript interfaces for type safety
interface CountryTranslation {
  name: string
  locale_code: string
}

interface Country {
  id: string
  slug: string
  translations: CountryTranslation[]
}

/**
 * Server component that renders the new city creation page.
 * This page allows superusers to create new cities in the platform with
 * multilingual support. It fetches available countries from the database
 * and displays a form for city creation.
 *
 * @async
 * @returns The page component with countries list and creation form
 * @throws {Error} If user is not authenticated, lacks superuser role,
 *                 or if countries cannot be fetched from database
 */
export default async function NewCityPage() {
  // Verify authentication
  const supabase = await getServerSupabaseWithCookies('system')
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect(`/${await getLocale()}/login`)
  }

  // Verify superuser role
  const { data: userProfile, error: roleError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (roleError || !userProfile || userProfile.role !== 'superuser') {
    redirect(`/${await getLocale()}/unauthorized`)
  }

  // Get and validate locale
  const locale = await getLocale()

  // Validate locale format
  if (!locale || typeof locale !== 'string') {
    throw new Error('Invalid locale parameter')
  }

  if (!locale.match(/^[a-z]{2}(-[A-Z]{2})?$/)) {
    throw new Error(`Invalid locale format: ${locale}`)
  }

  // Fetch available countries with error handling
  let countries: Country[] = []
  try {
    const supabase = getDatabaseClient('system')
    const { data, error } = await supabase
      .from('countries')
      .select(`
        id,
        slug,
        translations:country_translations!inner(
          name,
          locale_code
        )
      `)
      .eq('translations.locale_code', locale)
      .order('slug')

    if (error) {
      throw new Error(`Database error while fetching countries: ${error.message}`)
    }

    // Validate response data
    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid countries data received from database')
    }

    countries = data
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load countries: ${error.message}`)
    }
    throw new Error('Failed to load countries: Unknown error')
  }

  // Sort countries by translated name with safe array access
  const sortedCountries = countries.sort((a, b) => {
    // Validate array structures
    if (!a.translations || !Array.isArray(a.translations) || a.translations.length === 0) {
      return a.slug.localeCompare(b.slug || '')
    }
    if (!b.translations || !Array.isArray(b.translations) || b.translations.length === 0) {
      return (a.slug || '').localeCompare(b.slug)
    }

    const nameA = a.translations[0]?.name || a.slug || ''
    const nameB = b.translations[0]?.name || b.slug || ''
    return nameA.localeCompare(nameB)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href={`/${locale}/superuser`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New City</h1>
          <p className="mt-2 text-sm text-gray-600">
            Add a new city to the platform with multilingual support
          </p>
        </div>
      </div>

      <CreateCityForm countries={sortedCountries || []} locale={locale} />
    </div>
  )
}
