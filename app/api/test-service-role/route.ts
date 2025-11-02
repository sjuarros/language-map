/**
 * Test endpoint to verify service role client works
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // Create service role client (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Test query
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, role, is_active')
      .eq('id', '05a7f234-72b1-46d1-b09c-8e3db9eeaa27')
      .single()

    return NextResponse.json({
      success: !error,
      data,
      error: error?.message,
      serviceRoleKeyAvailable: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
