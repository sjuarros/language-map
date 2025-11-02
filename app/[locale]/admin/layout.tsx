/**
 * Admin Layout
 *
 * Layout for admin dashboard pages with authentication check only.
 * Authorization (admin/superuser role check) is handled by each individual page.
 *
 * NOTE: Uses Client Components because Server Components cannot access
 * cookies set by external libraries (like Supabase's sb-auth-token).
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        const { createAuthClient } = await import('@/lib/auth/client')
        const supabase = createAuthClient()

        // Check authentication only - authorization is handled by individual pages
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        console.log('[Admin Layout] Auth check:', { hasUser: !!user, email: user?.email })

        if (authError || !user) {
          console.log('[Admin Layout] No user, redirecting to login')
          router.push('/en/login')
          return
        }

        // User is authenticated - let the page handle authorization
        setAuthorized(true)
        setLoading(false)
      } catch (err) {
        console.error('[Admin Layout] Error:', err)
        router.push('/en/login')
      }
    }

    checkAuth()
  }, [router])

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
