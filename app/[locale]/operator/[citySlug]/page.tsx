/**
 * City-Specific Operator Dashboard
 * ================================
 * Landing page for a specific city in the operator panel.
 * Redirects to districts by default.
 */

import { redirect } from 'next/navigation'

interface Props {
  params: {
    locale: string
    citySlug: string
  }
}

export default function CityOperatorPage({ params }: Props) {
  // Redirect to districts by default
  redirect(`/${params.locale}/operator/${params.citySlug}/districts`)
}
