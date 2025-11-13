/**
 * Language Point Form Component
 *
 * Provides a form for creating and editing language points with geographic
 * coordinates and neighborhood associations.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createLanguagePoint,
  updateLanguagePoint,
  type LanguagePointFormData,
} from '@/app/actions/language-points'

/**
 * Language data structure
 */
interface Language {
  id: string
  endonym: string | null
  translations: Array<{ name: string }>
}

/**
 * Neighborhood data structure
 */
interface Neighborhood {
  id: string
  slug: string
  translations: Array<{ name: string }>
}

/**
 * Existing language point data for editing
 */
interface ExistingLanguagePoint {
  id: string
  language_id: string
  neighborhood_id: string | null
  latitude: number
  longitude: number
  postal_code: string | null
  community_name: string | null
  notes: string | null
}

interface LanguagePointFormProps {
  citySlug: string
  locale: string
  languages: Language[]
  neighborhoods: Neighborhood[]
  existingPoint?: ExistingLanguagePoint
  mode: 'create' | 'edit'
}

/**
 * LanguagePointForm component
 *
 * Renders a form for creating or editing language points with validation.
 *
 * @param citySlug - The slug of the city
 * @param locale - The current locale
 * @param languages - Available languages for selection
 * @param neighborhoods - Available neighborhoods for selection
 * @param existingPoint - Existing point data (for edit mode)
 * @param mode - Form mode ('create' or 'edit')
 */
export function LanguagePointForm({
  citySlug,
  locale,
  languages,
  neighborhoods,
  existingPoint,
  mode,
}: LanguagePointFormProps) {
  const t = useTranslations('languagePoints')
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState<LanguagePointFormData>({
    language_id: existingPoint?.language_id || '',
    neighborhood_id: existingPoint?.neighborhood_id || null,
    latitude: existingPoint?.latitude || 0,
    longitude: existingPoint?.longitude || 0,
    postal_code: existingPoint?.postal_code || '',
    community_name: existingPoint?.community_name || '',
    notes: existingPoint?.notes || '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Handles form field changes
   */
  const handleChange = (
    field: keyof LanguagePointFormData,
    value: string | number | null
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  /**
   * Handles form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (mode === 'create') {
        await createLanguagePoint(citySlug, formData)
        router.push(`/${locale}/operator/${citySlug}/language-points`)
      } else if (existingPoint) {
        await updateLanguagePoint(citySlug, existingPoint.id, formData)
        router.push(`/${locale}/operator/${citySlug}/language-points`)
      }
    } catch (err) {
      console.error('Error submitting form:', err)
      setError(err instanceof Error ? err.message : t('form.errorGeneric'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Language Selection */}
      <div className="space-y-2">
        <Label htmlFor="language_id">{t('form.language')} *</Label>
        <Select
          value={formData.language_id}
          onValueChange={(value) => handleChange('language_id', value)}
        >
          <SelectTrigger id="language_id">
            <SelectValue placeholder={t('form.selectLanguage')} />
          </SelectTrigger>
          <SelectContent>
            {languages.map((language) => (
              <SelectItem key={language.id} value={language.id}>
                {language.translations[0]?.name || language.endonym || language.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Neighborhood Selection (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="neighborhood_id">{t('form.neighborhood')}</Label>
        <Select
          value={formData.neighborhood_id || 'none'}
          onValueChange={(value) =>
            handleChange('neighborhood_id', value === 'none' ? null : value)
          }
        >
          <SelectTrigger id="neighborhood_id">
            <SelectValue placeholder={t('form.selectNeighborhood')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('form.noNeighborhood')}</SelectItem>
            {neighborhoods.map((neighborhood) => (
              <SelectItem key={neighborhood.id} value={neighborhood.id}>
                {neighborhood.translations[0]?.name || neighborhood.slug}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Coordinates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="latitude">{t('form.latitude')} *</Label>
          <Input
            id="latitude"
            type="number"
            step="0.00000001"
            min="-90"
            max="90"
            value={formData.latitude}
            onChange={(e) => handleChange('latitude', parseFloat(e.target.value))}
            required
          />
          <p className="text-xs text-muted-foreground">
            {t('form.latitudeRange')}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="longitude">{t('form.longitude')} *</Label>
          <Input
            id="longitude"
            type="number"
            step="0.00000001"
            min="-180"
            max="180"
            value={formData.longitude}
            onChange={(e) => handleChange('longitude', parseFloat(e.target.value))}
            required
          />
          <p className="text-xs text-muted-foreground">
            {t('form.longitudeRange')}
          </p>
        </div>
      </div>

      {/* Postal Code (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="postal_code">{t('form.postalCode')}</Label>
        <Input
          id="postal_code"
          type="text"
          value={formData.postal_code || ''}
          onChange={(e) => handleChange('postal_code', e.target.value)}
          placeholder={t('form.postalCodePlaceholder')}
        />
      </div>

      {/* Community Name (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="community_name">{t('form.communityName')}</Label>
        <Input
          id="community_name"
          type="text"
          value={formData.community_name || ''}
          onChange={(e) => handleChange('community_name', e.target.value)}
          placeholder={t('form.communityNamePlaceholder')}
        />
      </div>

      {/* Notes (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="notes">{t('form.notes')}</Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder={t('form.notesPlaceholder')}
          rows={4}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          {t('form.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t('form.saving')
            : mode === 'create'
            ? t('form.create')
            : t('form.update')}
        </Button>
      </div>
    </form>
  )
}
