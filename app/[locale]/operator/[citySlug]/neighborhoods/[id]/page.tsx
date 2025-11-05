/**
 * Edit Neighborhood Page
 * ======================
 * Page for editing an existing neighborhood with multilingual support.
 */

import { getServerSupabaseWithCookies } from '@/lib/supabase/server-client'
import { getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getNeighborhood, getDistrictsForNeighborhood, updateNeighborhood, deleteNeighborhood } from '@/app/actions/neighborhoods'
import NeighborhoodForm from '@/components/neighborhoods/neighborhood-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Trash2 } from 'lucide-react'

interface Props {
  params: {
    locale: string
    citySlug: string
    id: string
  }
}

export default async function EditNeighborhoodPage({ params }: Props) {
  const { locale, citySlug, id } = await params
  const currentLocale = await getLocale()

  if (locale !== currentLocale) {
    redirect(`/${currentLocale}/operator/${citySlug}/neighborhoods/${id}`)
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
          <h1 className="text-3xl font-bold">Edit Neighborhood</h1>
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

  // Get neighborhood
  const neighborhood = await getNeighborhood(citySlug, id)

  if (!neighborhood) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Neighborhood</h1>
          <p className="mt-2 text-sm text-gray-600">Neighborhood not found</p>
        </div>
      </div>
    )
  }

  // Get districts for dropdown
  const districts = await getDistrictsForNeighborhood(citySlug)

  const handleSubmit = async (data: Record<string, unknown>) => {
    'use server'

    await updateNeighborhood(citySlug, id, {
      cityId: city.id,
      districtId: data.districtId as string,
      slug: data.slug as string,
      isActive: data.isActive as boolean,
      name_en: data.name_en as string,
      description_en: data.description_en as string | undefined,
      name_nl: data.name_nl as string | undefined,
      description_nl: data.description_nl as string | undefined,
      name_fr: data.name_fr as string | undefined,
      description_fr: data.description_fr as string | undefined,
    })
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/operator/${citySlug}/neighborhoods`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Neighborhoods
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Edit Neighborhood</h1>
          <p className="mt-2 text-sm text-gray-600">
            Update neighborhood information for {city.city_translations[0]?.name || city.name}
          </p>
        </div>
      </div>

      {/* Form */}
      <NeighborhoodForm
        cityId={city.id}
        citySlug={citySlug}
        locale={locale}
        districts={districts}
        initialData={neighborhood}
        onSubmit={handleSubmit}
        submitLabel="Update Neighborhood"
      />

      {/* Delete Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Once you delete a neighborhood, there is no way to undo this action. This will also
            delete any language points linked to this neighborhood.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={async () => {
            'use server'
            await deleteNeighborhood(citySlug, id)
            redirect(`/${locale}/operator/${citySlug}/neighborhoods`)
          }}>
            <Button
              type="submit"
              variant="destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Neighborhood
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
