/**
 * Languages List Page Error Boundary
 * ===================================
 * Error boundary for languages list page
 *
 * @module app/[locale]/operator/[citySlug]/languages/error
 */

'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ChevronLeft, RefreshCcw } from 'lucide-react'

/**
 * Error props from Next.js
 */
interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Languages List Error Component
 *
 * @param props - Error props
 * @returns Error UI with recovery options
 */
export default function LanguagesError({ error, reset }: ErrorProps) {
  const t = useTranslations('languages')

  useEffect(() => {
    // Log error to error reporting service
    console.error('Languages list page error:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
  }, [error])

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="../">
        <Button variant="ghost" size="sm">
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t('actions.back')}
        </Button>
      </Link>

      {/* Error Card */}
      <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">{t('error.title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-destructive/80">
            {error.message || t('error.unknown')}
          </p>

          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex gap-2">
            <Button onClick={reset} variant="outline" size="sm">
              <RefreshCcw className="mr-2 h-4 w-4" />
              {t('error.tryAgain') || 'Try Again'}
            </Button>
            <Link href="../">
              <Button variant="ghost" size="sm">
                {t('actions.back')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 text-base">
            {t('error.helpTitle') || 'What can you do?'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-2">
          <ul className="list-disc list-inside space-y-1">
            <li>Try refreshing the page</li>
            <li>Check your internet connection</li>
            <li>Contact support if the problem persists</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
