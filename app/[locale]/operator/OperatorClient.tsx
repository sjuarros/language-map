'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAuthClient } from '@/lib/auth/client'

export default function OperatorClient() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createAuthClient()

        const { data: { user }, error } = await supabase.auth.getUser()

        console.log('[Operator Client] Auth check:', {
          hasUser: !!user,
          email: user?.email,
          error: error?.message
        })

        if (error || !user) {
          console.log('[Operator Client] No user, redirecting to login')
          router.push('/en/login')
          return
        }

        setUser(user)
        setLoading(false)
      } catch (err) {
        console.error('[Operator Client] Auth error:', err)
        router.push('/en/login')
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Loading...</h1>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Operator Dashboard ✅</h1>
      <p>User: {user?.email}</p>
      <p>Status: Authenticated</p>
      <p>User ID: {user?.id}</p>
    </div>
  )
}
