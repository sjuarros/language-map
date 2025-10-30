/**
 * Database Setup Verification Script
 *
 * Tests that the database schema and seed data are correctly set up.
 * Run with: npx tsx scripts/test-db-setup.ts
 */

import { createClient } from '@supabase/supabase-js'

// Define types for database entities
interface Locale {
  code: string
  name: string
  is_default: boolean
}

interface City {
  id: string
  slug: string
  name: string
  status: string
  center_lat: number
  center_lng: number
  default_zoom: number
}

interface CityTranslation {
  city_id: string
  locale_code: string
  name: string
  description?: string
}

interface Country {
  id: string
  name: string
  iso_code_2: string
  iso_code_3: string
  slug: string
}

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54331'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Validate required environment variables
if (!SUPABASE_URL) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL not found in environment variables')
  console.error('Please copy .env.example to .env.local and set the Supabase keys')
  process.exit(1)
}

if (!SUPABASE_ANON_KEY) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_ANON_KEY not found in environment variables')
  console.error('Please copy .env.example to .env.local and set the Supabase keys')
  process.exit(1)
}

// Create client with error handling
let supabase: ReturnType<typeof createClient>

try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  console.log('✅ Connected to Supabase')
} catch (error) {
  if (error instanceof Error) {
    console.error('❌ Failed to initialize Supabase client:', error.message)
  } else {
    console.error('❌ Failed to initialize Supabase client: Unknown error')
  }
  process.exit(1)
}

async function testDatabaseSetup() {
  console.log('🧪 Testing Database Setup...\n')

  let testsPassed = 0
  let testsFailed = 0

  // Test 1: Check locales table
  console.log('1️⃣  Testing locales table...')
  const { data: locales, error: localesError } = await supabase
    .from('locales')
    .select('*')

  if (localesError) {
    console.error('   ❌ Failed:', localesError.message)
    testsFailed++
  } else if (locales && locales.length >= 3) {
    console.log(`   ✅ Found ${locales.length} locales`)
    console.log(`      ${locales.map((l: Locale) => l.code).join(', ')}`)
    testsPassed++
  } else {
    console.log('   ⚠️  Expected at least 3 locales, found', locales?.length || 0)
    testsFailed++
  }

  // Test 2: Check world_regions table
  console.log('\n2️⃣  Testing world_regions table...')
  const { data: worldRegions, error: worldRegionsError } = await supabase
    .from('world_regions')
    .select('*')

  if (worldRegionsError) {
    console.error('   ❌ Failed:', worldRegionsError.message)
    testsFailed++
  } else if (worldRegions && worldRegions.length > 0) {
    console.log(`   ✅ Found ${worldRegions.length} world regions`)
    testsPassed++
  } else {
    console.log('   ❌ No world regions found')
    testsFailed++
  }

  // Test 3: Check cities table
  console.log('\n3️⃣  Testing cities table...')
  const { data: cities, error: citiesError } = await supabase
    .from('cities')
    .select('*')

  if (citiesError) {
    console.error('   ❌ Failed:', citiesError.message)
    testsFailed++
  } else if (cities && cities.length > 0) {
    console.log(`   ✅ Found ${cities.length} cities`)
    console.log(`      Cities: ${(cities as City[]).map(c => c.slug).join(', ')}`)
    testsPassed++
  } else {
    console.log('   ❌ No cities found')
    testsFailed++
  }

  // Test 4: Check Amsterdam city specifically
  console.log('\n4️⃣  Testing Amsterdam city data...')
  const { data: amsterdam, error: amsterdamError } = await supabase
    .from('cities')
    .select('*')
    .eq('slug', 'amsterdam')
    .single()

  if (amsterdamError) {
    console.error('   ❌ Failed:', amsterdamError.message)
    testsFailed++
  } else if (amsterdam) {
    const amsterdamData = amsterdam as City
    console.log('   ✅ Amsterdam found')
    console.log(`      Status: ${amsterdamData.status}`)
    console.log(`      Coordinates: ${amsterdamData.center_lat}, ${amsterdamData.center_lng}`)
    console.log(`      Zoom: ${amsterdamData.default_zoom}`)
    testsPassed++
  }

  // Test 5: Check translations
  console.log('\n5️⃣  Testing translations...')
  const { data: translations, error: translationsError } = await supabase
    .from('city_translations')
    .select('*')

  if (translationsError) {
    console.error('   ❌ Failed:', translationsError.message)
    testsFailed++
  } else if (translations && translations.length > 0) {
    console.log(`   ✅ Found ${translations.length} city translations`)
    const locales = [...new Set(translations.map((t: CityTranslation) => t.locale_code))]
    console.log(`      Locales: ${locales.join(', ')}`)
    testsPassed++
  } else {
    console.log('   ❌ No translations found')
    testsFailed++
  }

  // Test 6: Check Netherlands country
  console.log('\n6️⃣  Testing Netherlands country...')
  const { data: netherlands, error: netherlandsError } = await supabase
    .from('countries')
    .select('*')
    .eq('iso_code_2', 'NL')
    .single()

  if (netherlandsError) {
    console.error('   ❌ Failed:', netherlandsError.message)
    testsFailed++
  } else if (netherlands) {
    const netherlandsData = netherlands as Country
    console.log('   ✅ Netherlands found')
    console.log(`      ISO codes: ${netherlandsData.iso_code_2} / ${netherlandsData.iso_code_3}`)
    testsPassed++
  }

  // Test 7: Check city_locales
  console.log('\n7️⃣  Testing city locales configuration...')
  const { data: cityLocales, error: cityLocalesError } = await supabase
    .from('city_locales')
    .select('*')

  if (cityLocalesError) {
    console.error('   ❌ Failed:', cityLocalesError.message)
    testsFailed++
  } else if (cityLocales && cityLocales.length > 0) {
    console.log(`   ✅ Found ${cityLocales.length} city locale configurations`)
    testsPassed++
  } else {
    console.log('   ❌ No city locales found')
    testsFailed++
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Test Summary')
  console.log('='.repeat(50))
  console.log(`Total tests: ${testsPassed + testsFailed}`)
  console.log(`✅ Passed: ${testsPassed}`)
  console.log(`❌ Failed: ${testsFailed}`)

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Database setup is complete.')
    console.log('\nNext steps:')
    console.log('  1. Review the seeded data in Supabase Studio: http://localhost:54333')
    console.log('  2. Proceed to Day 3: Implement database abstraction layer')
    return true
  } else {
    console.log('\n⚠️  Some tests failed. Please check the database setup.')
    console.log('\nTroubleshooting:')
    console.log('  1. Ensure Supabase is running: npx supabase start')
    console.log('  2. Check migration status: npx supabase db status')
    console.log('  3. Apply migrations: npx supabase db push')
    console.log('  4. Seed data: npx supabase db reset')
    return false
  }
}

// Run tests
testDatabaseSetup()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    if (error instanceof Error) {
      console.error('\n❌ Unexpected error:', error.message)
      console.error('Stack trace:', error.stack)
    } else {
      console.error('\n❌ Unexpected error:', String(error))
    }
    process.exit(1)
  })
