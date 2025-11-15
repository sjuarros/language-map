/**
 * Server Actions for CSV Import
 *
 * Handles bulk import of language data from CSV files with taxonomy mapping
 */

'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseClient } from '@/lib/database/client';
import type { ParsedLanguageRow } from '@/lib/import/csv-parser';

/**
 * Maximum length for language names
 */
const MAX_LANGUAGE_NAME_LENGTH = 200;

/**
 * Sanitizes language name for database operations
 *
 * Removes potentially dangerous characters and validates format.
 *
 * @param name - Raw language name from CSV
 * @returns Sanitized name safe for database operations
 * @throws Error if name contains invalid patterns or exceeds length limits
 */
function sanitizeLanguageName(name: string): string {
  // Validate input type
  if (!name || typeof name !== 'string') {
    throw new Error('Language name must be a non-empty string');
  }

  // Trim and normalize whitespace
  const sanitized = name.trim().replace(/\s+/g, ' ');

  // Check for empty string after trimming
  if (sanitized.length === 0) {
    throw new Error('Language name cannot be empty');
  }

  // Check for suspicious SQL-like patterns (defense in depth)
  // Note: Supabase uses prepared statements, but we validate anyway
  if (/[';]|(--)|(\/\*)|(\*\/)|(xp_)|( or )|( and )/i.test(sanitized)) {
    throw new Error('Language name contains invalid characters or patterns');
  }

  // Validate length
  if (sanitized.length > MAX_LANGUAGE_NAME_LENGTH) {
    throw new Error(`Language name exceeds maximum length (${MAX_LANGUAGE_NAME_LENGTH} characters)`);
  }

  return sanitized;
}

/**
 * Sanitizes ISO 639-3 language code
 *
 * @param code - Raw ISO code from CSV
 * @returns Sanitized code or null if invalid
 */
function sanitizeISOCode(code: string | undefined): string | null {
  if (!code || typeof code !== 'string') {
    return null;
  }

  // Trim and convert to lowercase
  const sanitized = code.trim().toLowerCase();

  // Validate format (exactly 3 letters)
  if (!/^[a-z]{3}$/.test(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Sanitizes endonym (universal language name)
 *
 * @param endonym - Raw endonym from CSV
 * @returns Sanitized endonym or null if invalid
 */
function sanitizeEndonym(endonym: string | undefined): string | null {
  if (!endonym || typeof endonym !== 'string') {
    return null;
  }

  // Trim and normalize whitespace
  const sanitized = endonym.trim().replace(/\s+/g, ' ');

  // Check for empty string
  if (sanitized.length === 0) {
    return null;
  }

  // Validate length
  if (sanitized.length > MAX_LANGUAGE_NAME_LENGTH) {
    return null;
  }

  return sanitized;
}

/**
 * Result of a single language import operation
 */
export interface ImportResult {
  /** Row number from CSV */
  rowNumber: number;
  /** Whether import was successful */
  success: boolean;
  /** Language ID if successful */
  languageId?: string;
  /** Error message if failed */
  error?: string;
  /** Language name for reference */
  languageName: string;
}

/**
 * Summary of bulk import operation
 */
export interface ImportSummary {
  /** Total rows attempted */
  total: number;
  /** Successfully imported */
  successful: number;
  /** Failed imports */
  failed: number;
  /** Detailed results for each row */
  results: ImportResult[];
  /** Overall error message if entire operation failed */
  error?: string;
}

/**
 * Mapping of CSV taxonomy columns to database taxonomy values
 */
export interface TaxonomyMapping {
  /** CSV column name */
  csvColumn: string;
  /** Taxonomy type ID from database */
  taxonomyTypeId: string;
  /** Mapping of CSV values to taxonomy value IDs */
  valueMapping: Record<string, string>;
}

/**
 * Configuration for bulk import operation
 */
export interface ImportConfig {
  /** City slug for multi-city routing */
  citySlug: string;
  /** Locale for translations (default is 'en') */
  locale?: string;
  /** Taxonomy column mappings */
  taxonomyMappings?: TaxonomyMapping[];
  /** Whether to skip rows with errors (default: false) */
  skipErrors?: boolean;
  /** Whether to update existing languages with same name (default: false) */
  updateExisting?: boolean;
}

/**
 * Imports languages from parsed CSV data with taxonomy assignments
 *
 * @param rows - Parsed language rows from CSV
 * @param config - Import configuration
 * @returns Promise resolving to import summary
 */
export async function importLanguagesFromCSV(
  rows: ParsedLanguageRow[],
  config: ImportConfig
): Promise<ImportSummary> {
  try {
    // Validate input parameters
    if (!rows || rows.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        results: [],
        error: 'No rows provided for import'
      };
    }

    if (!config.citySlug) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        results: [],
        error: 'City slug is required'
      };
    }

    // Apply defaults
    const {
      locale = 'en',
      taxonomyMappings = [],
      skipErrors = false,
      updateExisting = false
    } = config;

    // Get database client for the city
    const supabase = getDatabaseClient(config.citySlug);

    // Get city ID
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', config.citySlug)
      .single();

    if (cityError || !city) {
      return {
        total: rows.length,
        successful: 0,
        failed: rows.length,
        results: rows.map(row => ({
          rowNumber: row.rowNumber,
          success: false,
          languageName: row.name,
          error: `City not found: ${config.citySlug}`
        })),
        error: `City not found: ${config.citySlug}`
      };
    }

    const cityId = city.id;

    // Import each row
    const results: ImportResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        const result = await importSingleLanguage(
          row,
          cityId,
          locale,
          taxonomyMappings,
          updateExisting,
          supabase
        );

        results.push(result);

        if (result.success) {
          successful++;
        } else {
          failed++;

          // If not skipping errors, stop on first failure
          if (!skipErrors) {
            // Log error context for debugging
            console.error(`Import failed at row ${row.rowNumber}:`, result.error);

            return {
              total: rows.length,
              successful,
              failed,
              results,
              error: `Import stopped at row ${row.rowNumber}: ${result.error}`
            };
          }
        }
      } catch (error) {
        // Log unexpected error for debugging
        console.error(`Unexpected error importing row ${row.rowNumber}:`, error);

        failed++;
        results.push({
          rowNumber: row.rowNumber,
          success: false,
          languageName: row.name,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });

        if (!skipErrors) {
          return {
            total: rows.length,
            successful,
            failed,
            results,
            error: `Import stopped due to unexpected error at row ${row.rowNumber}`
          };
        }
      }
    }

    // Revalidate language list page
    revalidatePath(`/${locale}/${config.citySlug}/languages`);
    revalidatePath(`/operator/${config.citySlug}/languages`);

    return {
      total: rows.length,
      successful,
      failed,
      results
    };
  } catch (error) {
    // Log top-level error for debugging
    console.error('Bulk import error:', error);

    return {
      total: rows.length,
      successful: 0,
      failed: rows.length,
      results: rows.map(row => ({
        rowNumber: row.rowNumber,
        success: false,
        languageName: row.name,
        error: 'Bulk import failed'
      })),
      error: error instanceof Error ? error.message : 'Unknown error during bulk import'
    };
  }
}

/**
 * Imports a single language with translations and taxonomies
 *
 * @param row - Parsed language row
 * @param cityId - City UUID
 * @param locale - Locale for translation
 * @param taxonomyMappings - Taxonomy column mappings
 * @param updateExisting - Whether to update existing language
 * @param supabase - Supabase client instance
 * @returns Promise resolving to import result
 */
async function importSingleLanguage(
  row: ParsedLanguageRow,
  cityId: string,
  locale: string,
  taxonomyMappings: TaxonomyMapping[],
  updateExisting: boolean,
  supabase: ReturnType<typeof getDatabaseClient>
): Promise<ImportResult> {
  try {
    // Sanitize all input data before database operations
    let sanitizedName: string;
    try {
      sanitizedName = sanitizeLanguageName(row.name);
    } catch (error) {
      return {
        rowNumber: row.rowNumber,
        success: false,
        languageName: row.name,
        error: error instanceof Error ? error.message : 'Invalid language name'
      };
    }

    const sanitizedEndonym = sanitizeEndonym(row.endonym);
    const sanitizedISOCode = sanitizeISOCode(row.iso_639_3_code);

    // Check if language already exists by name
    const { data: existingLanguages } = await supabase
      .from('language_translations')
      .select('language_id, languages!inner(city_id)')
      .eq('name', sanitizedName)
      .eq('languages.city_id', cityId)
      .eq('locale_code', locale);

    if (existingLanguages && existingLanguages.length > 0) {
      if (!updateExisting) {
        return {
          rowNumber: row.rowNumber,
          success: false,
          languageName: row.name,
          error: `Language "${row.name}" already exists`
        };
      }

      // Update existing language
      const languageId = existingLanguages[0].language_id;

      // Update language record
      const { error: updateError } = await supabase
        .from('languages')
        .update({
          endonym: sanitizedEndonym,
          iso_639_3_code: sanitizedISOCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', languageId);

      if (updateError) {
        return {
          rowNumber: row.rowNumber,
          success: false,
          languageName: sanitizedName,
          error: `Failed to update language: ${updateError.message}`
        };
      }

      // Update translation
      const { error: translationError } = await supabase
        .from('language_translations')
        .update({
          name: sanitizedName,
          updated_at: new Date().toISOString()
        })
        .eq('language_id', languageId)
        .eq('locale_code', locale);

      if (translationError) {
        return {
          rowNumber: row.rowNumber,
          success: false,
          languageName: sanitizedName,
          error: `Failed to update translation: ${translationError.message}`
        };
      }

      // Update taxonomies
      await updateLanguageTaxonomies(languageId, row, taxonomyMappings, supabase);

      return {
        rowNumber: row.rowNumber,
        success: true,
        languageId,
        languageName: sanitizedName
      };
    }

    // Create new language
    const { data: language, error: languageError } = await supabase
      .from('languages')
      .insert({
        city_id: cityId,
        endonym: sanitizedEndonym,
        iso_639_3_code: sanitizedISOCode
      })
      .select('id')
      .single();

    if (languageError || !language) {
      return {
        rowNumber: row.rowNumber,
        success: false,
        languageName: sanitizedName,
        error: `Failed to create language: ${languageError?.message || 'Unknown error'}`
      };
    }

    const languageId = language.id;

    // Create translation
    const { error: translationError } = await supabase
      .from('language_translations')
      .insert({
        language_id: languageId,
        locale_code: locale,
        name: sanitizedName
      });

    if (translationError) {
      // Rollback: delete language
      await supabase.from('languages').delete().eq('id', languageId);

      return {
        rowNumber: row.rowNumber,
        success: false,
        languageName: sanitizedName,
        error: `Failed to create translation: ${translationError.message}`
      };
    }

    // Assign taxonomies
    await updateLanguageTaxonomies(languageId, row, taxonomyMappings, supabase);

    return {
      rowNumber: row.rowNumber,
      success: true,
      languageId,
      languageName: sanitizedName
    };
  } catch (error) {
    // Log error context for debugging
    console.error(`Error importing language "${row.name}":`, error);

    return {
      rowNumber: row.rowNumber,
      success: false,
      languageName: row.name,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Updates taxonomy assignments for a language based on CSV data
 *
 * @param languageId - Language UUID
 * @param row - Parsed language row
 * @param taxonomyMappings - Taxonomy column mappings
 * @param supabase - Supabase client instance
 */
async function updateLanguageTaxonomies(
  languageId: string,
  row: ParsedLanguageRow,
  taxonomyMappings: TaxonomyMapping[],
  supabase: ReturnType<typeof getDatabaseClient>
): Promise<void> {
  try {
    // Delete existing taxonomy assignments
    await supabase
      .from('language_taxonomies')
      .delete()
      .eq('language_id', languageId);

    // Create new assignments based on CSV data
    const taxonomyAssignments: { language_id: string; taxonomy_value_id: string }[] = [];

    for (const mapping of taxonomyMappings) {
      const csvValue = row.taxonomies[mapping.csvColumn];
      if (!csvValue) continue;

      const taxonomyValueId = mapping.valueMapping[csvValue];
      if (!taxonomyValueId) {
        // Log warning for unmapped value but continue
        console.warn(`No mapping found for CSV value "${csvValue}" in column "${mapping.csvColumn}"`);
        continue;
      }

      taxonomyAssignments.push({
        language_id: languageId,
        taxonomy_value_id: taxonomyValueId
      });
    }

    // Insert taxonomy assignments if any exist
    if (taxonomyAssignments.length > 0) {
      const { error } = await supabase
        .from('language_taxonomies')
        .insert(taxonomyAssignments);

      if (error) {
        // Log error but don't fail the import
        console.error(`Failed to assign taxonomies for language ${languageId}:`, error);
      }
    }
  } catch (error) {
    // Log error but don't fail the import
    console.error(`Error updating taxonomies for language ${languageId}:`, error);
  }
}

/**
 * Gets available taxonomy types for a city (for mapping UI)
 *
 * @param citySlug - City slug
 * @returns Promise resolving to taxonomy types with values
 */
export async function getTaxonomyTypesForMapping(citySlug: string): Promise<{
  id: string;
  slug: string;
  name: string;
  values: { id: string; slug: string; name: string }[];
}[]> {
  try {
    if (!citySlug) {
      throw new Error('City slug is required');
    }

    const supabase = getDatabaseClient(citySlug);

    // Get city ID
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .single();

    if (cityError || !city) {
      throw new Error(`City not found: ${citySlug}`);
    }

    // Get taxonomy types with translations and values
    const { data: taxonomyTypes, error: typesError } = await supabase
      .from('taxonomy_types')
      .select(`
        id,
        slug,
        translations:taxonomy_type_translations!inner(name),
        values:taxonomy_values(
          id,
          slug,
          translations:taxonomy_value_translations!inner(name)
        )
      `)
      .eq('city_id', city.id)
      .eq('translations.locale_code', 'en')
      .eq('values.translations.locale_code', 'en')
      .order('slug', { ascending: true });

    if (typesError) {
      throw new Error(`Failed to fetch taxonomy types: ${typesError.message}`);
    }

    // Transform to simpler structure
    return (taxonomyTypes || []).map(type => ({
      id: type.id,
      slug: type.slug,
      name: type.translations?.[0]?.name || type.slug,
      values: (type.values || []).map(value => ({
        id: value.id,
        slug: value.slug,
        name: value.translations?.[0]?.name || value.slug
      }))
    }));
  } catch (error) {
    // Log error for debugging
    console.error('Error fetching taxonomy types for mapping:', error);
    throw error;
  }
}
