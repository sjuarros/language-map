'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  authorized: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  authorized: false,
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const { createAuthClient } = await import('@/lib/auth/client')
        const supabase = createAuthClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        console.log('[Auth Context] Auth check:', { hasUser: !!user, email: user?.email })

        if (authError || !user) {
          console.log('[Auth Context] No user')
          setUser(null)
          setAuthorized(false)
          setLoading(false)
          return
        }

        const { data: userData, error: roleError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (roleError || !userData) {
          console.error('[Auth Context] Error fetching user role:', roleError)
          setUser(null)
          setAuthorized(false)
          setLoading(false)
          return
        }

        const { isOperator } = await import('@/lib/auth/authorization')
        const hasAccess = isOperator(userData.role)

        if (!hasAccess) {
          console.log('[Auth Context] User does not have operator permissions:', userData.role)
          setUser(null)
          setAuthorized(false)
          setLoading(false)
          return
        }

        console.log('[Auth Context] User authorized:', { email: user.email, role: userData.role })
        setUser(user)
        setAuthorized(true)
        setLoading(false)
      } catch (err) {
        console.error('[Auth Context] Error:', err)
        setUser(null)
        setAuthorized(false)
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, authorized }}>
      {children}
    </AuthContext.Provider>
  )
}
