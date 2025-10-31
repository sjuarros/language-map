/**
 * City-Specific Admin Dashboard
 *
 * Dashboard for managing a specific city with statistics and quick actions.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, BarChart3, Languages, Settings } from 'lucide-react'

export default async function CityAdminPage({
  params,
}: {
  params: Promise<{ citySlug: string }>
}) {
  const cookieStore = await cookies()
  const { citySlug } = await params

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

  // Get city information
  const { data: city } = await supabase
    .from('cities')
    .select('id, name, country')
    .eq('slug', citySlug)
    .single()

  if (!city) {
    return null
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get stats for this city
  const [languageCount, userCount, descriptionCount] = await Promise.all([
    // Language count
    supabase
      .from('languages')
      .select('*', { count: 'exact', head: true })
      .eq('city_id', city.id)
      .then(({ count }) => count || 0),

    // User count for this city
    supabase
      .from('city_users')
      .select('*', { count: 'exact', head: true })
      .eq('city_id', city.id)
      .then(({ count }) => count || 0),

    // Description count
    supabase
      .from('descriptions')
      .select('*', { count: 'exact', head: true })
      .eq('city_id', city.id)
      .then(({ count }) => count || 0),
  ])

  // Get recent users
  const { data: recentUsers } = await supabase
    .from('city_users')
    .select(`
      role,
      created_at,
      user:user_profiles (
        email,
        full_name
      )
    `)
    .eq('city_id', city.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      {/* City overview */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{city.name}</h2>
        <p className="mt-1 text-sm text-gray-600">
          {city.country} • Manage users, settings, and data
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
              Common administrative tasks for {city.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/admin/${citySlug}/users/invite`}>
              <Button className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Invite New Users
              </Button>
            </Link>
            <Link href={`/admin/${citySlug}/settings`}>
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
              Latest user additions to {city.name}
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
                <Link href={`/admin/${citySlug}/users`}>
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
