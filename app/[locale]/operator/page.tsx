'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthContext'

interface City {
  id: string
  slug: string
  name: string
  role: string
}

export default function OperatorDashboard() {
  const { user, loading: authLoading } = useAuth()
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true) // For fetching cities data
  const pathname = usePathname()

  // Extract locale from pathname
  const pathSegments = pathname?.split('/').filter(Boolean) || []
  const currentLocale = pathSegments[0] || 'en'

  useEffect(() => {
    console.log('[Operator Page] Auth state:', { hasUser: !!user, authLoading })
    // Only fetch cities if we have a user and auth is complete
    if (user && !authLoading) {
      fetchCities(user)
    }
  }, [user, authLoading])

  async function fetchCities(userToFetch: User) {
    try {
      const { createAuthClient } = await import('@/lib/auth/client')
      const supabase = createAuthClient()

      // Get cities user has access to
      const { data: citiesData, error: citiesError } = await supabase
        .from('city_users')
        .select(`
          role,
          city_id,
          cities (
            id,
            slug,
            city_translations!inner (
              name,
              locale_code
            )
          )
        `)
        .eq('user_id', userToFetch.id)

      if (citiesError) {
        console.error('Error fetching cities:', citiesError.message, citiesError)
        setCities([])
      } else {
        console.log('Cities raw data:', citiesData)
        // Format cities data
        const formattedCities: City[] = citiesData?.map((cityUser) => {
          console.log('Processing city user:', cityUser)
          // Handle both array and object response from Supabase
          // TypeScript types say array, but runtime returns object for single relations
          const cityData = Array.isArray(cityUser.cities) ? cityUser.cities[0] : cityUser.cities
          return {
            id: cityData?.id || '',
            slug: cityData?.slug || '',
            name: cityData?.city_translations?.[0]?.name || cityData?.slug || 'Unknown',
            role: cityUser.role
          }
        }).filter(city => city.id && city.slug) || []
        console.log('Formatted cities:', formattedCities)
        setCities(formattedCities)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error in fetchCities:', err)
      setLoading(false)
    }
  }

  // Show loading if auth is still loading OR we're still fetching cities
  if (authLoading || (loading && !user)) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Operator Dashboard</h1>
        <p>Loading...</p>
      </div>
    )
  }

  // At this point, we should have a user (layout ensures this)
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>Operator Dashboard ✅</h1>
        <p style={{ color: '#666' }}>User: {user?.email}</p>
        <p style={{ color: '#666' }}>User ID: {user?.id}</p>
        <p style={{ color: '#666' }}>Status: Authenticated successfully!</p>
        <p style={{ color: '#666' }}>Time: {new Date().toLocaleString()}</p>
      </div>

      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Your Cities</h2>
        <p style={{ marginBottom: '24px', color: '#666' }}>
          Select a city to manage its districts, neighborhoods, and taxonomy types.
        </p>

        {cities.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Cities Assigned</CardTitle>
              <CardDescription>
                You don&apos;t have access to any cities yet. Contact an administrator.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {cities.map((city) => {
              const href = `/${currentLocale}/operator/${city.slug}/districts`
              return (
                <Link key={city.id} href={href} prefetch={false} style={{ textDecoration: 'none' }}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        {city.name}
                      </CardTitle>
                      <CardDescription>
                        Role: {city.role} | Slug: {city.slug}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button style={{ width: '100%' }}>
                        Manage {city.name}
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
