'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export default function OperatorDashboard() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      console.log('[Operator] Starting auth check')
      try {
        // Import dynamically to avoid SSR issues
        const { createAuthClient } = await import('@/lib/auth/client')
        console.log('[Operator] Imported createAuthClient')

        const supabase = createAuthClient()
        console.log('[Operator] Created supabase client')

        const { data: { user }, error } = await supabase.auth.getUser()
        console.log('[Operator] Auth result:', { hasUser: !!user, email: user?.email, error: error?.message })

        if (error || !user) {
          console.log('[Operator] No user, redirecting to login')
          router.push('/en/login')
          return
        }

        setUser(user)
        setLoading(false)
      } catch (err) {
        console.error('[Operator] Error:', err)
        router.push('/en/login')
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Operator Dashboard</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Operator Dashboard ✅</h1>
      <p>User: {user?.email}</p>
      <p>User ID: {user?.id}</p>
      <p>Status: Authenticated successfully!</p>
      <p>Time: {new Date().toLocaleString()}</p>
    </div>
  )
}
