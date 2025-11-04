'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export default function OperatorDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    async function getUser() {
      try {
        const { createAuthClient } = await import('@/lib/auth/client')
        const supabase = createAuthClient()

        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
          if (isMounted) {
            router.push('/en/login')
          }
          return
        }

        if (!isMounted) return
        setUser(user)
        setLoading(false)
      } catch (_err) { // eslint-disable-line @typescript-eslint/no-unused-vars
        if (isMounted) {
          router.push('/en/login')
        }
      }
    }

    getUser()

    return () => {
      isMounted = false
    }
  }, [router])

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Operator Dashboard</h1>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
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
