import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET() {
  const cookieStore = await cookies()

  // Get all cookies
  const allCookies = cookieStore.getAll()

  // Get the auth cookie
  const authCookie = cookieStore.get('sb-auth-token')

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get('sb-auth-token')?.value
        },
        set() {},
        remove() {},
      },
    }
  )

  // Try to get user
  const { data: { user }, error } = await supabase.auth.getUser()

  return NextResponse.json({
    allCookies: allCookies.map(c => ({ name: c.name, length: c.value.length })),
    hasAuthCookie: !!authCookie,
    authCookieLength: authCookie?.value.length,
    hasUser: !!user,
    userEmail: user?.email,
    userId: user?.id,
    error: error?.message,
  })
}
