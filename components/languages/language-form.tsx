/**
 * Language Form Component
 * ======================
 * Form component for creating and editing languages with translations and taxonomy assignments.
 *
 * Features:
 * - Multilingual name fields (EN/NL/FR)
 * - Universal endonym field (not translated)
 * - ISO 639-3 code input
 * - Language family selector
 * - Country of origin selector
 * - Speaker count input
 * - Flexible taxonomy assignment (multi-select based on city's taxonomies)
 *
 * @module components/languages/language-form
 */

'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, Globe, Tag } from 'lucide-react'
import { createLanguage, updateLanguage, type LanguageInput } from '@/app/actions/languages'

/**
 * Type for language family data
 */
interface LanguageFamily {
  id: string
  slug: string
  translations: Array<{ name: string }>
}

/**
 * Type for country data
 */
interface Country {
  id: string
  iso_code_2: string
  iso_code_3: string
  translations: Array<{ name: string }>
}

/**
 * Type for taxonomy value data
 */
interface TaxonomyValue {
  id: string
  slug: string
  color_hex: string
  icon_name: string | null
  translations: Array<{ name: string }>
}

/**
 * Type for taxonomy type data
 */
interface TaxonomyType {
  id: string
  slug: string
  is_required: boolean
  allow_multiple: boolean
  translations: Array<{ name: string }>
  values: TaxonomyValue[]
}

/**
 * Type for existing language data (for editing)
 */
interface ExistingLanguage {
  id: string
  iso_639_3_code: string | null
  endonym: string
  language_family_id: string | null
  country_of_origin_id: string | null
  speaker_count: number | null
  translations: Array<{
    locale_code: string
    name: string
  }>
  taxonomies: Array<{
    taxonomy_value_id: string
  }>
}

/**
 * Props for LanguageForm component
 */
interface LanguageFormProps {
  /** City slug for navigation and API calls */
  citySlug: string
  /** Locale code for internationalization */
  locale: string
  /** Available language families for selection */
  languageFamilies: LanguageFamily[]
  /** Available countries for selection */
  countries: Country[]
  /** Available taxonomy types with values */
  taxonomyTypes: TaxonomyType[]
  /** Existing language data (for edit mode) */
  language?: ExistingLanguage
  /** Form mode */
  mode: 'create' | 'edit'
}

/**
 * LanguageForm - Form for creating/editing languages with taxonomy assignments
 *
 * @param props - Component props
 * @returns React component
 */
export function LanguageForm({
  citySlug,
  locale,
  languageFamilies,
  countries,
  taxonomyTypes,
  language,
  mode,
}: LanguageFormProps) {
  const t = useTranslations('languages')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // WARNING FIX 3: Add cleanup for component unmount
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Initialize form state from existing language or defaults
  const getTranslation = (localeCode: string) => {
    return language?.translations.find(t => t.locale_code === localeCode)?.name || ''
  }

  const getSelectedTaxonomies = () => {
    return language?.taxonomies.map(t => t.taxonomy_value_id) ?? []
  }

  // Form state
  const [formData, setFormData] = useState<LanguageInput>({
    iso_639_3_code: language?.iso_639_3_code ?? '',
    endonym: language?.endonym ?? '',
    language_family_id: language?.language_family_id ?? '',
    country_of_origin_id: language?.country_of_origin_id ?? '',
    speaker_count: language?.speaker_count ?? undefined,
    name_en: getTranslation('en'),
    name_nl: getTranslation('nl'),
    name_fr: getTranslation('fr'),
    taxonomy_value_ids: getSelectedTaxonomies(),
  })

  /**
   * Client-side validation before submission
   * Validates required fields and taxonomy assignments
   *
   * @returns Validation error message or null if valid
   */
  const validateForm = (): string | null => {
    // Validate endonym
    if (!formData.endonym || formData.endonym.trim().length === 0) {
      return t('form.endonymHelp') || 'Endonym is required'
    }

    // Validate English name
    if (!formData.name_en || formData.name_en.trim().length === 0) {
      return t('form.englishName') + ' is required'
    }

    // Validate ISO code format if provided
    if (formData.iso_639_3_code && !formData.iso_639_3_code.match(/^[a-z]{3}$/)) {
      return 'ISO 639-3 code must be exactly 3 lowercase letters'
    }

    // Check required taxonomies
    const requiredTaxonomies = taxonomyTypes.filter(t => t.is_required)
    for (const taxonomy of requiredTaxonomies) {
      const hasValue = taxonomy.values.some(v =>
        formData.taxonomy_value_ids?.includes(v.id)
      )
      if (!hasValue) {
        const taxonomyName = taxonomy.translations[0]?.name || taxonomy.slug
        return `Please select a value for required classification: ${taxonomyName}`
      }
    }

    return null
  }

  /**
   * Handle form submission
   */
  // WARNING FIX 2: Enhanced error handling with better user experience
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Client-side validation
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    startTransition(async () => {
      try {
        if (mode === 'create') {
          await createLanguage(citySlug, formData)
          // Only navigate if still mounted
          if (isMountedRef.current) {
            router.push(`/${locale}/operator/${citySlug}/languages`)
          }
        } else if (language) {
          await updateLanguage(citySlug, language.id, formData)
          // Only navigate if still mounted
          if (isMountedRef.current) {
            router.push(`/${locale}/operator/${citySlug}/languages`)
          }
        }
      } catch (err) {
        // Only set error if still mounted
        if (!isMountedRef.current) {
          return
        }

        // Enhanced error handling with better user messages
        console.error('Form submission error:', {
          error: err,
          mode,
          citySlug,
          timestamp: new Date().toISOString(),
        })

        let errorMessage: string

        if (err instanceof Error) {
          const message = err.message.toLowerCase()

          // Provide specific guidance based on error type
          if (message.includes('validation')) {
            errorMessage = t('error.validation') + ': ' + err.message
          } else if (message.includes('unauthorized') || message.includes('permission')) {
            errorMessage = t('error.permission')
          } else if (message.includes('network') || message.includes('fetch')) {
            errorMessage = t('error.network')
          } else if (message.includes('duplicate') || message.includes('unique')) {
            errorMessage = t('error.duplicate')
          } else {
            errorMessage = err.message
          }
        } else {
          errorMessage = t('error.unknown')
        }

        setError(errorMessage)
      }
    })
  }

  /**
   * Handle taxonomy checkbox change
   */
  // STYLE FIX 1: Added inline comments explaining complex business logic
  const handleTaxonomyChange = (taxonomyType: TaxonomyType, valueId: string, checked: boolean) => {
    setFormData(prev => {
      const currentIds = prev.taxonomy_value_ids ?? []

      if (taxonomyType.allow_multiple) {
        // Business rule: Multiple values can be selected from this taxonomy type
        // Add or remove individual values based on checkbox state
        if (checked) {
          return { ...prev, taxonomy_value_ids: [...currentIds, valueId] }
        } else {
          return {
            ...prev,
            taxonomy_value_ids: currentIds.filter(id => id !== valueId),
          }
        }
      } else {
        // Business rule: Single selection required - values are mutually exclusive
        // Before adding new value, remove all existing values from this taxonomy type
        // This ensures only one value can be selected at a time
        const otherTypeValueIds = taxonomyType.values.map(v => v.id)
        const filteredIds = currentIds.filter(id => !otherTypeValueIds.includes(id))

        if (checked) {
          return { ...prev, taxonomy_value_ids: [...filteredIds, valueId] }
        } else {
          return { ...prev, taxonomy_value_ids: filteredIds }
        }
      }
    })
  }

  /**
   * Check if a taxonomy value is selected
   */
  const isTaxonomySelected = (valueId: string) => {
    return formData.taxonomy_value_ids?.includes(valueId) || false
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      aria-label={mode === 'create' ? t('form.create') : t('form.update')}
    >
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" role="alert" aria-live="polite">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Core Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('form.coreInfo')}</CardTitle>
          <CardDescription>{t('form.coreInfoDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Endonym (Universal, not translated) */}
          <div className="space-y-2">
            <Label htmlFor="endonym">
              {t('form.endonym')} <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="endonym"
              value={formData.endonym}
              onChange={e => setFormData({ ...formData, endonym: e.target.value })}
              required
              aria-required="true"
              placeholder={t('form.endonymPlaceholder')}
              disabled={isPending}
              aria-describedby="endonym-help"
            />
            <p id="endonym-help" className="text-sm text-muted-foreground">{t('form.endonymHelp')}</p>
          </div>

          {/* ISO 639-3 Code */}
          <div className="space-y-2">
            <Label htmlFor="iso_code">{t('form.isoCode')}</Label>
            <Input
              id="iso_code"
              value={formData.iso_639_3_code}
              onChange={e => setFormData({ ...formData, iso_639_3_code: e.target.value.toLowerCase() })}
              maxLength={3}
              placeholder="eng"
              disabled={isPending}
              aria-describedby="iso-code-help"
            />
            <p id="iso-code-help" className="text-sm text-muted-foreground">{t('form.isoCodeHelp')}</p>
          </div>

          {/* Language Family */}
          <div className="space-y-2">
            <Label htmlFor="language_family">{t('form.languageFamily')}</Label>
            <Select
              value={formData.language_family_id || 'none'}
              onValueChange={value => setFormData({ ...formData, language_family_id: value === 'none' ? '' : value })}
              disabled={isPending}
            >
              <SelectTrigger id="language_family">
                <SelectValue placeholder={t('form.selectLanguageFamily')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('form.none')}</SelectItem>
                {languageFamilies.map(family => (
                  <SelectItem key={family.id} value={family.id}>
                    {family.translations[0]?.name || family.slug}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Country of Origin */}
          <div className="space-y-2">
            <Label htmlFor="country">{t('form.countryOfOrigin')}</Label>
            <Select
              value={formData.country_of_origin_id || 'none'}
              onValueChange={value => setFormData({ ...formData, country_of_origin_id: value === 'none' ? '' : value })}
              disabled={isPending}
            >
              <SelectTrigger id="country">
                <SelectValue placeholder={t('form.selectCountry')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('form.none')}</SelectItem>
                {countries.map(country => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.translations[0]?.name || country.iso_code_2}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Speaker Count */}
          <div className="space-y-2">
            <Label htmlFor="speaker_count">{t('form.speakerCount')}</Label>
            <Input
              id="speaker_count"
              type="number"
              min="0"
              value={formData.speaker_count ?? ''}
              onChange={e =>
                setFormData({
                  ...formData,
                  speaker_count: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              placeholder="0"
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Translations Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>{t('form.translations')}</CardTitle>
          </div>
          <CardDescription>{t('form.translationsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="en" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="nl">Nederlands</TabsTrigger>
              <TabsTrigger value="fr">Français</TabsTrigger>
            </TabsList>

            <TabsContent value="en" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name_en">
                  {t('form.englishName')} <span className="text-destructive" aria-hidden="true">*</span>
                </Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={e => setFormData({ ...formData, name_en: e.target.value })}
                  required
                  aria-required="true"
                  placeholder={t('form.namePlaceholder')}
                  disabled={isPending}
                />
              </div>
            </TabsContent>

            <TabsContent value="nl" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name_nl">{t('form.dutchName')}</Label>
                <Input
                  id="name_nl"
                  value={formData.name_nl}
                  onChange={e => setFormData({ ...formData, name_nl: e.target.value })}
                  placeholder={t('form.namePlaceholder')}
                  disabled={isPending}
                />
              </div>
            </TabsContent>

            <TabsContent value="fr" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name_fr">{t('form.frenchName')}</Label>
                <Input
                  id="name_fr"
                  value={formData.name_fr}
                  onChange={e => setFormData({ ...formData, name_fr: e.target.value })}
                  placeholder={t('form.namePlaceholder')}
                  disabled={isPending}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Taxonomy Assignments Card */}
      {taxonomyTypes && taxonomyTypes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5" aria-hidden="true" />
              <CardTitle>{t('form.taxonomies')}</CardTitle>
            </div>
            <CardDescription>{t('form.taxonomiesDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {taxonomyTypes.map(taxonomyType => (
              <div
                key={taxonomyType.id}
                className="space-y-3"
                role="group"
                aria-label={`${taxonomyType.translations[0]?.name || taxonomyType.slug}${taxonomyType.is_required ? ' (required)' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    {taxonomyType.translations[0]?.name || taxonomyType.slug}
                    {taxonomyType.is_required && (
                      <span className="ml-1 text-destructive" aria-hidden="true">*</span>
                    )}
                  </Label>
                  <Badge variant="outline">
                    {taxonomyType.allow_multiple ? t('form.multiSelect') : t('form.singleSelect')}
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {taxonomyType.values.map(value => (
                    <div key={value.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`taxonomy-${value.id}`}
                        checked={isTaxonomySelected(value.id)}
                        onCheckedChange={checked =>
                          handleTaxonomyChange(taxonomyType, value.id, checked as boolean)
                        }
                        disabled={isPending}
                        aria-required={taxonomyType.is_required}
                      />
                      <Label
                        htmlFor={`taxonomy-${value.id}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: value.color_hex }}
                          aria-hidden="true"
                        />
                        <span>{value.translations[0]?.name || value.slug}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        {/* WARNING FIX 3: Enhanced loading state with visual indicator */}
        {isPending && (
          <div
            className="flex items-center gap-2 text-sm text-muted-foreground"
            aria-live="polite"
          >
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            {t('form.saving')}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          {t('form.cancel')}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? t('form.saving')
            : mode === 'create'
            ? t('form.create')
            : t('form.update')}
        </Button>
      </div>
    </form>
  )
}
