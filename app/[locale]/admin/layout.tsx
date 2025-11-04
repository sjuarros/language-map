/**
 * @file app/[locale]/admin/layout.tsx
 * @description Client-side layout component for admin pages with authentication checks
 *
 * This layout component:
 * - Handles authentication for admin routes (main dashboard and city-specific pages)
 * - Checks if user is logged in and has admin or superuser role
 * - Redirects unauthorized users to login page
 * - Skips auth for city-specific routes (delegated to child layout)
 *
 * Architecture Note:
 * This uses client-side authentication because:
 * 1. It needs to handle client-side navigation with router.push()
 * 2. City-specific admin pages are client components
 * 3. Supabase auth integrates best with client-side pattern
 * 4. Server-side auth would break the multi-city navigation flow
 *
 * @module app/admin/layout
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname, useParams } from 'next/navigation'

/**
 * Admin layout component that handles authentication for admin routes.
 *
 * This client component:
 * - Verifies user is authenticated
 * - Checks user has admin or superuser role
 * - Redirects to login if unauthorized
 * - Renders loading state during auth check
 * - Delegates auth to child layout for city-specific routes
 *
 * @param children - Child components to render if authenticated
 * @returns JSX element with loading state, unauthorized redirect, or children
 * @throws Never - handles all errors internally with redirects
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()

  // Validate citySlug type safely
  const citySlug = typeof params?.citySlug === 'string' ? params.citySlug : undefined

  /**
   * Checks authentication and authorization for admin access.
   *
   * Flow:
   * 1. If city-specific route, skip (child layout handles it)
   * 2. Extract locale from URL
   * 3. Check Supabase authentication
   * 4. Verify user has admin/superuser role
   * 5. Redirect to login if any check fails
   * 6. Set authorized=true if all checks pass
   *
   * @returns Promise<void>
   */
  useEffect(() => {
    async function checkAuth() {
      try {
        // If this is a city-specific admin route, skip auth here
        // The city-specific layout will handle authentication
        if (citySlug) {
          setAuthorized(true)
          setLoading(false)
          return
        }

        // Extract locale from pathname - only accept valid locales
        const validLocales = ['en', 'nl', 'fr']
        const pathParts = pathname?.split('/').filter(Boolean) || []

        // For routes like /fr/admin, pathParts would be ['fr', 'admin']
        const locale = validLocales.includes(pathParts[0]) ? pathParts[0] : 'en'

        const { createAuthClient } = await import('@/lib/auth/client')
        const supabase = createAuthClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          router.push(`/${locale}/login`)
          return
        }

        // Check if user is admin or superuser
        const { data: userData, error: roleError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (roleError || !userData) {
          router.push(`/${locale}/login`)
          return
        }

        // Verify user has admin or superuser permissions
        const userRole = userData.role
        const isAdmin = userRole === 'admin' || userRole === 'superuser'

        if (!isAdmin) {
          router.push(`/${locale}/login`)
          return
        }

        // User is authorized
        setAuthorized(true)
        setLoading(false)
      } catch (_err) { // eslint-disable-line @typescript-eslint/no-unused-vars
        // Default to 'en' in case of error
        router.push('/en/login')
      }
    }

    checkAuth()
  }, [router, pathname, citySlug])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900">Loading...</div>
          <p className="mt-2 text-sm text-gray-600">Checking authentication</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return <>{children}</>
}
