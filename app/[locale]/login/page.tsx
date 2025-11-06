/**
 * Login Page
 *
 * Provides passwordless authentication via magic link.
 * Users enter their email and receive a link to sign in.
 *
 * @module app/[locale]/login/page
 */

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signInWithMagicLink, createAuthClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2, Mail } from 'lucide-react'

/**
 * Login page component
 *
 * Handles user authentication via magic link email.
 *
 * @returns Login page JSX
 */
export default function LoginPage() {
  const t = useTranslations('auth.login')
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Handle magic link token from URL hash
  useEffect(() => {
    const handleHash = async () => {
      const hash = window.location.hash

      if (hash && hash.includes('access_token')) {
        const searchParams = new URLSearchParams(hash.substring(1))
        const accessToken = searchParams.get('access_token')

        if (accessToken) {
          try {
            const supabase = createAuthClient()
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: searchParams.get('refresh_token') || '',
            })

            if (error) {
              console.error('[Login Page] Error setting session:', error)
              setError('Failed to authenticate. Please try again.')
              return
            }

            if (data.user) {
              console.log('[Login Page] Session established, redirecting...')
              // Redirect based on user role
              const { data: profile } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', data.user.id)
                .single()

              let redirectPath = '/'
              if (profile?.role === 'superuser') {
                redirectPath = '/en/superuser'
              } else if (profile?.role === 'admin') {
                redirectPath = '/en/admin'
              } else if (profile?.role === 'operator') {
                redirectPath = '/en/operator'
              }

              router.push(redirectPath)
            }
          } catch (err) {
            console.error('[Login Page] Unexpected error:', err)
            setError('An unexpected error occurred. Please try again.')
          }
        }
      }
    }

    handleHash()
  }, [router])

  /**
   * Handle form submission
   *
   * Validates email and sends magic link.
   *
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Get the current path for redirect after login
      const path = typeof window !== 'undefined'
        ? (window.location.pathname || '') + (window.location.search || '')
        : ''
      const result = await signInWithMagicLink(email, path)

      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || t('errorGeneric'))
      }
    } catch {
      setError(t('errorGeneric'))
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">{t('successTitle')}</CardTitle>
            <CardDescription>{t('successMessage')}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link href="/">
              <Button variant="outline">{t('backToHome')}</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t('emailLabel')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('submitting') : t('submitButton')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-gray-600">
            {t('noAccount')}{' '}
            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              {t('signupLink')}
            </Link>
          </div>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full">
              {t('backToHome')}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
