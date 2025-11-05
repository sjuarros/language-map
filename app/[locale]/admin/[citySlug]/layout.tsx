/**
 * City-Specific Admin Layout
 *
 * Layout for admin pages specific to a particular city.
 * Validates that the user has access to this city via the city_users table.
 *
 * NOTE: Uses Client Components to ensure consistent authentication
 * with the main admin dashboard.
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building, Users, Settings } from 'lucide-react'

export default function CityAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [city, setCity] = useState<{ id: string; slug: string; name: string } | null>(null)
  const router = useRouter()
  const params = useParams()
  const citySlug = params?.citySlug as string
  const locale = (params?.locale as string) || 'en'

  useEffect(() => {
    async function checkAuthAndCityAccess() {
      try {
        console.log('[City Admin Layout] Starting auth check for city:', citySlug)

        const { createAuthClient } = await import('@/lib/auth/client')
        const { isAdmin } = await import('@/lib/auth/authorization')
        const supabase = createAuthClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        console.log('[City Admin Layout] Auth check:', { hasUser: !!user, email: user?.email, error: authError?.message })

        if (authError || !user) {
          console.log('[City Admin Layout] No user, redirecting to login')
          router.push(`/${locale}/login`)
          return
        }

        // Get user profile with role
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        console.log('[City Admin Layout] User profile:', { role: userProfile?.role, error: profileError?.message })

        if (profileError || !userProfile) {
          console.error('[City Admin Layout] Error fetching user profile:', profileError)
          router.push(`/${locale}/login`)
          return
        }

        // Check if user is admin or superuser
        if (!isAdmin(userProfile.role)) {
          console.log('[City Admin Layout] User does not have admin permissions:', userProfile.role)
          router.push(`/${locale}/`)
          return
        }

        // Get city and verify access
        console.log('[City Admin Layout] Fetching city:', citySlug)
        const { data: cityData, error: cityError } = await supabase
          .from('cities')
          .select(`
            id,
            slug,
            translations:city_translations!inner(
              name
            )
          `)
          .eq('slug', citySlug)
          .eq('translations.locale_code', locale)
          .single()

        console.log('[City Admin Layout] City query result:', { city: cityData, error: cityError?.message })

        if (cityError || !cityData) {
          console.error('[City Admin Layout] City not found or error:', cityError)
          router.push(`/${locale}/admin`)
          return
        }

        // Extract city name from translations (translations is an array from the join)
        const cityWithName = {
          id: cityData.id,
          slug: cityData.slug,
          name: cityData.translations?.[0]?.name || cityData.slug
        }

        setCity(cityWithName)

        // Check if user has access to this city
        console.log('[City Admin Layout] Checking city access for user:', user.id, 'city:', cityWithName.id)
        const { data: cityAccess, error: accessError } = await supabase
          .from('city_users')
          .select('role')
          .eq('city_id', cityWithName.id)
          .eq('user_id', user.id)
          .single()

        console.log('[City Admin Layout] City access result:', { access: cityAccess, error: accessError?.message })

        // Superusers bypass city access check
        const isSuperuser = userProfile.role === 'superuser'

        if (!cityAccess && !isSuperuser) {
          console.log('[City Admin Layout] User does not have access to this city')
          router.push(`/${locale}/admin`)
          return
        }

        // User is authorized
        console.log('[City Admin Layout] User authorized for city:', citySlug)
        setAuthorized(true)
        setLoading(false)
      } catch (err) {
        console.error('[City Admin Layout] Unexpected error:', err)
        router.push(`/${locale}/login`)
      }
    }

    if (citySlug) {
      checkAuthAndCityAccess()
    }
  }, [router, citySlug, locale])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900">Loading...</div>
          <p className="mt-2 text-sm text-gray-600">Checking authentication and city access</p>
        </div>
      </div>
    )
  }

  if (!authorized || !city) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb navigation */}
      <div className="flex items-center space-x-4">
        <Link href={`/${locale}/admin`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center space-x-2">
          <Building className="h-5 w-5 text-gray-600" />
          <h1 className="text-2xl font-bold text-gray-900">{city.name} Admin</h1>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <Link
            href={`/${locale}/admin/${citySlug}`}
            className="border-b-2 border-transparent px-1 pb-4 text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900"
          >
            Overview
          </Link>
          <Link
            href={`/${locale}/admin/${citySlug}/users`}
            className="border-b-2 border-transparent px-1 pb-4 text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900"
          >
            <Users className="mr-1 inline h-4 w-4" />
            Users
          </Link>
          <Link
            href={`/${locale}/admin/${citySlug}/settings`}
            className="border-b-2 border-transparent px-1 pb-4 text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900"
          >
            <Settings className="mr-1 inline h-4 w-4" />
            Settings
          </Link>
        </nav>
      </div>

      {/* Page content */}
      {children}
    </div>
  )
}
