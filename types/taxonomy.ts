/**
 * Taxonomy Types and Values Type Definitions
 * ==========================================
 * TypeScript interfaces for taxonomy-related entities
 */

export interface TaxonomyTypeTranslation {
  locale_code: string
  name: string
}

export interface TaxonomyType {
  id: string
  slug: string
  city_id: string
  translations: TaxonomyTypeTranslation[]
}

export interface TaxonomyValueTranslation {
  id: string
  locale_code: string
  name: string
  description?: string
  is_ai_translated?: boolean
  reviewed_at?: string
}

export interface TaxonomyValue {
  id: string
  taxonomy_type_id: string
  slug: string
  color_hex: string
  icon_name?: string
  icon_size_multiplier: number
  sort_order: number
  created_at: string
  updated_at: string
  translations: TaxonomyValueTranslation[]
}

export interface TaxonomyValueWithType extends TaxonomyValue {
  taxonomy_type: TaxonomyType
}
