'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'

interface City {
  id: string
  slug: string
  name: string
  role: string
}

export default function OperatorDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  // Extract locale from pathname
  const pathSegments = pathname?.split('/').filter(Boolean) || []
  const currentLocale = pathSegments[0] || 'en'

  useEffect(() => {
    let isMounted = true

    async function getUserAndCities() {
      try {
        const { createAuthClient } = await import('@/lib/auth/client')
        const supabase = createAuthClient()

        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
          // Redirect to login
          window.location.href = `/${currentLocale}/login`
          return
        }

        if (!isMounted) return
        setUser(user)

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
          .eq('user_id', user.id)

        if (citiesError) {
          console.error('Error fetching cities:', citiesError)
        } else {
          console.log('Cities raw data:', citiesData)
          // Format cities data
          const formattedCities: City[] = citiesData?.map((cityUser: {
            role: string;
            city_id: string;
            cities: Array<{
              id: string;
              slug: string;
              city_translations: Array<{ name: string; locale_code: string }>;
            }>;
          }) => {
            console.log('Processing city user:', cityUser)
            const cityData = cityUser.cities[0]
            return {
              id: cityData?.id || '',
              slug: cityData?.slug || '',
              name: cityData?.city_translations?.[0]?.name || cityData?.slug || 'Unknown',
              role: cityUser.role
            }
          }) || []
          console.log('Formatted cities:', formattedCities)
          setCities(formattedCities)
        }

        setLoading(false)
      } catch (_err) { // eslint-disable-line @typescript-eslint/no-unused-vars
        // Redirect to login on error
        window.location.href = `/${currentLocale}/login`
      }
    }

    getUserAndCities()

    return () => {
      isMounted = false
    }
  }, [currentLocale])

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
