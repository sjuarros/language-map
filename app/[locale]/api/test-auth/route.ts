import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  const cookieStore = await cookies()

  // Get all cookies
  const allCookies = cookieStore.getAll()

  // Get the auth cookie
  const authCookie = cookieStore.get('sb-auth-token')

  // Get raw cookies from request headers
  const rawCookies = request.headers.get('cookie') || ''
  console.log('[Test API] Raw cookies from header:', rawCookies.substring(0, 100))

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          console.log('[Test API] Supabase requesting cookie:', name)
          const value = cookieStore.get('sb-auth-token')?.value
          console.log('[Test API] Returning sb-auth-token:', value ? 'found' : 'not found')
          return value
        },
        set() {},
        remove() {},
      },
    }
  )

  // Try to get user
  const { data: { user }, error } = await supabase.auth.getUser()

  // Check environment
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET'

  return NextResponse.json({
    allCookies: allCookies.map(c => ({ name: c.name, length: c.value.length })),
    rawCookieLength: rawCookies.length,
    hasAuthCookie: !!authCookie,
    authCookieLength: authCookie?.value.length,
    hasUser: !!user,
    userEmail: user?.email,
    userId: user?.id,
    error: error?.message,
    env: {
      hasUrl,
      hasAnonKey,
      supabaseUrl,
    }
  })
}
