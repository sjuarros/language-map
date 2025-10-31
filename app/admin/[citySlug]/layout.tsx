/**
 * City-Specific Admin Layout
 *
 * Layout for admin pages specific to a particular city.
 * Validates that the user has access to this city via the city_users table.
 */

import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'
import { isAdmin } from '@/lib/auth/authorization'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building, Users, Settings } from 'lucide-react'

export default async function CityAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ citySlug: string }>
}) {
  const cookieStore = await cookies()
  const locale = await getLocale()
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

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect(`/${locale}/login`)
  }

  // Get user profile with role
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Check if user is admin or superuser
  if (!isAdmin(userProfile?.role)) {
    redirect(`/${locale}/`)
  }

  // Get city and verify access
  const { data: city } = await supabase
    .from('cities')
    .select('id, slug, name')
    .eq('slug', citySlug)
    .single()

  if (!city) {
    redirect(`/${locale}/admin`)
  }

  // Check if user has access to this city
  const { data: cityAccess } = await supabase
    .from('city_users')
    .select('role')
    .eq('city_id', city.id)
    .eq('user_id', user.id)
    .single()

  // Superusers bypass city access check
  const { data: userProfileForSuperuserCheck } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isSuperuser = userProfileForSuperuserCheck?.role === 'superuser'

  if (!cityAccess && !isSuperuser) {
    redirect(`/${locale}/admin`)
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
