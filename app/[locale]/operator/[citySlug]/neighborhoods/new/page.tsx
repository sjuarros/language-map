/**
 * Create Neighborhood Page
 * ========================
 * Page for creating a new neighborhood with multilingual support.
 */

import { getDatabaseClient } from '@/lib/database/client'
import { getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getDistrictsForNeighborhood, createNeighborhood } from '@/app/actions/neighborhoods'
import NeighborhoodForm from '@/components/neighborhoods/neighborhood-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface Props {
  params: {
    locale: string
    citySlug: string
  }
}

export default async function NewNeighborhoodPage({ params }: Props) {
  const { locale, citySlug } = params
  const currentLocale = await getLocale()

  if (locale !== currentLocale) {
    redirect(`/${currentLocale}/operator/${citySlug}/neighborhoods/new`)
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
          <h1 className="text-3xl font-bold">Create Neighborhood</h1>
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

  // Get districts for dropdown
  const districts = await getDistrictsForNeighborhood(citySlug)

  if (districts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/operator/${citySlug}/neighborhoods`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Neighborhoods
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Create Neighborhood</h1>
            <p className="mt-2 text-sm text-gray-600">
              Create neighborhood for {city.translations[0]?.name || city.name}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <h3 className="font-semibold text-yellow-900">No Districts Available</h3>
          <p className="mt-2 text-sm text-yellow-800">
            You need to create at least one district before creating neighborhoods.
            Neighborhoods must be assigned to a district as part of the geographic hierarchy.
          </p>
          <Link href={`/${locale}/operator/${citySlug}/districts/new`} className="mt-4 inline-block">
            <Button variant="outline" size="sm">
              Create District First
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (data: Record<string, unknown>) => {
    'use server'

    await createNeighborhood(citySlug, {
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

    redirect(`/${locale}/operator/${citySlug}/neighborhoods`)
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
          <h1 className="text-3xl font-bold">Create Neighborhood</h1>
          <p className="mt-2 text-sm text-gray-600">
            Add a new neighborhood to {city.translations[0]?.name || city.name}
          </p>
        </div>
      </div>

      {/* Form */}
      <NeighborhoodForm
        cityId={city.id}
        citySlug={citySlug}
        locale={locale}
        districts={districts}
        onSubmit={handleSubmit}
        submitLabel="Create Neighborhood"
      />
    </div>
  )
}
