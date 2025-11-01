/**
 * Taxonomy Value Form Component
 * ============================
 * Form component for creating and editing taxonomy values with visual styling options.
 * Supports color selection, icon selection, and multi-language translations.
 *
 * @component
 */

'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createTaxonomyValue, updateTaxonomyValue } from '@/app/actions/taxonomy-values'
import type { TaxonomyValueInput } from '@/app/actions/taxonomy-values'

// Color palette for quick selection
const PRESET_COLORS = [
  '#FFA500', // Orange
  '#FFD700', // Gold
  '#FF4500', // Orange Red
  '#DC143C', // Crimson
  '#B22222', // Fire Brick
  '#228B22', // Forest Green
  '#32CD32', // Lime Green
  '#008080', // Teal
  '#1E90FF', // Dodger Blue
  '#4169E1', // Royal Blue
  '#8A2BE2', // Blue Violet
  '#9932CC', // Dark Orchid
  '#FF69B4', // Hot Pink
  '#FF1493', // Deep Pink
  '#A9A9A9', // Dark Gray
]

// Common icon names (Lucide icons)
const PRESET_ICONS = [
  'Circle',
  'Square',
  'Triangle',
  'Diamond',
  'Star',
  'Heart',
  'Sun',
  'Moon',
  'Cloud',
  'Mountain',
  'Tree',
  'Fish',
  'Bird',
  'Car',
  'Home',
  'Building',
  'MapPin',
  'Flag',
  'Shield',
  'Key',
  'Lock',
  'Unlock',
  'Bell',
  'BellRing',
  'Phone',
  'Mail',
  'Globe',
  'Book',
  'Pencil',
  'Eraser',
  'Scissors',
  'Stapler',
  'Paperclip',
  'Folder',
  'File',
  'Image',
  'Video',
  'Music',
  'Camera',
  'Play',
  'Pause',
  'Stop',
]

const locales = ['en', 'nl', 'fr']

interface TaxonomyValueFormProps {
  taxonomyTypeId: string
  taxonomyValueId?: string
  locale: string
  citySlug: string
  initialData?: {
    slug?: string
    color_hex?: string
    icon_name?: string
    icon_size_multiplier?: number
    display_order?: number
    translations?: Array<{
      locale_code: string
      name: string
      description?: string
    }>
  }
}

export default function TaxonomyValueForm({
  taxonomyTypeId,
  taxonomyValueId,
  locale,
  citySlug,
  initialData
}: TaxonomyValueFormProps) {
  const t = useTranslations('TaxonomyValues')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    slug: initialData?.slug || '',
    color_hex: initialData?.color_hex || '#CCCCCC',
    icon_name: initialData?.icon_name || '',
    icon_size_multiplier: initialData?.icon_size_multiplier || 1.0,
    display_order: initialData?.display_order || 0,
  })

  // Translation state
  const [translations, setTranslations] = useState<Record<string, { name: string; description?: string }>>(() => {
    const result: Record<string, { name: string; description?: string }> = {}
    locales.forEach(locale => {
      const existing = initialData?.translations?.find(t => t.locale_code === locale)
      result[locale] = {
        name: existing?.name || '',
        description: existing?.description || '',
      }
    })
    return result
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validate required translations
    for (const locale of locales) {
      if (!translations[locale].name.trim()) {
        setError(t('validation.translationRequired', { locale }))
        return
      }
    }

    const input: TaxonomyValueInput = {
      taxonomy_type_id: taxonomyTypeId,
      slug: formData.slug,
      color_hex: formData.color_hex,
      icon_name: formData.icon_name || undefined,
      icon_size_multiplier: formData.icon_size_multiplier,
      display_order: formData.display_order,
      translations: locales.map(locale => ({
        locale_code: locale,
        name: translations[locale].name,
        description: translations[locale].description || undefined,
      })),
    }

    startTransition(async () => {
      try {
        if (taxonomyValueId) {
          await updateTaxonomyValue(citySlug, taxonomyValueId, input)
          setSuccess(t('success.updated'))
          setTimeout(() => {
            router.push(`/${locale}/${citySlug}/operator/taxonomy-types/${taxonomyTypeId}/values`)
          }, 1500)
        } else {
          await createTaxonomyValue(citySlug, input)
          setSuccess(t('success.created'))
          setTimeout(() => {
            router.push(`/${locale}/${citySlug}/operator/taxonomy-types/${taxonomyTypeId}/values`)
          }, 1500)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('error.unknown'))
      }
    })
  }

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, color_hex: color }))
  }

  const handleIconSelect = (icon: string) => {
    setFormData(prev => ({ ...prev, icon_name: icon }))
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form.basicInfo.title')}</CardTitle>
            <CardDescription>{t('form.basicInfo.description')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="slug">{t('form.slug.label')} *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder={t('form.slug.placeholder')}
                required
              />
              <p className="text-sm text-muted-foreground">{t('form.slug.help')}</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="display_order">{t('form.displayOrder.label')}</Label>
              <Input
                id="display_order"
                type="number"
                min="0"
                value={formData.display_order}
                onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
              />
              <p className="text-sm text-muted-foreground">{t('form.displayOrder.help')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Visual Styling */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form.visualStyling.title')}</CardTitle>
            <CardDescription>{t('form.visualStyling.description')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label>{t('form.color.label')} *</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="color"
                  value={formData.color_hex}
                  onChange={(e) => setFormData(prev => ({ ...prev, color_hex: e.target.value }))}
                  className="w-20 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.color_hex}
                  onChange={(e) => setFormData(prev => ({ ...prev, color_hex: e.target.value }))}
                  placeholder="#CCCCCC"
                  className="font-mono"
                />
              </div>
              <p className="text-sm text-muted-foreground">{t('form.color.help')}</p>

              {/* Preset colors */}
              <div className="flex flex-wrap gap-2 mt-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={`w-8 h-8 rounded border-2 ${formData.color_hex === color ? 'border-primary' : 'border-gray-300'}`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="icon_name">{t('form.icon.label')}</Label>
              <div className="flex gap-2">
                <Input
                  id="icon_name"
                  value={formData.icon_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon_name: e.target.value }))}
                  placeholder={t('form.icon.placeholder')}
                  className="flex-1"
                />
              </div>
              <p className="text-sm text-muted-foreground">{t('form.icon.help')}</p>

              {/* Preset icons */}
              <div className="flex flex-wrap gap-2 mt-2">
                {PRESET_ICONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => handleIconSelect(icon)}
                    className={`px-3 py-1 text-sm border rounded ${formData.icon_name === icon ? 'border-primary bg-primary/10' : 'border-gray-300'}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="icon_size_multiplier">{t('form.iconSize.label')} *</Label>
              <Input
                id="icon_size_multiplier"
                type="number"
                step="0.1"
                min="0.5"
                max="3.0"
                value={formData.icon_size_multiplier}
                onChange={(e) => setFormData(prev => ({ ...prev, icon_size_multiplier: parseFloat(e.target.value) || 1.0 }))}
              />
              <p className="text-sm text-muted-foreground">{t('form.iconSize.help')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Translations */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form.translations.title')}</CardTitle>
            <CardDescription>{t('form.translations.description')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {locales.map(locale => (
              <div key={locale} className="grid gap-4 border rounded-lg p-4">
                <h3 className="font-semibold">{t(`locale.${locale}`)}</h3>

                <div className="grid gap-2">
                  <Label htmlFor={`name-${locale}`}>{t('form.translations.name.label')} *</Label>
                  <Input
                    id={`name-${locale}`}
                    value={translations[locale].name}
                    onChange={(e) => setTranslations(prev => ({
                      ...prev,
                      [locale]: { ...prev[locale], name: e.target.value }
                    }))}
                    placeholder={t('form.translations.name.placeholder')}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={`description-${locale}`}>{t('form.translations.description.label')}</Label>
                  <Textarea
                    id={`description-${locale}`}
                    value={translations[locale].description}
                    onChange={(e) => setTranslations(prev => ({
                      ...prev,
                      [locale]: { ...prev[locale], description: e.target.value }
                    }))}
                    placeholder={t('form.translations.description.placeholder')}
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          {t('form.actions.cancel')}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? t('form.actions.saving') : taxonomyValueId ? t('form.actions.update') : t('form.actions.create')}
        </Button>
      </div>
    </form>
  )
}
