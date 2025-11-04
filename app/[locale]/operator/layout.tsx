/**
 * Operator Layout
 *
 * Client-side layout with authentication and role checking.
 * Only operators, admins, and superusers can access this layout.
 *
 * @module app/operator/layout
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
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

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        console.log('[Operator Layout] Auth check:', { hasUser: !!user, email: user?.email })

        if (authError || !user) {
          console.log('[Operator Layout] No user, redirecting to login')
          router.push(`/${locale}/login`)
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
          router.push(`/${locale}/login`)
          return
        }

        // Verify user has operator permissions or higher
        const userRole = userData.role
        const hasAccess = isOperator(userRole)

        if (!hasAccess) {
          console.log('[Operator Layout] User does not have operator permissions:', userRole)
          router.push(`/${locale}/login`)
          return
        }

        // User is authorized
        console.log('[Operator Layout] User authorized:', { email: user.email, role: userRole })
        setAuthorized(true)
        setLoading(false)
      } catch (err) {
        console.error('[Operator Layout] Error:', err)
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

