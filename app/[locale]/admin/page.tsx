/**
 * Admin Dashboard
 *
 * Main dashboard for admin users with city selector and overview statistics.
 * Admins can access multiple cities based on their grants in the city_users table.
 *
 * NOTE: Uses Client Components because Server Components cannot access
 * cookies set by external libraries (like Supabase's sb-auth-token).
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userCities, setUserCities] = useState<UserCity[]>([])
  const [languageCount, setLanguageCount] = useState(0)
  const [userCount, setUserCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkAuthAndLoadData() {
      try {
        console.log('[Admin] Starting auth check')
        console.log('[Admin] Cookies:', document.cookie)
        const { createAuthClient } = await import('@/lib/auth/client')
        const supabase = createAuthClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        console.log('[Admin] Auth result:', { hasUser: !!user, email: user?.email, userId: user?.id, error: authError?.message })

        if (authError || !user) {
          console.log('[Admin] No user, redirecting to login')
          router.push('/en/login')
          return
        }

        setUser(user)

        // Get user's accessible cities
        console.log('[Admin] Querying city_users for user:', user.id)
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

        console.log('[Admin] City query result:', { cities, error: citiesError })

        if (citiesError) {
          console.error('[Admin] Error fetching cities:', citiesError)
          setError('Failed to load cities')
          setLoading(false)
          return
        }

        setUserCities(cities || [])

        // If user has no city access, stop here
        if (!cities || cities.length === 0) {
          setLoading(false)
          return
        }

        // Get stats for first city
        const firstCity = cities[0].city as City

        // Get language count
        const { count: languages } = await supabase
          .from('languages')
          .select('*', { count: 'exact', head: true })
          .eq('city_id', firstCity.id)

        setLanguageCount(languages || 0)

        // Get user count for this city
        const { count: users } = await supabase
          .from('city_users')
          .select('*', { count: 'exact', head: true })
          .eq('city_id', firstCity.id)

        setUserCount(users || 0)

        setLoading(false)
      } catch (err) {
        console.error('[Admin] Error:', err)
        setError('An unexpected error occurred')
        setLoading(false)
      }
    }

    checkAuthAndLoadData()
  }, [router])

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
        <p className="mt-2 text-xs text-gray-500">
          User: {user?.email} • Time: {new Date().toLocaleString()}
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
                  <Link
                    key={city.id}
                    href={`/en/admin/${city.slug}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
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
                  </Link>
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
              <Link href={`/en/admin/${firstCity.slug}/languages`}>
                <Button variant="link" className="p-0 mt-2 h-auto text-sm">
                  View languages →
                </Button>
              </Link>
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
              <Link href={`/en/admin/${firstCity.slug}/users`}>
                <Button variant="link" className="p-0 mt-2 h-auto text-sm">
                  Manage users →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/en/admin/${firstCity.slug}/users/invite`}>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Invite Users
                </Button>
              </Link>
              <Link href={`/en/admin/${firstCity.slug}/settings`}>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  City Settings
                </Button>
              </Link>
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
