/**
 * Superuser Dashboard
 *
 * Main dashboard page for superusers.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'

export default async function SuperuserDashboard() {
  const cookieStore = await cookies()

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

  const locale = await getLocale()

  // Get city count
  const { count: cityCount } = await supabase
    .from('cities')
    .select('*', { count: 'exact', head: true })

  // Get user count
  const { count: userCount } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Superuser Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage cities, users, and platform settings
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Cities card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cityCount || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              Active cities on the platform
            </p>
            <Link href={`/${locale}/superuser/cities`}>
              <Button variant="link" className="p-0 mt-2 h-auto text-sm">
                View all cities →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Users card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              Registered users across all cities
            </p>
            <Link href={`/${locale}/superuser/users`}>
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
            <Link href={`/${locale}/superuser/cities/new`}>
              <Button className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Add New City
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Welcome message */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome to the Superuser Panel</CardTitle>
          <CardDescription>
            As a superuser, you have full access to all platform features and data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Available Actions:</h3>
              <ul className="mt-2 list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Create and manage cities with multilingual support</li>
                <li>Manage users and assign roles</li>
                <li>Configure platform-wide settings</li>
                <li>Monitor platform usage and statistics</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
