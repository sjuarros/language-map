/**
 * Admin Layout
 *
 * Layout for admin dashboard pages with authentication and role-based access control.
 * Admins can access multiple cities as granted via the city_users junction table.
 */

import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'
import { isAdmin } from '@/lib/auth/authorization'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const locale = await getLocale()

  // Initialize Supabase client
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

  return <>{children}</>
}
