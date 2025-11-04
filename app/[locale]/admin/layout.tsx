/**
 * Admin Layout
 *
 * Client-side layout with authentication check only.
 * Authorization (admin/superuser role check) is handled by each individual page.
 *
 * @module app/admin/layout
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname, useParams } from 'next/navigation'

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
  const citySlug = params?.citySlug as string | undefined

  useEffect(() => {
    async function checkAuth() {
      try {
        // If this is a city-specific admin route, skip auth here
        // The city-specific layout will handle authentication
        if (citySlug) {
          console.log('[Admin Layout] City-specific route detected, skipping auth in parent layout')
          setAuthorized(true)
          setLoading(false)
          return
        }

        // Extract locale from pathname - only accept valid locales
        const validLocales = ['en', 'nl', 'fr']
        const pathParts = pathname?.split('/').filter(Boolean) || []
        console.log('[Admin Layout] Pathname:', pathname, 'Path parts:', pathParts)

        // For routes like /fr/admin, pathParts would be ['fr', 'admin']
        const locale = validLocales.includes(pathParts[0]) ? pathParts[0] : 'en'
        console.log('[Admin Layout] Using locale:', locale)

        const { createAuthClient } = await import('@/lib/auth/client')
        const supabase = createAuthClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        console.log('[Admin Layout] Auth check:', { hasUser: !!user, email: user?.email, error: authError?.message })

        if (authError || !user) {
          console.log('[Admin Layout] No user, redirecting to login')
          router.push(`/${locale}/login`)
          return
        }

        // Check if user is admin or superuser
        const { data: userData, error: roleError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        console.log('[Admin Layout] Role check:', { role: userData?.role, error: roleError?.message })

        if (roleError || !userData) {
          console.error('[Admin Layout] Error fetching user role:', roleError)
          router.push(`/${locale}/login`)
          return
        }

        // Verify user has admin or superuser permissions
        const userRole = userData.role
        const isAdmin = userRole === 'admin' || userRole === 'superuser'

        if (!isAdmin) {
          console.log('[Admin Layout] User does not have admin permissions:', userRole)
          router.push(`/${locale}/login`)
          return
        }

        // User is authorized
        console.log('[Admin Layout] User authorized:', { email: user.email, role: userRole })
        setAuthorized(true)
        setLoading(false)
      } catch (err) {
        console.error('[Admin Layout] Unexpected error:', err)
        // Default to 'en' in case of error
        router.push('/en/login')
      }
    }

    checkAuth()
  }, [router, pathname])

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
