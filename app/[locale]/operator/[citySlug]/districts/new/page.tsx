/**
 * Create New District Page
 * ========================
 * Page for creating a new district with multilingual support.
 */

import { getServerSupabaseWithCookies } from '@/lib/supabase/server-client'
import { getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createDistrict } from '@/app/actions/districts'
import DistrictForm from '@/components/districts/district-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface Props {
  params: {
    locale: string
    citySlug: string
  }
}

export default async function NewDistrictPage({ params }: Props) {
  const { locale, citySlug } = await params
  const currentLocale = await getLocale()

  if (locale !== currentLocale) {
    redirect(`/${currentLocale}/operator/${citySlug}/districts/new`)
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
    .select('id, slug')
    .eq('slug', citySlug)
    .single()

  if (!city) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create District</h1>
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

    await createDistrict(citySlug, {
      cityId: city.id,
      slug: data.slug as string,
      name_en: data.name_en as string,
      description_en: data.description_en as string | undefined,
      name_nl: data.name_nl as string | undefined,
      description_nl: data.description_nl as string | undefined,
      name_fr: data.name_fr as string | undefined,
      description_fr: data.description_fr as string | undefined,
    })

    redirect(`/${locale}/operator/${citySlug}/districts`)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/operator/${citySlug}/districts`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Districts
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create District</h1>
          <p className="mt-2 text-sm text-gray-600">
            Add a new district to {citySlug}
          </p>
        </div>
      </div>

      {/* Form */}
      <DistrictForm
        cityId={city.id}
        citySlug={citySlug}
        locale={locale}
        onSubmit={handleSubmit}
        submitLabel="Create District"
      />
    </div>
  )
}
