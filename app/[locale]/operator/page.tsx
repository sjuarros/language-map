'use client'

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'

export default function OperatorDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUser() {
      try {
        const { createAuthClient } = await import('@/lib/auth/client')
        const supabase = createAuthClient()

        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        setLoading(false)
      } catch (err) {
        console.error('[Operator] Error getting user:', err)
        setLoading(false)
      }
    }

    getUser()
  }, [])

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
