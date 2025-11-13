/**
 * Integration Test: Complete Operator CRUD Flow
 *
 * Tests the full workflow from creating geographic entities (districts, neighborhoods)
 * through taxonomy setup and language data management to descriptions.
 *
 * Flow: District → Neighborhood → Taxonomy Type → Taxonomy Value → Language Family
 * → Language (with taxonomy assignment) → Language Point → Description → Translation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables for testing');
}

const supabase = createClient(supabaseUrl, supabaseKey);

describe('Operator CRUD Flow Integration Tests', () => {
  // Test data IDs to track throughout the flow
  let testCityId: string;
  let testDistrictId: string;
  let testNeighborhoodId: string;
  let testTaxonomyTypeId: string;
  let testTaxonomyValueId: string;
  let testLanguageFamilyId: string;
  let testLanguageId: string;
  let testLanguagePointId: string;
  let testDescriptionId: string;
  let testCountryId: string;

  beforeAll(async () => {
    // Verify test locale exists
    const { data: locales } = await supabase
      .from('locales')
      .select('code')
      .eq('code', 'en')
      .single();

    if (!locales) {
      throw new Error('English locale not found. Please run seed data first.');
    }

    // Get or create test world region
    const { data: existingRegion } = await supabase
      .from('world_regions')
      .select('id')
      .eq('slug', 'europe')
      .single();

    const worldRegionId = existingRegion?.id;

    if (!worldRegionId) {
      throw new Error('No world region found. Please run seed data first.');
    }

    // Get or create test country
    const { data: existingCountry } = await supabase
      .from('countries')
      .select('id')
      .eq('iso_code_2', 'TC')
      .single();

    if (existingCountry) {
      testCountryId = existingCountry.id;
    } else {
      const { data: country, error } = await supabase
        .from('countries')
        .insert({
          world_region_id: worldRegionId,
          slug: 'test-country',
          iso_code_2: 'TC',
          iso_code_3: 'TST'
        })
        .select('id')
        .single();

      if (error) throw new Error(`Failed to create test country: ${error.message}`);
      testCountryId = country.id;

      // Create country translation
      await supabase
        .from('country_translations')
        .insert({
          country_id: country.id,
          locale_code: 'en',
          name: 'Test Country'
        });
    }

    // Create test city
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .insert({
        slug: `test-city-${Date.now()}`,
        country_id: testCountryId,
        center_lat: 52.0,
        center_lng: 4.0
      })
      .select('id')
      .single();

    if (cityError) throw new Error(`Failed to create test city: ${cityError.message}`);
    testCityId = city.id;

    // Create city locale
    await supabase
      .from('city_locales')
      .insert({
        city_id: testCityId,
        locale_code: 'en',
        is_enabled: true
      });

    // Create city translations
    await supabase
      .from('city_translations')
      .insert({
        city_id: testCityId,
        locale_code: 'en',
        name: 'Test City for CRUD Flow',
        description: 'A test city for integration testing'
      });
  });

  afterAll(async () => {
    // Cleanup: Delete test data in reverse order of dependencies
    if (testDescriptionId) {
      await supabase.from('description_translations').delete().eq('description_id', testDescriptionId);
      await supabase.from('descriptions').delete().eq('id', testDescriptionId);
    }
    if (testLanguagePointId) {
      await supabase.from('language_points').delete().eq('id', testLanguagePointId);
    }
    if (testLanguageId) {
      await supabase.from('language_translations').delete().eq('language_id', testLanguageId);
      await supabase.from('language_taxonomies').delete().eq('language_id', testLanguageId);
      await supabase.from('languages').delete().eq('id', testLanguageId);
    }
    if (testLanguageFamilyId) {
      await supabase.from('language_family_translations').delete().eq('family_id', testLanguageFamilyId);
      await supabase.from('language_families').delete().eq('id', testLanguageFamilyId);
    }
    if (testTaxonomyValueId) {
      await supabase.from('taxonomy_value_translations').delete().eq('taxonomy_value_id', testTaxonomyValueId);
      await supabase.from('taxonomy_values').delete().eq('id', testTaxonomyValueId);
    }
    if (testTaxonomyTypeId) {
      await supabase.from('taxonomy_type_translations').delete().eq('taxonomy_type_id', testTaxonomyTypeId);
      await supabase.from('taxonomy_types').delete().eq('id', testTaxonomyTypeId);
    }
    if (testNeighborhoodId) {
      await supabase.from('neighborhood_translations').delete().eq('neighborhood_id', testNeighborhoodId);
      await supabase.from('neighborhoods').delete().eq('id', testNeighborhoodId);
    }
    if (testDistrictId) {
      await supabase.from('district_translations').delete().eq('district_id', testDistrictId);
      await supabase.from('districts').delete().eq('id', testDistrictId);
    }
    if (testCityId) {
      await supabase.from('city_translations').delete().eq('city_id', testCityId);
      await supabase.from('city_locales').delete().eq('city_id', testCityId);
      await supabase.from('cities').delete().eq('id', testCityId);
    }
    // Note: We don't delete the test country as it may be used by other tests
  });

  describe('Step 1: District CRUD', () => {
    it('should create a district with translations', async () => {
      const { data: district, error } = await supabase
        .from('districts')
        .insert({
          city_id: testCityId,
          slug: 'test-district'
        })
        .select('id')
        .single();

      expect(error).toBeNull();
      expect(district).toBeDefined();
      expect(district?.id).toBeTruthy();
      testDistrictId = district!.id;

      // Create translation
      const { error: translationError } = await supabase
        .from('district_translations')
        .insert({
          district_id: testDistrictId,
          locale_code: 'en',
          name: 'Test District'
        });

      expect(translationError).toBeNull();
    });

    it('should read district with translations', async () => {
      const { data: district, error } = await supabase
        .from('districts')
        .select(`
          *,
          translations:district_translations(*)
        `)
        .eq('id', testDistrictId)
        .single();

      expect(error).toBeNull();
      expect(district).toBeDefined();
      expect(district?.translations).toHaveLength(1);
      expect(district?.translations[0].name).toBe('Test District');
    });

    it('should update district', async () => {
      const { error } = await supabase
        .from('districts')
        .update({ slug: 'test-district-updated' })
        .eq('id', testDistrictId);

      expect(error).toBeNull();

      const { data: updated } = await supabase
        .from('districts')
        .select('slug')
        .eq('id', testDistrictId)
        .single();

      expect(updated?.slug).toBe('test-district-updated');
    });
  });

  describe('Step 2: Neighborhood CRUD', () => {
    it('should create a neighborhood linked to district', async () => {
      const { data: neighborhood, error } = await supabase
        .from('neighborhoods')
        .insert({
          district_id: testDistrictId,
          slug: 'test-neighborhood'
        })
        .select('id')
        .single();

      expect(error).toBeNull();
      expect(neighborhood).toBeDefined();
      testNeighborhoodId = neighborhood!.id;

      // Create translation
      const { error: translationError } = await supabase
        .from('neighborhood_translations')
        .insert({
          neighborhood_id: testNeighborhoodId,
          locale_code: 'en',
          name: 'Test Neighborhood'
        });

      expect(translationError).toBeNull();
    });

    it('should read neighborhood with district relationship', async () => {
      const { data: neighborhood, error } = await supabase
        .from('neighborhoods')
        .select(`
          *,
          translations:neighborhood_translations(*),
          district:districts(
            *,
            translations:district_translations(*)
          )
        `)
        .eq('id', testNeighborhoodId)
        .single();

      expect(error).toBeNull();
      expect(neighborhood).toBeDefined();
      expect(neighborhood?.district).toBeDefined();
      expect(neighborhood?.district?.id).toBe(testDistrictId);
    });

    it('should validate that neighborhood requires a district', async () => {
      const { error } = await supabase
        .from('neighborhoods')
        .insert({
          district_id: null, // Invalid: should fail
          slug: 'invalid-neighborhood'
        });

      expect(error).toBeDefined();
      expect(error?.message).toContain('null value');
    });
  });

  describe('Step 3: Taxonomy Type CRUD', () => {
    it('should create a taxonomy type with configuration', async () => {
      const { data: taxonomyType, error } = await supabase
        .from('taxonomy_types')
        .insert({
          city_id: testCityId,
          slug: 'test-size',
          is_required: true,
          allow_multiple: false,
          use_for_map_styling: true,
          use_for_filtering: true
        })
        .select('id')
        .single();

      expect(error).toBeNull();
      expect(taxonomyType).toBeDefined();
      testTaxonomyTypeId = taxonomyType!.id;

      // Create translation
      const { error: translationError } = await supabase
        .from('taxonomy_type_translations')
        .insert({
          taxonomy_type_id: testTaxonomyTypeId,
          locale_code: 'en',
          name: 'Community Size',
          description: 'Size of the language community'
        });

      expect(translationError).toBeNull();
    });

    it('should read taxonomy type with translations', async () => {
      const { data: taxonomyType, error } = await supabase
        .from('taxonomy_types')
        .select(`
          *,
          translations:taxonomy_type_translations(*)
        `)
        .eq('id', testTaxonomyTypeId)
        .single();

      expect(error).toBeNull();
      expect(taxonomyType).toBeDefined();
      expect(taxonomyType?.translations).toHaveLength(1);
      expect(taxonomyType?.translations[0].name).toBe('Community Size');
      expect(taxonomyType?.use_for_map_styling).toBe(true);
    });
  });

  describe('Step 4: Taxonomy Value CRUD', () => {
    it('should create a taxonomy value with visual styling', async () => {
      const { data: taxonomyValue, error } = await supabase
        .from('taxonomy_values')
        .insert({
          taxonomy_type_id: testTaxonomyTypeId,
          slug: 'small',
          color_hex: '#FFA500',
          icon_name: 'circle',
          icon_size_multiplier: 0.8,
          display_order: 1
        })
        .select('id')
        .single();

      expect(error).toBeNull();
      expect(taxonomyValue).toBeDefined();
      testTaxonomyValueId = taxonomyValue!.id;

      // Create translation
      const { error: translationError } = await supabase
        .from('taxonomy_value_translations')
        .insert({
          taxonomy_value_id: testTaxonomyValueId,
          locale_code: 'en',
          name: 'Small Community',
          description: 'Fewer than 1,000 speakers'
        });

      expect(translationError).toBeNull();
    });

    it('should read taxonomy value with parent type and translations', async () => {
      const { data: taxonomyValue, error } = await supabase
        .from('taxonomy_values')
        .select(`
          *,
          translations:taxonomy_value_translations(*),
          taxonomy_type:taxonomy_types(
            *,
            translations:taxonomy_type_translations(*)
          )
        `)
        .eq('id', testTaxonomyValueId)
        .single();

      expect(error).toBeNull();
      expect(taxonomyValue).toBeDefined();
      expect(taxonomyValue?.taxonomy_type).toBeDefined();
      expect(taxonomyValue?.taxonomy_type?.id).toBe(testTaxonomyTypeId);
      expect(taxonomyValue?.color_hex).toBe('#FFA500');
      expect(taxonomyValue?.icon_size_multiplier).toBe(0.8);
    });
  });

  describe('Step 5: Language Family CRUD', () => {
    it('should create a language family with translations', async () => {
      const { data: languageFamily, error } = await supabase
        .from('language_families')
        .insert({
          slug: 'test-family'
        })
        .select('id')
        .single();

      expect(error).toBeNull();
      expect(languageFamily).toBeDefined();
      testLanguageFamilyId = languageFamily!.id;

      // Create translation
      const { error: translationError } = await supabase
        .from('language_family_translations')
        .insert({
          family_id: testLanguageFamilyId,
          locale_code: 'en',
          name: 'Test Language Family'
        });

      expect(translationError).toBeNull();
    });

    it('should read language family with translations', async () => {
      const { data: languageFamily, error } = await supabase
        .from('language_families')
        .select(`
          *,
          translations:language_family_translations(*)
        `)
        .eq('id', testLanguageFamilyId)
        .single();

      expect(error).toBeNull();
      expect(languageFamily).toBeDefined();
      expect(languageFamily?.translations).toHaveLength(1);
      expect(languageFamily?.translations[0].name).toBe('Test Language Family');
    });
  });

  describe('Step 6: Language CRUD with Taxonomy Assignment', () => {
    it('should create a language with taxonomy assignment', async () => {
      const { data: language, error } = await supabase
        .from('languages')
        .insert({
          city_id: testCityId,
          endonym: 'Test Language',
          iso_639_3_code: 'tst',
          language_family_id: testLanguageFamilyId,
          country_of_origin_id: testCountryId
        })
        .select('id')
        .single();

      expect(error).toBeNull();
      expect(language).toBeDefined();
      testLanguageId = language!.id;

      // Create translation
      const { error: translationError } = await supabase
        .from('language_translations')
        .insert({
          language_id: testLanguageId,
          locale_code: 'en',
          name: 'Test Language'
        });

      expect(translationError).toBeNull();

      // Assign taxonomy value
      const { error: taxonomyError } = await supabase
        .from('language_taxonomies')
        .insert({
          language_id: testLanguageId,
          taxonomy_value_id: testTaxonomyValueId
        });

      expect(taxonomyError).toBeNull();
    });

    it('should read language with all relationships', async () => {
      const { data: language, error } = await supabase
        .from('languages')
        .select(`
          *,
          translations:language_translations(*),
          language_family:language_families(
            *,
            translations:language_family_translations(*)
          ),
          country_of_origin:countries(*),
          taxonomies:language_taxonomies(
            taxonomy_value:taxonomy_values(
              *,
              translations:taxonomy_value_translations(*),
              taxonomy_type:taxonomy_types(
                *,
                translations:taxonomy_type_translations(*)
              )
            )
          )
        `)
        .eq('id', testLanguageId)
        .single();

      expect(error).toBeNull();
      expect(language).toBeDefined();
      expect(language?.endonym).toBe('Test Language');
      expect(language?.language_family).toBeDefined();
      expect(language?.country_of_origin).toBeDefined();
      expect(language?.taxonomies).toHaveLength(1);
      expect(language?.taxonomies[0].taxonomy_value?.slug).toBe('small');
    });

    it('should validate that language requires city_id', async () => {
      const { error } = await supabase
        .from('languages')
        .insert({
          city_id: null, // Invalid: should fail
          endonym: 'Invalid Language',
          iso_639_3_code: 'inv'
        });

      expect(error).toBeDefined();
      expect(error?.message).toContain('null value');
    });
  });

  describe('Step 7: Language Point CRUD', () => {
    it('should create a language point with geographic coordinates', async () => {
      const { data: languagePoint, error } = await supabase
        .from('language_points')
        .insert({
          city_id: testCityId,
          language_id: testLanguageId,
          neighborhood_id: testNeighborhoodId,
          latitude: 52.12,
          longitude: 4.12,
          postal_code: '1234AB',
          community_name: 'Test Community',
          notes: 'Test language point'
        })
        .select('id')
        .single();

      expect(error).toBeNull();
      expect(languagePoint).toBeDefined();
      testLanguagePointId = languagePoint!.id;
    });

    it('should read language point with language and neighborhood', async () => {
      const { data: languagePoint, error } = await supabase
        .from('language_points')
        .select(`
          *,
          language:languages(
            *,
            translations:language_translations(*)
          ),
          neighborhood:neighborhoods(
            *,
            translations:neighborhood_translations(*)
          )
        `)
        .eq('id', testLanguagePointId)
        .single();

      expect(error).toBeNull();
      expect(languagePoint).toBeDefined();
      expect(languagePoint?.language).toBeDefined();
      expect(languagePoint?.language?.id).toBe(testLanguageId);
      expect(languagePoint?.neighborhood).toBeDefined();
      expect(languagePoint?.neighborhood?.id).toBe(testNeighborhoodId);
      expect(languagePoint?.latitude).toBe(52.12);
      expect(languagePoint?.longitude).toBe(4.12);
    });

    it('should validate latitude and longitude ranges', async () => {
      const { error: latError } = await supabase
        .from('language_points')
        .insert({
          city_id: testCityId,
          language_id: testLanguageId,
          latitude: 100, // Invalid: > 90
          longitude: 4.0
        });

      expect(latError).toBeDefined();

      const { error: lngError } = await supabase
        .from('language_points')
        .insert({
          city_id: testCityId,
          language_id: testLanguageId,
          latitude: 52.0,
          longitude: 200 // Invalid: > 180
        });

      expect(lngError).toBeDefined();
    });
  });

  describe('Step 8: Description CRUD', () => {
    it('should create a description linked to language and neighborhood', async () => {
      const { data: description, error } = await supabase
        .from('descriptions')
        .insert({
          city_id: testCityId,
          language_id: testLanguageId,
          neighborhood_id: testNeighborhoodId,
          is_ai_generated: false
        })
        .select('id')
        .single();

      expect(error).toBeNull();
      expect(description).toBeDefined();
      testDescriptionId = description!.id;

      // Create translation
      const { error: translationError } = await supabase
        .from('description_translations')
        .insert({
          description_id: testDescriptionId,
          locale: 'en',
          text: 'This is a test description for the test language in the test neighborhood.'
        });

      expect(translationError).toBeNull();
    });

    it('should read description with all relationships', async () => {
      const { data: description, error } = await supabase
        .from('descriptions')
        .select(`
          *,
          translations:description_translations(*),
          language:languages(
            *,
            translations:language_translations(*)
          ),
          neighborhood:neighborhoods(
            *,
            translations:neighborhood_translations(*)
          )
        `)
        .eq('id', testDescriptionId)
        .single();

      expect(error).toBeNull();
      expect(description).toBeDefined();
      expect(description?.language).toBeDefined();
      expect(description?.language?.id).toBe(testLanguageId);
      expect(description?.neighborhood).toBeDefined();
      expect(description?.neighborhood?.id).toBe(testNeighborhoodId);
      expect(description?.translations).toHaveLength(1);
    });

    it('should prevent duplicate language-neighborhood combinations', async () => {
      const { error } = await supabase
        .from('descriptions')
        .insert({
          city_id: testCityId,
          language_id: testLanguageId,
          neighborhood_id: testNeighborhoodId,
          is_ai_generated: false
        });

      expect(error).toBeDefined();
      expect(error?.message).toContain('duplicate');
    });
  });

  describe('Step 9: Description Translation CRUD', () => {
    it('should add multiple language translations for a description', async () => {
      const { error: nlError } = await supabase
        .from('description_translations')
        .insert({
          description_id: testDescriptionId,
          locale: 'nl',
          text: 'Dit is een testbeschrijving voor de testtaal in de testbuurt.'
        });

      expect(nlError).toBeNull();

      const { error: frError } = await supabase
        .from('description_translations')
        .insert({
          description_id: testDescriptionId,
          locale: 'fr',
          text: 'Ceci est une description de test pour la langue de test dans le quartier de test.'
        });

      expect(frError).toBeNull();
    });

    it('should read all translations for a description', async () => {
      const { data: translations, error } = await supabase
        .from('description_translations')
        .select('*')
        .eq('description_id', testDescriptionId)
        .order('locale');

      expect(error).toBeNull();
      expect(translations).toBeDefined();
      expect(translations).toHaveLength(3); // en, nl, fr
      expect(translations?.map(t => t.locale)).toEqual(['en', 'fr', 'nl']);
    });
  });

  describe('Step 10: Complete Flow Query', () => {
    it('should query complete data hierarchy in a single query', async () => {
      const { data: city, error } = await supabase
        .from('cities')
        .select(`
          *,
          translations:city_translations(*),
          districts:districts(
            *,
            translations:district_translations(*),
            neighborhoods:neighborhoods(
              *,
              translations:neighborhood_translations(*)
            )
          ),
          taxonomy_types:taxonomy_types(
            *,
            translations:taxonomy_type_translations(*),
            values:taxonomy_values(
              *,
              translations:taxonomy_value_translations(*)
            )
          ),
          languages:languages(
            *,
            translations:language_translations(*),
            taxonomies:language_taxonomies(
              taxonomy_value:taxonomy_values(
                *,
                translations:taxonomy_value_translations(*)
              )
            ),
            points:language_points(*),
            descriptions:descriptions(
              *,
              translations:description_translations(*)
            )
          )
        `)
        .eq('id', testCityId)
        .single();

      expect(error).toBeNull();
      expect(city).toBeDefined();
      expect(city?.districts).toBeDefined();
      expect(city?.districts?.length).toBeGreaterThan(0);
      expect(city?.districts?.[0].neighborhoods).toBeDefined();
      expect(city?.taxonomy_types).toBeDefined();
      expect(city?.taxonomy_types?.length).toBeGreaterThan(0);
      expect(city?.languages).toBeDefined();
      expect(city?.languages?.length).toBeGreaterThan(0);
    });

    it('should query language with full geographic and taxonomy context', async () => {
      const { data: language, error } = await supabase
        .from('languages')
        .select(`
          *,
          translations:language_translations(*),
          language_family:language_families(
            *,
            translations:language_family_translations(*)
          ),
          taxonomies:language_taxonomies(
            taxonomy_value:taxonomy_values(
              *,
              translations:taxonomy_value_translations(*),
              taxonomy_type:taxonomy_types(
                *,
                translations:taxonomy_type_translations(*)
              )
            )
          ),
          points:language_points(
            *,
            neighborhood:neighborhoods(
              *,
              translations:neighborhood_translations(*),
              district:districts(
                *,
                translations:district_translations(*)
              )
            )
          ),
          descriptions:descriptions(
            *,
            translations:description_translations(*),
            neighborhood:neighborhoods(
              *,
              translations:neighborhood_translations(*)
            )
          )
        `)
        .eq('id', testLanguageId)
        .eq('translations.locale_code', 'en')
        .single();

      expect(error).toBeNull();
      expect(language).toBeDefined();
      expect(language?.translations).toBeDefined();
      expect(language?.language_family).toBeDefined();
      expect(language?.taxonomies).toHaveLength(1);
      expect(language?.points).toBeDefined();
      expect(language?.points?.length).toBeGreaterThan(0);
      expect(language?.points?.[0].neighborhood).toBeDefined();
      expect(language?.descriptions).toBeDefined();
      expect(language?.descriptions?.length).toBeGreaterThan(0);
    });
  });

  describe('Data Validation Tests', () => {
    it('should enforce required fields', async () => {
      // Test district without city_id
      const { error: districtError } = await supabase
        .from('districts')
        .insert({
          slug: 'no-city',
          center_lat: 52.0,
          center_lng: 4.0
        });
      expect(districtError).toBeDefined();

      // Test language without city_id
      const { error: languageError } = await supabase
        .from('languages')
        .insert({
          endonym: 'No City Language'
        });
      expect(languageError).toBeDefined();
    });

    it('should enforce unique constraints', async () => {
      // Test duplicate district slug in same city
      const { error } = await supabase
        .from('districts')
        .insert({
          city_id: testCityId,
          slug: 'test-district', // Already exists
          center_lat: 52.0,
          center_lng: 4.0
        });
      expect(error).toBeDefined();
    });

    it('should enforce foreign key constraints', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      // Test neighborhood with invalid district_id
      const { error } = await supabase
        .from('neighborhoods')
        .insert({
          district_id: fakeId,
          slug: 'invalid-district',
          center_lat: 52.0,
          center_lng: 4.0
        });
      expect(error).toBeDefined();
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle invalid data types gracefully', async () => {
      // Test invalid latitude type
      const { error } = await supabase
        .from('language_points')
        .insert({
          city_id: testCityId,
          language_id: testLanguageId,
          latitude: 'invalid' as unknown as number,
          longitude: 4.0
        });
      expect(error).toBeDefined();
    });

    it('should handle missing required translations', async () => {
      // Query language without translation for a specific locale
      const { data: language } = await supabase
        .from('languages')
        .select(`
          *,
          translations:language_translations!inner(*)
        `)
        .eq('id', testLanguageId)
        .eq('translations.locale_code', 'de') // German translation doesn't exist
        .maybeSingle();

      // Should return null since no German translation exists
      expect(language).toBeNull();
    });
  });

  describe('Performance Tests', () => {
    it('should execute complex queries efficiently', async () => {
      const startTime = Date.now();

      await supabase
        .from('languages')
        .select(`
          *,
          translations:language_translations(*),
          taxonomies:language_taxonomies(
            taxonomy_value:taxonomy_values(
              *,
              translations:taxonomy_value_translations(*)
            )
          ),
          points:language_points(*)
        `)
        .eq('city_id', testCityId);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Query should complete in under 2 seconds
      expect(duration).toBeLessThan(2000);
    });
  });
});
