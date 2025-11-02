/**
 * Operator Dashboard
 *
 * Main dashboard for operator users with city selector and overview statistics.
 * Operators can access multiple cities based on their grants in the city_users table.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'
import { getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Languages, FileText, MapPin, Database } from 'lucide-react'

export default async function OperatorDashboard() {
  const cookieStore = await cookies()
  const locale = await getLocale()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        get(name: string) {
          // Always use our simple cookie name
          return cookieStore.get('sb-auth-token')?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Cookie set operation failed:', error)
            }
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Cookie remove operation failed:', error)
            }
          }
        },
      },
    }
  )

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect(`/${locale}/login`)
  }

  // Get user's accessible cities via city_users junction table
  const { data: userCities } = await supabase
    .from('city_users')
    .select(`
      role,
      city:cities (
        id,
        slug,
        name,
        country
      )
    `)
    .eq('user_id', user.id)

  // If user has no city access, show message
  if (!userCities || userCities.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operator Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            No cities assigned to your account yet
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>No City Access</CardTitle>
            <CardDescription>
              Contact an administrator to grant you access to cities
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Get stats for accessible cities (using first city as default)
  const firstCity = userCities[0].city as unknown as {
    id: string
    slug: string
    name: string
    country: string
  }
  let languageCount = 0
  let languagePointCount = 0
  let descriptionCount = 0

  if (firstCity) {
    // Get language count
    const { count: languages } = await supabase
      .from('languages')
      .select('*', { count: 'exact', head: true })
      .eq('city_id', firstCity.id)

    languageCount = languages || 0

    // Get language points count
    const { count: points } = await supabase
      .from('language_points')
      .select('*', { count: 'exact', head: true })
      .eq('city_id', firstCity.id)

    languagePointCount = points || 0

    // Get description count
    const { count: descriptions } = await supabase
      .from('descriptions')
      .select('*', { count: 'exact', head: true })
      .eq('city_id', firstCity.id)

    descriptionCount = descriptions || 0
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Operator Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage language data and content for your assigned cities
        </p>
      </div>

      {/* City selector */}
      {userCities.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select City</CardTitle>
            <CardDescription>
              You have access to {userCities.length} cities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {userCities.map((userCity) => {
                const city = userCity.city as unknown as {
                  id: string
                  slug: string
                  name: string
                  country: string
                }
                return (
                  <Link
                    key={city.id}
                    href={`/${locale}/operator/${city.slug}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {city.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {city.country} • Role: {userCity.role}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick stats for primary city */}
      {firstCity && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Languages card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Languages</CardTitle>
              <Languages className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{languageCount}</div>
              <p className="text-xs text-gray-600 mt-1">
                Total languages in {firstCity.name}
              </p>
              <Link href={`/${locale}/operator/${firstCity.slug}/languages`}>
                <Button variant="link" className="p-0 mt-2 h-auto text-sm">
                  Manage languages →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Language Points card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Language Points</CardTitle>
              <MapPin className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{languagePointCount}</div>
              <p className="text-xs text-gray-600 mt-1">
                Geographic data points
              </p>
              <Link href={`/${locale}/operator/${firstCity.slug}/points`}>
                <Button variant="link" className="p-0 mt-2 h-auto text-sm">
                  View points →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Descriptions card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Descriptions</CardTitle>
              <FileText className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{descriptionCount}</div>
              <p className="text-xs text-gray-600 mt-1">
                Community stories
              </p>
              <Link href={`/${locale}/operator/${firstCity.slug}/descriptions`}>
                <Button variant="link" className="p-0 mt-2 h-auto text-sm">
                  Manage descriptions →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Data Quality card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
              <Database className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {languageCount > 0
                  ? Math.round((descriptionCount / languageCount) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Languages with descriptions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Welcome message */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome to the Operator Panel</CardTitle>
          <CardDescription>
            As an operator, you can manage language data, add descriptions, and import content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Available Actions:</h3>
              <ul className="mt-2 list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Create and manage languages</li>
                <li>Add geographic language points</li>
                <li>Write and edit community descriptions</li>
                <li>Import data from CSV files</li>
                <li>Generate AI-assisted descriptions</li>
                <li>Translate content to multiple languages</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
