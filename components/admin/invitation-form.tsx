/**
 * Invitation Form Component
 *
 * Form for creating new user invitations with city access grants.
 *
 * Features:
 * - Multi-step form with email, name, role, and city selection
 * - Real-time validation with Zod schemas
 * - Multi-city access grants with checkboxes
 * - Role selection (admin/operator)
 * - Loading states and error handling
 * - Full internationalization support
 *
 * @module components/admin/invitation-form
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { createInvitation } from '@/app/actions/invitations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, Mail, User, Building2, AlertCircle } from 'lucide-react'

// Validation schema
const invitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(1, 'Full name is required').max(255, 'Name too long'),
  role: z.enum(['admin', 'operator'] as const),
  cityIds: z.array(z.string()).min(1, 'At least one city is required'),
})

type InvitationFormData = z.infer<typeof invitationSchema>

interface InvitationFormProps {
  cities: Array<{
    id: string
    slug: string
    name: string
  }>
  onSuccess?: () => void
  onCancel?: () => void
}

/**
 * Invitation form component for creating new user invitations
 *
 * @param props - Component props
 * @param props.cities - List of cities to grant access to
 * @param props.onSuccess - Callback when invitation is created successfully
 * @param props.onCancel - Callback when form is cancelled
 * @returns Invitation form JSX
 */
export function InvitationForm({ cities, onSuccess, onCancel }: InvitationFormProps) {
  const t = useTranslations('admin.invitations.form')

  const [formData, setFormData] = useState<InvitationFormData>({
    email: '',
    fullName: '',
    role: 'operator',
    cityIds: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validate form data
    const validation = invitationSchema.safeParse(formData)
    if (!validation.success) {
      setError(validation.error.issues.map((e) => e.message).join(', '))
      return
    }

    setIsLoading(true)

    try {
      await createInvitation(validation.data)
      setSuccess(t('successMessage'))
      // Reset form
      setFormData({
        email: '',
        fullName: '',
        role: 'operator',
        cityIds: [],
      })
      // Call success callback
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 2000)
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : t('errorGeneric')
      )
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle city selection change
   */
  const handleCityToggle = (cityId: string) => {
    setFormData((prev) => ({
      ...prev,
      cityIds: prev.cityIds.includes(cityId)
        ? prev.cityIds.filter((id) => id !== cityId)
        : [...prev.cityIds, cityId],
    }))
  }

  /**
   * Handle select all cities
   */
  const handleSelectAll = () => {
    setFormData((prev) => ({
      ...prev,
      cityIds: cities.map((c) => c.id),
    }))
  }

  /**
   * Handle deselect all cities
   */
  const handleDeselectAll = () => {
    setFormData((prev) => ({
      ...prev,
      cityIds: [],
    }))
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('errorTitle')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('successTitle')}</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">{t('emailLabel')}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Full Name Field */}
          <div className="space-y-2">
            <Label htmlFor="fullName">{t('fullNameLabel')}</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="fullName"
                type="text"
                placeholder={t('fullNamePlaceholder')}
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Role Field */}
          <div className="space-y-2">
            <Label htmlFor="role">{t('roleLabel')}</Label>
            <Select
              value={formData.role}
              onValueChange={(value: 'admin' | 'operator') =>
                setFormData({ ...formData, role: value })
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('rolePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{t('roleAdmin')}</SelectItem>
                <SelectItem value="operator">{t('roleOperator')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">{t('roleHelpText')}</p>
          </div>

          {/* City Access Field */}
          <div className="space-y-3">
            <Label>{t('cityAccessLabel')}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={isLoading}
              >
                {t('selectAll')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
                disabled={isLoading}
              >
                {t('deselectAll')}
              </Button>
            </div>
            <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
              {cities.map((city) => (
                <div key={city.id} className="flex items-center gap-3">
                  <Checkbox
                    id={`city-${city.id}`}
                    checked={formData.cityIds.includes(city.id)}
                    onCheckedChange={() => handleCityToggle(city.id)}
                    disabled={isLoading}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <Label
                      htmlFor={`city-${city.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {city.name}
                    </Label>
                    <span className="text-xs text-gray-400">({city.slug})</span>
                  </div>
                </div>
              ))}
            </div>
            {formData.cityIds.length > 0 && (
              <p className="text-sm text-gray-500">
                {t('selectedCities', { count: formData.cityIds.length })}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              {t('cancel')}
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('submitting')}
              </>
            ) : (
              t('submitButton')
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
