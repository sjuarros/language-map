/**
 * Form Error Boundary Component
 * ==============================
 * A React error boundary component for gracefully handling form rendering errors.
 *
 * Features:
 * - Catches errors during form rendering
 * - Displays user-friendly error message
 * - Provides retry functionality
 * - Logs errors for debugging
 *
 * @module components/ui/form-error-boundary
 */

'use client'

import React, { Component, ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCcw } from 'lucide-react'

/**
 * Props for FormErrorBoundary component
 */
interface FormErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode
  /** Optional fallback UI to display on error */
  fallback?: ReactNode
  /** Optional callback when error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  /** Optional custom error message */
  errorMessage?: string
}

/**
 * State for FormErrorBoundary component
 */
interface FormErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean
  /** The error that occurred */
  error: Error | null
  /** Additional error info from React */
  errorInfo: React.ErrorInfo | null
}

/**
 * FormErrorBoundary - Error boundary component for forms
 *
 * Catches errors during rendering and displays a user-friendly error message.
 * Provides a retry button to attempt to recover from the error.
 *
 * @example
 * ```tsx
 * <FormErrorBoundary>
 *   <LanguageForm citySlug={citySlug} ... />
 * </FormErrorBoundary>
 * ```
 */
export class FormErrorBoundary extends Component<FormErrorBoundaryProps, FormErrorBoundaryState> {
  constructor(props: FormErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  /**
   * Static method called when an error is thrown during rendering
   * Updates state to trigger error UI
   *
   * @param error - The error that was thrown
   * @returns New state with error information
   */
  static getDerivedStateFromError(error: Error): Partial<FormErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  /**
   * Lifecycle method called after an error has been thrown
   * Logs error information and calls optional onError callback
   *
   * @param error - The error that was thrown
   * @param errorInfo - Additional error information from React
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console for debugging
    console.error('Form error boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    })

    // Update state with error info
    this.setState({
      errorInfo,
    })

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  /**
   * Reset error state and attempt to recover
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  /**
   * Render the component
   *
   * @returns React element
   */
  render(): ReactNode {
    if (this.state.hasError) {
      // If custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
              <CardTitle className="text-destructive">Form Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive" role="alert" aria-live="polite">
              <AlertDescription>
                {this.props.errorMessage ||
                  this.state.error?.message ||
                  'An unexpected error occurred while loading the form. Please try again.'}
              </AlertDescription>
            </Alert>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer font-semibold">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap break-words">
                  {this.state.error?.stack}
                </pre>
                <pre className="mt-2 whitespace-pre-wrap break-words">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline" size="sm">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    // No error - render children normally
    return this.props.children
  }
}
