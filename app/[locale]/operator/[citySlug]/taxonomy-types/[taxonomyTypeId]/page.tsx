/**
 * Edit Taxonomy Type Page
 * =======================
 * Page for editing an existing taxonomy type with multilingual support.
 *
 * @async
 * @param props - Component props
 * @param props.params - Route parameters
 * @param props.params.locale - Current locale code
 * @param props.params.citySlug - City identifier
 * @param props.params.taxonomyTypeId - Taxonomy type UUID
 * @returns Page component JSX
 */

import { getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTaxonomyType, updateTaxonomyType, deleteTaxonomyType } from '@/app/actions/taxonomy-types'
import TaxonomyTypeForm from '@/components/taxonomy-types/taxonomy-type-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { getServerSupabaseWithCookies } from '@/lib/supabase/server-client'

interface Props {
  params: {
    locale: string
    citySlug: string
    taxonomyTypeId: string
  }
}

export default async function EditTaxonomyTypePage({ params }: Props) {
  const { locale, citySlug, taxonomyTypeId } = await params
  const currentLocale = await getLocale()

  if (locale !== currentLocale) {
    redirect(`/${currentLocale}/operator/${citySlug}/taxonomy-types/${taxonomyTypeId}`)
  }

  const supabase = await getServerSupabaseWithCookies(citySlug)

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
    .select('id, slug, city_translations!inner(name, locale_code)')
    .eq('slug', citySlug)
    .eq('city_translations.locale_code', locale)
    .single()

  if (!city) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Taxonomy Type</h1>
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

  // Get taxonomy type
  const taxonomyType = await getTaxonomyType(citySlug, taxonomyTypeId)

  if (!taxonomyType) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Taxonomy Type</h1>
          <p className="mt-2 text-sm text-gray-600">Taxonomy type not found</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (data: Record<string, unknown>) => {
    'use server'

    await updateTaxonomyType(citySlug, taxonomyTypeId, {
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
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Edit Taxonomy Type</h1>
          <p className="mt-2 text-sm text-gray-600">
            Update taxonomy type for {city.city_translations[0]?.name || city.name}
          </p>
        </div>
      </div>

      {/* Form */}
      <TaxonomyTypeForm
        cityId={city.id}
        citySlug={citySlug}
        locale={locale}
        initialData={taxonomyType}
        onSubmit={handleSubmit}
        submitLabel="Update Taxonomy Type"
      />

      {/* Delete Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Once you delete a taxonomy type, there is no way to undo this action. This will also
            delete all taxonomy values and language assignments associated with this taxonomy type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={async () => {
            'use server'
            await deleteTaxonomyType(citySlug, taxonomyTypeId)
            redirect(`/${locale}/operator/${citySlug}/taxonomy-types`)
          }}>
            <Button
              type="submit"
              variant="destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Taxonomy Type
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
