/**
 * Superuser Layout
 *
 * Layout for superuser dashboard pages with authentication check only.
 * Authorization (superuser role check) is handled by each individual page.
 *
 * NOTE: Uses Client Components because Server Components cannot access
 * cookies set by external libraries (like Supabase's sb-auth-token).
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from '@/components/auth/logout-button'

export default function SuperuserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Extract locale from pathname (e.g., /en/superuser -> en)
  const locale = pathname?.split('/')[1] || 'en'

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
          router.push(`/${locale}/login?redirectTo=/superuser`)
          return
        }

        // User is authenticated - let the page handle authorization
        setAuthorized(true)
        setLoading(false)
      } catch (err) {
        console.error('[Superuser Layout] Error:', err)
        router.push(`/${locale}/login?redirectTo=/superuser`)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href={`/${locale}/superuser`} className="text-xl font-bold text-gray-900">
                Language Map - Superuser
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link
                href={`/${locale}/superuser`}
                className="text-gray-900 hover:text-gray-600 px-3 py-2 text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href={`/${locale}/superuser/cities`}
                className="text-gray-900 hover:text-gray-600 px-3 py-2 text-sm font-medium"
              >
                Cities
              </Link>
            </nav>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
