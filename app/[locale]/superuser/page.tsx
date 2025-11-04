/**
 * Superuser Dashboard
 *
 * Main dashboard page for superusers.
 *
 * NOTE: Uses Client Components because Server Components cannot access
 * cookies set by external libraries (like Supabase's sb-auth-token).
 *
 * NOTE: Authentication is handled by the layout (SuperuserLayout).
 * This page only loads data.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

export default function SuperuserDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [cityCount, setCityCount] = useState(0)
  const [userCount, setUserCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const { createAuthClient } = await import('@/lib/auth/client')
        const supabase = createAuthClient()

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        // Get city count
        const { count: cities } = await supabase
          .from('cities')
          .select('*', { count: 'exact', head: true })

        setCityCount(cities || 0)

        // Get user count
        const { count: users } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })

        setUserCount(users || 0)

        setIsLoading(false)
      } catch (error) {
        console.error('[Superuser] Error loading data:', error)
        setError('An unexpected error occurred')
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Superuser Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Superuser Dashboard</h1>
          <p className="mt-2 text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Auth check component - runs before render */}
      <AuthCheck onAuthenticated={handleAuthenticated} />

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Superuser Dashboard ✅</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage cities, users, and platform settings
        </p>
        <p className="mt-2 text-xs text-gray-500">
          User: {user?.email} • Time: {new Date().toLocaleString()}
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
            <Link href={`/en/superuser/cities`}>
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
            <Link href={`/en/superuser/users`}>
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
            <Link href={`/en/superuser/cities/new`}>
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
