/**
 * Operator Layout
 *
 * Client-side layout with authentication and role checking.
 * Only operators, admins, and superusers can access this layout.
 *
 * @module app/operator/layout
 */

'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/auth/AuthContext'

function OperatorLayoutInner({
  children,
}: {
  children: React.ReactNode
}) {
  const { loading, authorized } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Extract locale from pathname - only accept valid locales
  const validLocales = ['en', 'nl', 'fr']
  const pathParts = pathname?.split('/').filter(Boolean) || []
  // For routes like /fr/admin, pathParts would be ['fr', 'admin']
  const locale = validLocales.includes(pathParts[0]) ? pathParts[0] : 'en'

  useEffect(() => {
    // If not loading and not authorized, redirect to login
    if (!loading && !authorized) {
      console.log('[Operator Layout] Not authorized, redirecting to login')
      router.push(`/${locale}/login`)
    }
  }, [loading, authorized, router, locale])

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

  // Render children - they can access user via useAuth()
  return <>{children}</>
}

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <OperatorLayoutInner>{children}</OperatorLayoutInner>
    </AuthProvider>
  )
}


