/**
 * @file layout.tsx
 * @description Operator dashboard layout with authentication and role checking.
 * Only operators, admins, and superusers can access this layout.
 *
 * NOTE: Uses Client Components because Server Components cannot access
 * cookies set by external libraries (like Supabase's sb-auth-token).
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from '@/components/auth/logout-button'
import { isOperator } from '@/lib/auth/authorization'

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Extract locale from pathname (e.g., /en/operator -> en)
  const locale = pathname?.split('/')[1] || 'en'

  useEffect(() => {
    async function checkAuth() {
      try {
        const { createAuthClient } = await import('@/lib/auth/client')
        const supabase = createAuthClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        console.log('[Operator Layout] Auth check:', { hasUser: !!user, email: user?.email })

        if (authError || !user) {
          console.log('[Operator Layout] No user, redirecting to login')
          router.push(`/${locale}/login?redirectTo=/operator`)
          return
        }

        // Check if user is operator, admin, or superuser
        const { data: userData, error: roleError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        console.log('[Operator Layout] Role check:', { role: userData?.role, error: roleError?.message })

        if (roleError || !userData) {
          console.error('[Operator Layout] Error fetching user role:', roleError)
          router.push(`/${locale}/`)
          return
        }

        // Verify user has operator permissions or higher
        const userRole = userData.role
        const hasAccess = isOperator(userRole)

        if (!hasAccess) {
          console.log('[Operator Layout] User does not have operator permissions:', userRole)
          router.push(`/${locale}/`)
          return
        }

        // User is authorized
        console.log('[Operator Layout] User authorized:', { email: user.email, role: userRole })
        setAuthorized(true)
        setLoading(false)
      } catch (err) {
        console.error('[Operator Layout] Error:', err)
        router.push(`/${locale}/login?redirectTo=/operator`)
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
              <Link href={`/${locale}/operator`} className="text-xl font-bold text-gray-900">
                Language Map - Operator
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link
                href={`/${locale}/operator`}
                className="text-gray-900 hover:text-gray-600 px-3 py-2 text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href={`/${locale}/operator/amsterdam`}
                className="text-gray-900 hover:text-gray-600 px-3 py-2 text-sm font-medium"
              >
                Amsterdam
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
