/**
 * Error Boundary for Taxonomy Types List Page
 * ===========================================
 */

'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Something went wrong
          </CardTitle>
          <CardDescription>
            An error occurred while loading taxonomy types. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 p-4 rounded-md">
              <p className="text-sm text-gray-800 font-mono">{error.message}</p>
              {error.digest && (
                <p className="text-xs text-gray-600 mt-2">Digest: {error.digest}</p>
              )}
            </div>
          )}
          <div className="flex gap-4">
            <Button onClick={reset} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
