/**
 * Superuser Layout
 *
 * Client-side layout with authentication check only.
 * Authorization (superuser role check) is handled by each individual page.
 *
 * @module app/superuser/layout
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function SuperuserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Extract locale from pathname - only accept valid locales
  const validLocales = ['en', 'nl', 'fr']
  const pathParts = pathname?.split('/').filter(Boolean) || []
  // For routes like /fr/admin, pathParts would be ['fr', 'admin']
  const locale = validLocales.includes(pathParts[0]) ? pathParts[0] : 'en'

  useEffect(() => {
    async function checkAuth() {
      try {
        const { createAuthClient } = await import('@/lib/auth/client')
        const supabase = createAuthClient()

        // Check authentication only - authorization is handled by individual pages
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        console.log('[Superuser Layout] Auth check:', { hasUser: !!user, email: user?.email })

        if (authError || !user) {
          console.log('[Superuser Layout] No user, redirecting to login')
          router.push(`/${locale}/login`)
          return
        }

        // User is authenticated - let the page handle authorization
        setAuthorized(true)
        setLoading(false)
      } catch (err) {
        console.error('[Superuser Layout] Error:', err)
        router.push(`/${locale}/login`)
      }
    }

    checkAuth()
  }, [router, locale])

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

