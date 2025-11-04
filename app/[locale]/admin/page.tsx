/**
 * @file app/[locale]/admin/page.tsx
 * @description Admin dashboard with city selector and overview statistics
 *
 * This component:
 * - Displays admin dashboard for users with admin/operator roles
 * - Shows city selector when user has access to multiple cities
 * - Displays statistics for the primary city
 * - Handles authentication and authorization
 * - Provides navigation to city-specific admin pages
 *
 * Architecture Note:
 * This uses client-side authentication because:
 * 1. Server Components cannot access cookies set by external libraries (Supabase auth)
 * 2. Needs to handle client-side navigation with router.push()
 * 3. Must work with Supabase's client-side auth session
 * 4. Direct database queries are necessary for auth state
 *
 * @module app/admin/page
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Settings } from 'lucide-react'

interface City {
  id: string
  slug: string
  country_id: string
}

interface UserCity {
  role: 'admin' | 'operator'
  city: City
}

/**
 * Admin Dashboard - Main entry point for admin users
 *
 * This client component provides the main admin dashboard where users with
 * admin/operator roles can view and manage their assigned cities. Shows city
 * selector when user has access to multiple cities, and displays statistics
 * for the primary city.
 *
 * Features:
 * - Authentication check and redirect to login if unauthenticated
 * - City access validation via city_users table
 * - Statistics display (language count, user count)
 * - Navigation to city-specific admin pages
 *
 * @returns Admin dashboard JSX or loading/error state
 */
export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [userCities, setUserCities] = useState<UserCity[]>([])
  const [languageCount, setLanguageCount] = useState<number>(0)
  const [userCount, setUserCount] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()

  // Validate locale parameter
  const localeParam = params?.locale
  if (!localeParam || typeof localeParam !== 'string') {
    if (typeof window !== 'undefined') {
      router.push('/en/login')
    }
  }
  const locale = localeParam || 'en'

  useEffect(() => {
    let isMounted = true

    async function checkAuthAndLoadData() {
      try {
        const { createAuthClient } = await import('@/lib/auth/client')
        const supabase = createAuthClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          if (isMounted) {
            router.push('/en/login')
          }
          return
        }

        // Get user's accessible cities
        const { data: cities, error: citiesError } = await supabase
          .from('city_users')
          .select(`
            role,
            city:cities (
              id,
              slug,
              country_id
            )
          `)
          .eq('user_id', user.id)

        if (citiesError) {
          if (isMounted) {
            setError('Failed to load cities')
            setLoading(false)
          }
          return
        }

        if (!isMounted) return

        // Transform query result to UserCity array
        const transformedCities: UserCity[] = (cities as unknown as UserCity[]) || []
        setUserCities(transformedCities)

        // If user has no city access, stop here
        if (!cities || cities.length === 0) {
          setLoading(false)
          return
        }

        // Get stats for first city
        const firstCity = transformedCities[0].city

        // Get language count with error handling
        const { count: languages, error: langError } = await supabase
          .from('languages')
          .select('*', { count: 'exact', head: true })
          .eq('city_id', firstCity.id)

        if (langError) {
          if (isMounted) {
            setError('Failed to load statistics')
            setLoading(false)
          }
          return
        }

        if (!isMounted) return
        setLanguageCount(languages || 0)

        // Get user count for this city with error handling
        const { count: users, error: usersError } = await supabase
          .from('city_users')
          .select('*', { count: 'exact', head: true })
          .eq('city_id', firstCity.id)

        if (usersError) {
          if (isMounted) {
            setError('Failed to load statistics')
            setLoading(false)
          }
          return
        }

        if (!isMounted) return
        setUserCount(users || 0)
        setLoading(false)
      } catch (_err) { // eslint-disable-line @typescript-eslint/no-unused-vars
        if (isMounted) {
          setError('An unexpected error occurred')
          setLoading(false)
        }
      }
    }

    checkAuthAndLoadData()

    return () => {
      isMounted = false
    }
  }, [router, locale])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  // If user has no city access
  if (userCities.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            No cities assigned to your account yet
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>No City Access</CardTitle>
            <CardDescription>
              Contact a superuser to grant you access to cities
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const firstCity = userCities[0].city

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard ✅</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage users and settings for your assigned cities
        </p>
      </div>

      {/* City selector */}
      {userCities.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select City</CardTitle>
            <CardDescription>
              You have access to {userCities.length} cities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {userCities.map((userCity) => {
                const city = userCity.city
                return (
                  <div
                    key={city.id}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/${locale}/admin/${city.slug}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 capitalize">
                          {city.slug}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Role: {userCity.role}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick stats for primary city */}
      {firstCity && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Languages card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Languages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{languageCount}</div>
              <p className="text-xs text-gray-600 mt-1 capitalize">
                Total languages in {firstCity.slug}
              </p>
              <Button
                variant="link"
                className="p-0 mt-2 h-auto text-sm"
                onClick={() => router.push(`/${locale}/admin/${firstCity.slug}`)}
              >
                View city dashboard →
              </Button>
            </CardContent>
          </Card>

          {/* Users card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">City Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userCount}</div>
              <p className="text-xs text-gray-600 mt-1 capitalize">
                Users with access to {firstCity.slug}
              </p>
              <Button
                variant="link"
                className="p-0 mt-2 h-auto text-sm"
                onClick={() => router.push(`/${locale}/admin/${firstCity.slug}`)}
              >
                View city dashboard →
              </Button>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push(`/${locale}/admin/${firstCity.slug}`)}
              >
                <Users className="mr-2 h-4 w-4" />
                View City Dashboard
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push(`/${locale}/admin/${firstCity.slug}`)}
              >
                <Settings className="mr-2 h-4 w-4" />
                City Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Welcome message */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome to the Admin Panel</CardTitle>
          <CardDescription>
            As an administrator, you can manage users and configure settings for your assigned cities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Available Actions:</h3>
              <ul className="mt-2 list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Invite and manage users for your cities</li>
                <li>Configure city settings and branding</li>
                <li>Manage taxonomies and classifications</li>
                <li>Monitor language data and statistics</li>
                <li>Manage AI translation settings</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
