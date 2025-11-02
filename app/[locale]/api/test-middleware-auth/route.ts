import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  // Parse the URL to get the pathname
  const url = new URL(request.url)
  const pathname = url.pathname

  console.log('[Test-Middleware] Path:', pathname)

  // Create Supabase client exactly like middleware does
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          console.log('[Test-Middleware] Supabase requesting cookie:', name)
          const cookieHeader = request.headers.get('cookie') || ''
          console.log('[Test-Middleware] Raw cookies length:', cookieHeader.length)
          // Extract sb-auth-token from cookie header
          const match = cookieHeader.match(/sb-auth-token=([^;]+)/)
          const value = match ? match[1] : null
          console.log('[Test-Middleware] Returning sb-auth-token:', value ? 'found' : 'not found')
          return value
        },
        set() {},
        remove() {},
      },
    }
  )

  // Check auth exactly like middleware
  const { data: { user }, error } = await supabase.auth.getUser()

  console.log('[Test-Middleware] Auth result:', {
    hasUser: !!user,
    userEmail: user?.email,
    userId: user?.id,
    error: error?.message
  })

  // Now test profile check like middleware does
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('role, is_active')
    .eq('id', user?.id)
    .single()

  console.log('[Test-Middleware] Profile result:', {
    userId: user?.id,
    profile,
    profileError,
    hasProfile: !!profile,
    isActive: profile?.is_active
  })

  return NextResponse.json({
    pathname,
    auth: {
      hasUser: !!user,
      userEmail: user?.email,
      userId: user?.id,
      error: error?.message,
    },
    profile: {
      role: profile?.role,
      isActive: profile?.is_active,
      profileError: profileError?.message,
    },
    env: {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
  })
}
