/**
 * City-Specific Admin Dashboard
 *
 * Dashboard for managing a specific city with statistics and quick actions.
 *
 * This component displays:
 * - City overview and statistics (languages, users, descriptions, data quality)
 * - Quick actions for common administrative tasks
 * - Recent user activity for the city
 *
 * NOTE: Uses Client Components for consistent authentication.
 * NOTE: Authentication and authorization are handled by the parent layout component.
 *
 * @async
 * @returns The rendered admin dashboard for a specific city
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, BarChart3, Languages, Settings } from 'lucide-react'

interface City {
  id: string
  slug: string
  translations?: {
    name?: string
  }
}

interface RecentUser {
  role: string
  created_at: string
  user: {
    email?: string
    full_name?: string
  } | null
}

export default function CityAdminPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [city, setCity] = useState<City | null>(null)
  const [languageCount, setLanguageCount] = useState(0)
  const [userCount, setUserCount] = useState(0)
  const [descriptionCount, setDescriptionCount] = useState(0)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const router = useRouter()
  const params = useParams()

  // Input validation
  const citySlug = params?.citySlug as string
  const locale = (params?.locale as string) || 'en'

  useEffect(() => {
    let isMounted = true

    async function loadCityData() {
      // Validate citySlug inside useEffect (after hooks)
      if (!citySlug) {
        return
      }

      try {
        // Clear previous errors
        setError(null)

        // Get database client for client-side queries
        // For client components, we use createAuthClient which connects to the database
        // with the user's authentication session
        const { createAuthClient } = await import('@/lib/auth/client')
        const supabase = createAuthClient()

        // Get city information
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

        if (cityError || !cityData) {
          const errorMsg = cityError?.message || 'City not found'
          const error = new Error(`Failed to load city: ${errorMsg}`)
          if (isMounted) {
            setError(error)
            setLoading(false)
          }
          return
        }

        // Validate city data structure
        if (!cityData.id || !cityData.slug) {
          const error = new Error('Invalid city data structure received')
          if (isMounted) {
            setError(error)
            setLoading(false)
          }
          return
        }

        // Extract city name from translations (translations is an array from the join)
        const cityWithName: City = {
          id: cityData.id,
          slug: cityData.slug,
          translations: cityData.translations?.[0] ? { name: cityData.translations[0].name } : { name: cityData.slug }
        }

        if (!isMounted) return
        setCity(cityWithName)

        // Get stats for this city
        const [languageResult, userResult, descriptionResult] = await Promise.all([
          // Language count
          supabase
            .from('languages')
            .select('*', { count: 'exact', head: true })
            .eq('city_id', cityData.id),

          // User count for this city
          supabase
            .from('city_users')
            .select('*', { count: 'exact', head: true })
            .eq('city_id', cityData.id),

          // Description count
          supabase
            .from('descriptions')
            .select('*', { count: 'exact', head: true })
            .eq('city_id', cityData.id),
        ])

        if (!isMounted) return

        setLanguageCount(languageResult.count || 0)
        setUserCount(userResult.count || 0)
        setDescriptionCount(descriptionResult.count || 0)

        // Get recent users
        const { data: usersData } = await supabase
          .from('city_users')
          .select(`
            role,
            created_at,
            user:user_profiles (
              email,
              full_name
            )
          `)
          .eq('city_id', cityData.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (!isMounted) return

        // Validate and map user data (cast user field from potential array to object)
        const validatedUsers: RecentUser[] = (usersData || []).map(item => ({
          role: item?.role || 'unknown',
          created_at: item?.created_at || new Date().toISOString(),
          user: (item?.user as { email?: string; full_name?: string } | null) || null
        }))

        setRecentUsers(validatedUsers)

        if (isMounted) {
          setLoading(false)
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An unknown error occurred')
        if (isMounted) {
          setError(error)
          setLoading(false)
        }
      }
    }

    if (citySlug) {
      loadCityData()
    }

    return () => {
      isMounted = false
    }
  }, [citySlug, locale])

  // Validate citySlug after useEffect
  if (!citySlug) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-lg font-medium text-red-600">Invalid Request</div>
          <p className="mt-2 text-sm text-gray-600">City parameter is missing</p>
          <Button
            onClick={() => router.push('/en/admin')}
            className="mt-4"
            variant="outline"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-lg font-medium text-gray-900">Loading city data...</div>
          <p className="mt-2 text-sm text-gray-600">Fetching statistics and recent activity</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-lg font-medium text-red-600">Error Loading Dashboard</div>
          <p className="mt-2 text-sm text-gray-600">{error.message}</p>
          <div className="mt-4 space-x-2">
            <Button
              onClick={() => {
                setError(null)
                setLoading(true)
                // Trigger reload
                window.location.reload()
              }}
              variant="outline"
            >
              Retry
            </Button>
            <Button
              onClick={() => router.push('/en/admin')}
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!city) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-lg font-medium text-red-600">City not found</div>
          <p className="mt-2 text-sm text-gray-600">Unable to load city data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* City overview */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{city.translations?.name || city.slug}</h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage users, settings, and data
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Languages</CardTitle>
            <Languages className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{languageCount}</div>
            <p className="text-xs text-gray-600 mt-1">Total languages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">City Users</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
            <p className="text-xs text-gray-600 mt-1">Users with access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descriptions</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{descriptionCount}</div>
            <p className="text-xs text-gray-600 mt-1">Community stories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {languageCount > 0
                ? Math.round((descriptionCount / languageCount) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-gray-600 mt-1">Languages with descriptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks for {city.translations?.name || city.slug}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/${locale}/admin/${citySlug}/users/invite`}>
              <Button className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Invite New Users
              </Button>
            </Link>
            <Link href={`/${locale}/admin/${citySlug}/settings`}>
              <Button className="w-full justify-start" variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                City Settings
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest user additions to {city.translations?.name || city.slug}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentUsers && recentUsers.length > 0 ? (
              <div className="space-y-3">
                {recentUsers.map((item, index) => {
                  const user = item.user as { email?: string; full_name?: string } | null
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user?.full_name || user?.email || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-600">
                          Role: {item.role} • {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <Link href={`/${locale}/admin/${citySlug}/users`}>
                  <Button variant="link" className="p-0 mt-2 h-auto text-sm">
                    View all users →
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
