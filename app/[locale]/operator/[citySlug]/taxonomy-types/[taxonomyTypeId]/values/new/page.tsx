/**
 * New Taxonomy Value Page
 * =======================
 * Page for creating a new taxonomy value.
 *
 * @async
 * @param props - Component props
 * @param props.params - Route parameters
 * @param props.params.locale - Current locale code
 * @param props.params.citySlug - City identifier
 * @param props.params.taxonomyTypeId - Taxonomy type UUID
 * @returns Page component JSX
 */

import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { getTaxonomyTypeForValues } from '@/app/actions/taxonomy-values'
import TaxonomyValueForm from '@/components/taxonomy-values/taxonomy-value-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function NewTaxonomyValuePage({
  params
}: {
  params: {
    locale: string
    citySlug: string
    taxonomyTypeId: string
  }
}) {
  const locale = await getLocale()

  // Fetch taxonomy type to verify it exists
  const taxonomyType = await getTaxonomyTypeForValues(params.citySlug, params.taxonomyTypeId)

  if (!taxonomyType) {
    notFound()
  }

  // Get taxonomy type name for current locale
  const taxonomyTypeName = taxonomyType.translations.find(
    (translation) => translation.locale_code === locale
  )?.name || taxonomyType.translations.find((translation) => translation.locale_code === 'en')?.name || taxonomyType.slug

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
            Create New Taxonomy Value
          </h1>
          <p className="text-muted-foreground">
            for {taxonomyTypeName}
          </p>
        </div>
      </div>

      <TaxonomyValueForm
        taxonomyTypeId={params.taxonomyTypeId}
        locale={params.locale}
        citySlug={params.citySlug}
      />
    </div>
  )
}
