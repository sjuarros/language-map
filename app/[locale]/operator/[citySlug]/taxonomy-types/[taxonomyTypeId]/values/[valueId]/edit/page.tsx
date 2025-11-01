/**
 * Edit Taxonomy Value Page
 * ========================
 * Page for editing an existing taxonomy value.
 *
 * @async
 * @param props - Component props
 * @param props.params - Route parameters
 * @param props.params.locale - Current locale code
 * @param props.params.citySlug - City identifier
 * @param props.params.taxonomyTypeId - Taxonomy type UUID
 * @param props.params.valueId - Taxonomy value UUID
 * @returns Page component JSX
 */

import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { getTaxonomyValue, getTaxonomyTypeForValues } from '@/app/actions/taxonomy-values'
import TaxonomyValueForm from '@/components/taxonomy-values/taxonomy-value-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function EditTaxonomyValuePage({
  params
}: {
  params: {
    locale: string
    citySlug: string
    taxonomyTypeId: string
    valueId: string
  }
}) {
  const locale = await getLocale()

  // Fetch taxonomy value and type in parallel
  const [taxonomyValue, taxonomyType] = await Promise.all([
    getTaxonomyValue(params.citySlug, params.valueId),
    getTaxonomyTypeForValues(params.citySlug, params.taxonomyTypeId),
  ])

  if (!taxonomyValue || !taxonomyType) {
    notFound()
  }

  // Verify taxonomy type matches
  if (taxonomyValue.taxonomy_type_id !== params.taxonomyTypeId) {
    notFound()
  }

  // Get taxonomy type name for current locale
  const taxonomyTypeName = taxonomyType.translations.find(
    (translation) => translation.locale_code === locale
  )?.name || taxonomyType.translations.find((translation) => translation.locale_code === 'en')?.name || taxonomyType.slug

  // Get taxonomy value name for current locale
  const translation = taxonomyValue.translations.find(
    (t) => t.locale_code === locale
  ) || taxonomyValue.translations.find((t) => t.locale_code === 'en')

  const initialData = {
    slug: taxonomyValue.slug,
    color_hex: taxonomyValue.color_hex,
    icon_name: taxonomyValue.icon_name || '',
    icon_size_multiplier: taxonomyValue.icon_size_multiplier,
    display_order: taxonomyValue.display_order,
    translations: taxonomyValue.translations.map((t) => ({
      locale_code: t.locale_code,
      name: t.name,
      description: t.description || '',
    })),
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link href={`/${params.locale}/operator/${params.citySlug}/taxonomy-types/${params.taxonomyTypeId}/values`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Taxonomy Values
          </Button>
        </Link>

        <div>
          <h1 className="text-3xl font-bold mb-2">
            Edit Taxonomy Value
          </h1>
          <p className="text-muted-foreground">
            {translation?.name || taxonomyValue.slug} for {taxonomyTypeName}
          </p>
        </div>
      </div>

      <TaxonomyValueForm
        taxonomyTypeId={params.taxonomyTypeId}
        taxonomyValueId={params.valueId}
        locale={params.locale}
        citySlug={params.citySlug}
        initialData={initialData}
      />
    </div>
  )
}
