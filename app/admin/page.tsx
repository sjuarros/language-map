/**
 * Admin Dashboard
 *
 * Main dashboard for admin users with city selector and overview statistics.
 * Admins can access multiple cities based on their grants in the city_users table.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Settings } from 'lucide-react'

export default async function AdminDashboard() {
  const cookieStore = await cookies()
  const locale = await getLocale()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Cookie set operation failed:', error)
            }
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Cookie remove operation failed:', error)
            }
          }
        },
      },
    }
  )

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get user's accessible cities via city_users junction table
  const { data: userCities } = await supabase
    .from('city_users')
    .select(`
      role,
      city:cities (
        id,
        slug,
        name,
        country
      )
    `)
    .eq('user_id', user.id)

  // If user has no city access, show message
  if (!userCities || userCities.length === 0) {
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

  // Get stats for accessible cities (using first city as default)
  const firstCity = userCities[0].city as unknown as {
    id: string
    slug: string
    name: string
    country: string
  }
  let languageCount = 0
  let userCount = 0

  if (firstCity) {
    // Get language count
    const { count: languages } = await supabase
      .from('languages')
      .select('*', { count: 'exact', head: true })
      .eq('city_id', firstCity.id)

    languageCount = languages || 0

    // Get user count for this city
    const { count: users } = await supabase
      .from('city_users')
      .select('*', { count: 'exact', head: true })
      .eq('city_id', firstCity.id)

    userCount = users || 0
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
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
                const city = userCity.city as unknown as {
                  id: string
                  slug: string
                  name: string
                  country: string
                }
                return (
                  <Link
                    key={city.id}
                    href={`/${locale}/admin/${city.slug}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {city.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {city.country} • Role: {userCity.role}
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
              <p className="text-xs text-gray-600 mt-1">
                Total languages in {firstCity.name}
              </p>
              <Link href={`/${locale}/admin/${firstCity.slug}/languages`}>
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
              <p className="text-xs text-gray-600 mt-1">
                Users with access to {firstCity.name}
              </p>
              <Link href={`/${locale}/admin/${firstCity.slug}/users`}>
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
              <Link href={`/${locale}/admin/${firstCity.slug}/users/invite`}>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Invite Users
                </Button>
              </Link>
              <Link href={`/${locale}/admin/${firstCity.slug}/settings`}>
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
