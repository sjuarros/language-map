/**
 * Create New Taxonomy Type Page
 * =============================
 * Page for creating a new taxonomy type with multilingual support.
 *
 * @async
 * @param props - Component props
 * @param props.params - Route parameters
 * @param props.params.locale - Current locale code
 * @param props.params.citySlug - City identifier
 * @returns Page component JSX
 */

import { getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createTaxonomyType } from '@/app/actions/taxonomy-types'
import TaxonomyTypeForm from '@/components/taxonomy-types/taxonomy-type-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { getDatabaseClient } from '@/lib/database/client'

interface Props {
  params: {
    locale: string
    citySlug: string
  }
}

export default async function NewTaxonomyTypePage({ params }: Props) {
  const { locale, citySlug } = params
  const currentLocale = await getLocale()

  if (locale !== currentLocale) {
    redirect(`/${currentLocale}/operator/${citySlug}/taxonomy-types/new`)
  }

  const supabase = getDatabaseClient(citySlug)

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  // Get city info
  const { data: city } = await supabase
    .from('cities')
    .select('id, name, slug, translations!inner(name, locale)')
    .eq('slug', citySlug)
    .eq('translations.locale', locale)
    .single()

  if (!city) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create Taxonomy Type</h1>
          <p className="mt-2 text-sm text-gray-600">City not found</p>
        </div>
      </div>
    )
  }

  // Check if user has access to this city
  const { data: cityAccess } = await supabase
    .from('city_users')
    .select('city_id, role')
    .eq('user_id', user.id)
    .eq('city_id', city.id)
    .single()

  if (!cityAccess) {
    redirect(`/${locale}/operator`)
  }

  const handleSubmit = async (data: Record<string, unknown>) => {
    'use server'

    await createTaxonomyType(citySlug, {
      cityId: city.id,
      slug: String(data.slug),
      isRequired: Boolean(data.isRequired),
      allowMultiple: Boolean(data.allowMultiple),
      useForMapStyling: Boolean(data.useForMapStyling),
      useForFiltering: Boolean(data.useForFiltering),
      displayOrder: Number(data.displayOrder) || 0,
      name_en: String(data.name_en),
      description_en: data.description_en ? String(data.description_en) : undefined,
      name_nl: data.name_nl ? String(data.name_nl) : undefined,
      description_nl: data.description_nl ? String(data.description_nl) : undefined,
      name_fr: data.name_fr ? String(data.name_fr) : undefined,
      description_fr: data.description_fr ? String(data.description_fr) : undefined,
    })

    redirect(`/${locale}/operator/${citySlug}/taxonomy-types`)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/operator/${citySlug}/taxonomy-types`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Taxonomy Types
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Taxonomy Type</h1>
          <p className="mt-2 text-sm text-gray-600">
            Add a new classification type to {city.translations[0]?.name || city.name}
          </p>
        </div>
      </div>

      {/* Form */}
      <TaxonomyTypeForm
        cityId={city.id}
        citySlug={citySlug}
        locale={locale}
        onSubmit={handleSubmit}
        submitLabel="Create Taxonomy Type"
      />
    </div>
  )
}
