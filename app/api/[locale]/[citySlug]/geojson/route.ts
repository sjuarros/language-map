/**
 * @file route.ts
 * @description GeoJSON API Route for language point data export
 *
 * Provides language points in GeoJSON format for Mapbox map rendering.
 * Includes taxonomy data for dynamic styling (colors, icons, sizes) and filtering.
 *
 * Key features:
 * - Locale-aware language name translations
 * - Optional taxonomy-based filtering via query parameter
 * - Optimized with HTTP caching (5min cache, 10min stale-while-revalidate)
 * - Supports multiple cities via database abstraction layer
 * - Input validation for all parameters
 * - Coordinate range validation
 *
 * Performance: Uses database client abstraction to enable future per-city
 * database routing while maintaining single shared database in current implementation.
 *
 * @module app/api/[locale]/[citySlug]/geojson/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabaseAdminClient } from '@/lib/database/client'

/**
 * GeoJSON Feature for a language point
 */
interface LanguagePointFeature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
  }
  properties: {
    id: string
    languageId: string
    languageName: string
    endonym: string | null
    postalCode: string | null
    communityName: string | null
    taxonomies: Array<{
      typeSlug: string
      valueSlug: string
      color: string
      iconName: string
      iconSize: number
    }>
  }
}

/**
 * GeoJSON FeatureCollection
 */
interface FeatureCollection {
  type: 'FeatureCollection'
  features: LanguagePointFeature[]
}

/**
 * Database types for query results
 */
interface TaxonomyValue {
  slug: string
  color_hex: string
  icon_name: string
  icon_size_multiplier: number
  taxonomy_type: {
    slug: string
  }
}

interface LanguageTaxonomy {
  taxonomy_value: TaxonomyValue
}

interface LanguageTranslation {
  locale_code: string
  name: string
}

interface Language {
  id: string
  endonym: string | null
  city_id: string
  language_translations: LanguageTranslation[]
  language_taxonomies: LanguageTaxonomy[]
}

interface LanguagePointRecord {
  id: string
  latitude: number
  longitude: number
  postal_code: string | null
  community_name: string | null
  language: Language
}

/**
 * GET /api/[locale]/[citySlug]/geojson
 *
 * Returns language points as GeoJSON with taxonomy data for map rendering.
 * Supports optional filtering by taxonomy value via query parameter.
 *
 * @async
 * @param request - Next.js request object containing URL and query parameters
 * @param params - Async route parameters object
 * @param params.params - Promise resolving to route parameters
 * @param params.params.locale - Locale code (e.g., 'en', 'nl', 'fr')
 * @param params.params.citySlug - City identifier slug (e.g., 'amsterdam', 'paris')
 * @returns Promise<NextResponse> - GeoJSON FeatureCollection with language points or error response
 * @throws {Error} Returns 400 if parameters are invalid
 * @throws {Error} Returns 404 if city is not found or no data available
 * @throws {Error} Returns 500 if database query fails
 * @throws {Error} Returns 503 if database connection fails
 *
 * @example
 * // Get all language points for Amsterdam in English
 * GET /api/en/amsterdam/geojson
 *
 * @example
 * // Get language points filtered by taxonomy value
 * GET /api/en/amsterdam/geojson?taxonomyValue=medium
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string; citySlug: string }> }
) {
  try {
    const { locale, citySlug } = await params

    // Validate citySlug parameter
    if (!citySlug || typeof citySlug !== 'string') {
      return NextResponse.json(
        { error: 'City slug is required and must be a string' },
        { status: 400 }
      )
    }

    if (citySlug.length > 100 || !/^[a-z0-9-]+$/.test(citySlug)) {
      return NextResponse.json(
        { error: 'Invalid city slug format (expected lowercase alphanumeric with hyphens)' },
        { status: 400 }
      )
    }

    // Validate locale parameter
    if (!locale || typeof locale !== 'string') {
      return NextResponse.json(
        { error: 'Locale is required and must be a string' },
        { status: 400 }
      )
    }

    if (locale.length > 10 || !/^[a-z]{2}(-[A-Z]{2})?$/.test(locale)) {
      return NextResponse.json(
        { error: 'Invalid locale format (expected: en, nl, fr, etc.)' },
        { status: 400 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const taxonomyValueSlug = searchParams.get('taxonomyValue')

    // Validate taxonomyValueSlug if provided
    if (taxonomyValueSlug !== null) {
      if (typeof taxonomyValueSlug !== 'string' || taxonomyValueSlug.length > 100) {
        return NextResponse.json(
          { error: 'Invalid taxonomy value slug length' },
          { status: 400 }
        )
      }

      if (!/^[a-z0-9-_]+$/.test(taxonomyValueSlug)) {
        return NextResponse.json(
          { error: 'Invalid taxonomy value slug format (expected lowercase alphanumeric with hyphens/underscores)' },
          { status: 400 }
        )
      }
    }

    // Get database client for the city (using admin client to bypass RLS for public API)
    let supabase
    try {
      supabase = getDatabaseAdminClient(citySlug)

      if (!supabase) {
        throw new Error('Failed to initialize database client')
      }
    } catch (error) {
      console.error('Database client initialization failed:', {
        citySlug,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      return NextResponse.json(
        { error: 'Failed to connect to database' },
        { status: 503 }
      )
    }

    // Get city ID
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .single()

    if (cityError || !city) {
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      )
    }

    // Build query for language points with taxonomy data
    let query = supabase
      .from('language_points')
      .select(
        `
        id,
        latitude,
        longitude,
        postal_code,
        community_name,
        language:languages!inner (
          id,
          endonym,
          city_id,
          language_translations!inner (
            locale_code,
            name
          ),
          language_taxonomies (
            taxonomy_value:taxonomy_values (
              slug,
              color_hex,
              icon_name,
              icon_size_multiplier,
              taxonomy_type:taxonomy_types (
                slug
              )
            )
          )
        )
      `
      )
      .eq('language.city_id', city.id)
      .eq('language.language_translations.locale_code', locale)

    // Apply taxonomy filter if provided
    if (taxonomyValueSlug) {
      query = query.eq(
        'language.language_taxonomies.taxonomy_value.slug',
        taxonomyValueSlug
      )
    }

    const { data: points, error: pointsError } = await query

    if (pointsError) {
      console.error('Error fetching language points:', {
        error: pointsError,
        citySlug,
        locale,
        taxonomyFilter: taxonomyValueSlug,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json(
        { error: 'Failed to fetch language points' },
        { status: 500 }
      )
    }

    if (!points) {
      return NextResponse.json(
        { error: 'No data found' },
        { status: 404 }
      )
    }

    // Validate points is an array
    if (!Array.isArray(points)) {
      console.error('Invalid data structure: points is not an array', {
        citySlug,
        locale,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json(
        { error: 'Invalid data structure returned' },
        { status: 500 }
      )
    }

    // Validate and filter valid points only
    const validPoints = points.filter((point: unknown): point is LanguagePointRecord => {
      // First check if point is an object
      if (!point || typeof point !== 'object') {
        return false
      }

      // Cast to any for property access in type guard
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = point as any

      // Check required fields exist and have correct types
      if (typeof p.id !== 'string' ||
          typeof p.latitude !== 'number' ||
          typeof p.longitude !== 'number' ||
          !p.language ||
          typeof p.language !== 'object' ||
          typeof p.language.id !== 'string') {
        console.warn('Invalid language point record detected, skipping', {
          pointId: p.id,
          citySlug,
          timestamp: new Date().toISOString()
        })
        return false
      }

      // Validate coordinate ranges
      if (p.longitude < -180 || p.longitude > 180 ||
          p.latitude < -90 || p.latitude > 90) {
        console.warn('Invalid coordinates detected, skipping point', {
          id: p.id,
          longitude: p.longitude,
          latitude: p.latitude,
          timestamp: new Date().toISOString()
        })
        return false
      }

      return true
    })

    if (validPoints.length === 0) {
      return NextResponse.json(
        { error: 'No valid language points found' },
        { status: 404 }
      )
    }

    // Convert to GeoJSON format
    const geojson: FeatureCollection = {
      type: 'FeatureCollection',
      features: validPoints.map((point) => {
        // Extract language data (cast to any for Supabase query result)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const language = (point as any).language as Language

        // Get the translated name (should be one result due to locale filter)
        const languageName =
          language.language_translations?.[0]?.name || language.endonym || 'Unknown'

        // Extract taxonomy data with fallbacks
        // Each language can have multiple taxonomy classifications (e.g., size, status)
        // Fallback to safe defaults if taxonomy data is incomplete to prevent map rendering errors
        const taxonomies =
          language.language_taxonomies?.map((lt: LanguageTaxonomy) => ({
            typeSlug: lt.taxonomy_value?.taxonomy_type?.slug || '',
            valueSlug: lt.taxonomy_value?.slug || '',
            // Default to neutral gray if no color defined
            color: lt.taxonomy_value?.color_hex || '#CCCCCC',
            // Default to 'circle' for consistent map markers
            iconName: lt.taxonomy_value?.icon_name || 'circle',
            // Default to 1.0 (normal size) for consistent rendering
            iconSize: lt.taxonomy_value?.icon_size_multiplier || 1.0,
          })) || []

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = point as any

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [p.longitude, p.latitude],
          },
          properties: {
            id: p.id,
            languageId: language.id,
            languageName,
            endonym: language.endonym,
            postalCode: p.postal_code,
            communityName: p.community_name,
            taxonomies,
          },
        }
      }),
    }

    // Return GeoJSON with caching headers
    return NextResponse.json(geojson, {
      headers: {
        'Content-Type': 'application/geo+json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    // Type-safe error handling with context
    let errorMessage = 'Unknown error occurred'
    let errorDetails = ''

    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || ''
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error)
    }

    console.error('Unexpected error in GeoJSON API:', {
      message: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      {
        error: 'Internal server error',
        // Only include details in development
        ...(process.env.NODE_ENV === 'development' && {
          details: errorMessage
        })
      },
      { status: 500 }
    )
  }
}
