# Phase 2 Manual Testing Plan - Language Data Management

**Feature:** Language families and language data management with translations
**Date:** November 10, 2025
**Environment:** Local development (Supabase + Next.js)
**Status:** 🟡 IN PROGRESS - Language Families & Languages CRUD complete, Points/Descriptions/AI pending

---

## Document Overview

This testing plan covers all language-related functionality in Phase 2:

### ✅ Completed Testing Documentation
- **Day 22 (November 5, 2025) - Language Families CRUD:**
  - Full implementation with atomic transactions
  - Delete confirmation dialog with loading states and error handling
  - 36 unit/component tests passing
  - 10 testing sections with 44 test scenarios

- **Day 23 (November 10, 2025) - Languages CRUD:**
  - Full CRUD operations with translations (EN/NL/FR)
  - Universal endonym field (not translated)
  - ISO 639-3 code support
  - Flexible taxonomy assignment with multi-select support
  - Dynamic taxonomy UI based on city configuration
  - Visual taxonomy badges with colors
  - 23 unit tests passing (all scenarios covered)
  - 12 testing sections with 56 test scenarios

### 🔄 Pending (Days 24-26)
- **Language Points (Days 24-25):** Geographic locations where languages are spoken
- **Descriptions (Days 25-26):** Community stories and descriptions
- **AI Features (Day 26):** Description generation and translation assistance

**This document will be extended** as each feature is implemented.

---

## Prerequisites

Before starting, ensure:
- ✅ Supabase is running on ports 54331-54336
- ✅ Next.js dev server is running on port 3001
- ✅ You have test user credentials:
  - `superuser@example.com` (superuser role)
  - `admin-ams@example.com` (admin role, Amsterdam access)
  - `operator-ams@example.com` (operator role, Amsterdam access)
- ✅ Phase 1 testing complete (auth, cities, districts, neighborhoods, taxonomies)

### Check Services Status

```bash
# Check Supabase
npx supabase status

# Expected output:
# API URL: http://localhost:54331
# Studio URL: http://localhost:54333
```

### Verify Database State

```bash
# Check language families table exists
docker exec supabase_db_language-map psql -U postgres -d postgres -c "\d language_families"

# Check language family translations table exists
docker exec supabase_db_language-map psql -U postgres -d postgres -c "\d language_family_translations"

# Check RPC functions exist
docker exec supabase_db_language-map psql -U postgres -d postgres -c "\df create_language_family_with_translations"
docker exec supabase_db_language-map psql -U postgres -d postgres -c "\df update_language_family_with_translations"

# Check test users and city access
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT up.email, up.role, c.slug, cu.role as city_role FROM city_users cu JOIN user_profiles up ON cu.user_id = up.id JOIN cities c ON cu.city_id = c.id WHERE up.email IN ('operator-ams@example.com', 'admin-ams@example.com') ORDER BY up.email"
```

Expected output: Both users should have Amsterdam access

---

## Test Scenarios

## Part 1: Language Families (Day 22 - Completed November 5, 2025)

### 1. Language Families - Access Control ✓

#### 1.1 Operator Access to Language Families

**Steps:**
1. Log in as operator: `operator-ams@example.com`
2. Navigate to http://localhost:3001/en/operator/amsterdam/language-families
3. Observe the page content

**Expected Result:**
- ✅ Page loads successfully with "Language Families" heading
- ✅ Shows "Manage language families for Amsterdam" subtitle
- ✅ "Add Language Family" button visible
- ✅ User has Amsterdam access (RLS check passes)

**Database Verification:**
```bash
# Verify operator has Amsterdam access
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT up.email, c.slug, cu.role FROM city_users cu JOIN user_profiles up ON cu.user_id = up.id JOIN cities c ON cu.city_id = c.id WHERE up.email = 'operator-ams@example.com'"
```

Expected: 1 row with slug='amsterdam'

---

#### 1.2 Admin Access

**Steps:**
1. Log in as admin: `admin-ams@example.com`
2. Navigate to http://localhost:3001/en/operator/amsterdam/language-families

**Expected Result:**
- ✅ Page loads successfully
- ✅ Full CRUD access available
- ✅ Admin can perform all operations

---

#### 1.3 Superuser Access

**Steps:**
1. Log in as superuser: `superuser@example.com`
2. Navigate to http://localhost:3001/en/operator/amsterdam/language-families

**Expected Result:**
- ✅ Page loads successfully
- ✅ Superuser has implicit access to all cities
- ✅ Can access Amsterdam, Rotterdam, Utrecht language families

---

#### 1.4 Cross-City Access Restriction

**Steps:**
1. Log in as operator: `operator-ams@example.com` (Amsterdam only)
2. Try to access: http://localhost:3001/en/operator/rotterdam/language-families

**Expected Result:**
- ✅ Access denied (redirect or error)
- ✅ RLS policies prevent unauthorized access
- ✅ No data exposure for unauthorized cities

---

### 2. Language Families - List View ✓

#### 2.1 Empty State

**Prerequisites:** No language families exist for Amsterdam

**Steps:**
1. Navigate to http://localhost:3001/en/operator/amsterdam/language-families
2. Observe empty state

**Expected Result:**
- ✅ Shows "No Language Families Yet" message
- ✅ Description explains language families are global entities
- ✅ "Create Language Family" button present
- ✅ Links to create page: `/en/operator/amsterdam/language-families/new`

**Database Verification:**
```bash
# Verify no language families exist
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT COUNT(*) FROM language_families"
```

Expected: 0

---

#### 2.2 List with Data

**Prerequisites:** Language families exist

**Steps:**
1. Create test language families (see Test 3.1)
2. Return to list page
3. Observe language family cards

**Expected Result:**
- ✅ Shows grid of language family cards
- ✅ Each card displays:
  - Family icon (Languages icon)
  - Family name (translated to current locale)
  - Description (if available, truncated to 2 lines)
  - Slug
  - Translation locales list (e.g., "en, nl, fr")
  - "Edit" button
- ✅ Cards are sorted by creation date (oldest first)

**Database Verification:**
```bash
# List all language families with translation count
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT lf.slug, lf.created_at, COUNT(DISTINCT lft.locale_code) as translation_count FROM language_families lf LEFT JOIN language_family_translations lft ON lf.id = lft.family_id GROUP BY lf.id, lf.slug, lf.created_at ORDER BY lf.created_at"
```

---

#### 2.3 Translation Display in Different Locales

**Prerequisites:** Language family with multiple translations exists

**Steps:**
1. Create a language family with en, nl, fr translations
2. View list in different locales:
   - http://localhost:3001/en/operator/amsterdam/language-families (English)
   - http://localhost:3001/nl/operator/amsterdam/language-families (Dutch)
   - http://localhost:3001/fr/operator/amsterdam/language-families (French)

**Expected Result:**
- ✅ Family names display in current locale when available
- ✅ Falls back to English if translation missing
- ✅ Translation badges show all available locales
- ✅ Page UI remains in current locale
- ✅ No console errors

**Database Verification:**
```bash
# Check translations for a specific family
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT lf.slug, lft.locale_code, lft.name, lft.description FROM language_families lf JOIN language_family_translations lft ON lf.id = lft.family_id WHERE lf.slug = 'indo-european' ORDER BY lft.locale_code"
```

---

### 3. Language Families - Create Operations ✓

#### 3.1 Create Language Family (English Only)

**Steps:**
1. Navigate to http://localhost:3001/en/operator/amsterdam/language-families/new
2. Fill form:
   - Slug: `indo-european`
   - Name (English): `Indo-European`
   - Description (English): `The Indo-European language family includes most European languages and extends into Asia.`
3. Submit form

**Expected Result:**
- ✅ Form validates successfully
- ✅ Shows loading state: "Saving..." button with spinner
- ✅ Redirects to list page after successful creation
- ✅ New family appears in list
- ✅ Success confirmation (redirect indicates success)

**Database Verification:**
```bash
# Verify family and translation created
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT lf.id, lf.slug, lft.locale_code, lft.name FROM language_families lf JOIN language_family_translations lft ON lf.id = lft.family_id WHERE lf.slug = 'indo-european'"
```

Expected: 1 row with locale_code='en'

**Atomic Transaction Test:**
```bash
# Verify no orphaned records (transaction worked)
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT COUNT(*) FROM language_families WHERE id NOT IN (SELECT DISTINCT family_id FROM language_family_translations)"
```

Expected: 0 (all families have at least one translation)

---

#### 3.2 Create Language Family (All Locales)

**Steps:**
1. Navigate to create page
2. Fill form with all three locales:
   - Slug: `afro-asiatic`
   - Name (English): `Afro-Asiatic`
   - Description (English): `Afro-Asiatic languages are spoken in North Africa, the Horn of Africa, and Southwest Asia.`
   - Name (Dutch): `Afro-Aziatisch`
   - Description (Dutch): `Afro-Aziatische talen worden gesproken in Noord-Afrika, de Hoorn van Afrika en Zuidwest-Azië.`
   - Name (French): `Afro-asiatique`
   - Description (French): `Les langues afro-asiatiques sont parlées en Afrique du Nord, dans la Corne de l'Afrique et en Asie du Sud-Ouest.`
3. Submit form

**Expected Result:**
- ✅ Form accepts all translations
- ✅ Redirects to list page
- ✅ Family shows "en, nl, fr" translation badges

**Database Verification:**
```bash
# Verify all translations created
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT lft.locale_code, lft.name FROM language_family_translations lft JOIN language_families lf ON lft.family_id = lf.id WHERE lf.slug = 'afro-asiatic' ORDER BY lft.locale_code"
```

Expected: 3 rows (en, fr, nl)

---

#### 3.3 Form Validation - Invalid Slug

**Steps:**
1. Navigate to create page
2. Fill form:
   - Slug: `Invalid Slug!` (contains spaces and special chars)
   - Name (English): `Test Family`
3. Try to submit

**Expected Result:**
- ✅ Client-side validation prevents submission
- ✅ Error message: "Slug must contain only lowercase letters, numbers, and hyphens"
- ✅ Submit button remains enabled
- ✅ No network request made

---

#### 3.4 Form Validation - Missing Required Fields

**Steps:**
1. Navigate to create page
2. Leave slug empty
3. Leave English name empty
4. Try to submit

**Expected Result:**
- ✅ Shows error: "Slug is required"
- ✅ Shows error: "English name is required"
- ✅ Form not submitted
- ✅ User can correct and resubmit

---

#### 3.5 Server Validation - Duplicate Slug

**Steps:**
1. Create a language family with slug: `test-family`
2. Try to create another with the same slug
3. Submit form

**Expected Result:**
- ✅ Form submits (client validation passes)
- ✅ Server returns error
- ✅ Error message displayed: "Language family with slug 'test-family' already exists"
- ✅ Form remains populated (data not lost)
- ✅ User can modify slug and retry
- ✅ No duplicate created in database (atomic transaction rolled back)

**Database Verification:**
```bash
# Verify only one family with that slug
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT COUNT(*) FROM language_families WHERE slug = 'test-family'"
```

Expected: 1

---

### 4. Language Families - Read Operations ✓

#### 4.1 View Language Family Details

**Prerequisites:** Language family exists with slug `indo-european`

**Steps:**
1. Navigate to list page
2. Click "Edit" button on Indo-European family
3. Observe form pre-population

**Expected Result:**
- ✅ Edit page loads: `/en/operator/amsterdam/language-families/{id}`
- ✅ Page shows "Edit Language Family" heading
- ✅ Form fields pre-populated:
  - Slug: `indo-european`
  - Name (English): Existing English name
  - Description (English): Existing English description
  - Name (Dutch): Existing Dutch name (if available)
  - Name (French): Existing French name (if available)
- ✅ Back button links to list page
- ✅ Delete button visible in header and danger zone

**Database Verification:**
```bash
# Verify family data matches form
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT lf.id, lf.slug, lft.locale_code, lft.name, lft.description FROM language_families lf JOIN language_family_translations lft ON lf.id = lft.family_id WHERE lf.slug = 'indo-european' ORDER BY lft.locale_code"
```

---

#### 4.2 Language Family Not Found (404)

**Steps:**
1. Navigate to: http://localhost:3001/en/operator/amsterdam/language-families/00000000-0000-0000-0000-000000000000

**Expected Result:**
- ✅ Shows 404 error page or "Not Found" message
- ✅ No sensitive error details exposed
- ✅ User can navigate back to list

---

### 5. Language Families - Update Operations ✓

#### 5.1 Update Existing Translations

**Prerequisites:** Language family exists with English translation only

**Steps:**
1. Navigate to edit page for existing family
2. Modify existing fields:
   - Name (English): `Indo-European (Updated)`
   - Description (English): `Updated description with more details.`
3. Submit form

**Expected Result:**
- ✅ Shows loading state during submission
- ✅ Redirects to list page after success
- ✅ Updated name displays in list
- ✅ Changes persisted in database

**Database Verification:**
```bash
# Verify update
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT lft.name, lft.description FROM language_family_translations lft JOIN language_families lf ON lft.family_id = lf.id WHERE lf.slug = 'indo-european' AND lft.locale_code = 'en'"
```

Expected: Updated values

---

#### 5.2 Add New Translations

**Prerequisites:** Language family exists with English only

**Steps:**
1. Navigate to edit page
2. Add Dutch translation:
   - Name (Dutch): `Indo-Europees`
   - Description (Dutch): `De Indo-Europese taalfamilie`
3. Add French translation:
   - Name (French): `Indo-européen`
   - Description (French): `La famille indo-européenne`
4. Submit form

**Expected Result:**
- ✅ Form accepts new translations
- ✅ Redirects to list page
- ✅ Translation badges now show: "en, nl, fr"
- ✅ All translations persisted

**Database Verification:**
```bash
# Verify new translations added
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT locale_code, name FROM language_family_translations WHERE family_id = (SELECT id FROM language_families WHERE slug = 'indo-european') ORDER BY locale_code"
```

Expected: 3 rows (en, fr, nl)

**Atomic Transaction Test:**
```bash
# Verify old translations replaced, not duplicated
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT locale_code, COUNT(*) as count FROM language_family_translations WHERE family_id = (SELECT id FROM language_families WHERE slug = 'indo-european') GROUP BY locale_code HAVING COUNT(*) > 1"
```

Expected: 0 rows (no duplicates)

---

#### 5.3 Remove Translation (Clear Optional Fields)

**Prerequisites:** Language family with multiple translations

**Steps:**
1. Navigate to edit page
2. Clear Dutch name and description fields
3. Submit form

**Expected Result:**
- ✅ Form submits successfully
- ✅ Dutch translation removed
- ✅ Translation badges now show: "en, fr" (no nl)
- ✅ English and French translations remain

**Database Verification:**
```bash
# Verify Dutch translation removed
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT locale_code FROM language_family_translations WHERE family_id = (SELECT id FROM language_families WHERE slug = 'indo-european') ORDER BY locale_code"
```

Expected: Only 'en' and 'fr' (no 'nl')

---

#### 5.4 Update Slug

**Prerequisites:** Language family exists

**Steps:**
1. Navigate to edit page
2. Change slug from `test-family` to `test-family-renamed`
3. Submit form

**Expected Result:**
- ✅ Slug updated successfully
- ✅ List page shows new slug
- ✅ URL remains functional with new slug
- ✅ Translations preserved

**Database Verification:**
```bash
# Verify slug updated and translations intact
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT lf.slug, COUNT(lft.id) as translation_count FROM language_families lf LEFT JOIN language_family_translations lft ON lf.id = lft.family_id WHERE lf.slug = 'test-family-renamed' GROUP BY lf.slug"
```

---

#### 5.5 Update with Duplicate Slug (Error Handling)

**Prerequisites:** Two language families exist

**Steps:**
1. Edit family with slug `family-a`
2. Try to change slug to `family-b` (which already exists)
3. Submit form

**Expected Result:**
- ✅ Server returns error
- ✅ Error message: "Language family with slug 'family-b' already exists"
- ✅ Form data preserved (not lost)
- ✅ Original family unchanged in database
- ✅ User can correct and retry

**Database Verification:**
```bash
# Verify no changes to either family
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT slug FROM language_families ORDER BY slug"
```

Expected: Both original slugs present, no duplicates

---

### 6. Language Families - Delete Operations ✓

#### 6.1 Delete Confirmation Dialog

**Prerequisites:** Language family exists

**Steps:**
1. Navigate to edit page for a language family
2. Click "Delete" button in header (or in danger zone)
3. Observe confirmation dialog

**Expected Result:**
- ✅ AlertDialog opens with:
  - Title: "Delete Language Family?"
  - Message: "This will permanently delete '{familyName}' and all its translations. This action cannot be undone."
  - "Cancel" button (secondary)
  - "Delete" button (destructive, red)
- ✅ Dialog blocks interaction with page
- ✅ No deletion occurs yet

---

#### 6.2 Delete - Cancel Action

**Steps:**
1. Open delete confirmation dialog
2. Click "Cancel" button

**Expected Result:**
- ✅ Dialog closes
- ✅ No deletion occurs
- ✅ User remains on edit page
- ✅ Family still exists in database

**Database Verification:**
```bash
# Verify family still exists
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT slug FROM language_families WHERE slug = 'test-family'"
```

Expected: 1 row

---

#### 6.3 Delete - Confirm Action

**Prerequisites:** Language family exists and is NOT referenced by any languages

**Steps:**
1. Open delete confirmation dialog
2. Click "Delete" button
3. Observe deletion process

**Expected Result:**
- ✅ Shows loading state: "Deleting..." with spinner
- ✅ Cancel button disabled during deletion
- ✅ Dialog closes on success
- ✅ Redirects to list page
- ✅ Deleted family removed from list
- ✅ Family and all translations deleted from database

**Database Verification:**
```bash
# Verify family deleted
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT COUNT(*) FROM language_families WHERE slug = 'test-family'"
```

Expected: 0

```bash
# Verify translations deleted (cascade)
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT COUNT(*) FROM language_family_translations WHERE family_id = (SELECT id FROM language_families WHERE slug = 'test-family')"
```

Expected: 0

---

#### 6.4 Delete - Foreign Key Constraint (Referenced by Languages)

**Prerequisites:** Language family exists and IS referenced by at least one language

**Setup:**
```bash
# Create a test language referencing the family (manual SQL for now)
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
INSERT INTO languages (city_id, family_id, endonym)
VALUES (
  (SELECT id FROM cities WHERE slug = 'amsterdam'),
  (SELECT id FROM language_families WHERE slug = 'test-family'),
  'Test Language'
)"
```

**Steps:**
1. Try to delete language family
2. Confirm deletion in dialog
3. Observe error handling

**Expected Result:**
- ✅ Shows loading state during deletion attempt
- ✅ Deletion fails (foreign key constraint)
- ✅ Error message displays in dialog:
  - "Cannot delete language family: it is referenced by one or more languages. Please remove or reassign those languages first."
- ✅ Dialog remains open with error
- ✅ Family still exists in database
- ✅ User can close dialog and fix issue

**Database Verification:**
```bash
# Verify family still exists
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT slug FROM language_families WHERE slug = 'test-family'"
```

Expected: 1 row

```bash
# Verify referencing language exists
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT COUNT(*) FROM languages WHERE family_id = (SELECT id FROM language_families WHERE slug = 'test-family')"
```

Expected: ≥ 1

---

#### 6.5 Delete - Network Error Handling

**Prerequisites:** Can simulate by stopping Supabase or using browser DevTools to block requests

**Steps:**
1. Open delete confirmation dialog
2. (Simulate network failure)
3. Click "Delete" button

**Expected Result:**
- ✅ Shows appropriate error message
- ✅ Error displayed in dialog
- ✅ User can retry or cancel
- ✅ No data corruption

---

#### 6.6 Delete - Permission Denied

**Prerequisites:** User with insufficient permissions (if applicable)

**Expected Result:**
- ✅ Error message: "Permission denied" or similar
- ✅ Deletion prevented
- ✅ User informed of permission issue

---

### 7. Internationalization (i18n) ✓

#### 7.1 English Locale (EN)

**Steps:**
1. Navigate to: http://localhost:3001/en/operator/amsterdam/language-families
2. Observe all UI text

**Expected Result:**
- ✅ URL contains `/en/` prefix
- ✅ Page title: "Language Families"
- ✅ Subtitle: "Manage language families for Amsterdam"
- ✅ Button: "Add Language Family"
- ✅ Empty state: "No Language Families Yet"
- ✅ Form labels: "Slug", "Name", "Description"
- ✅ Section headers: "Basic Information", "English (Required)", "Dutch (Optional)", "French (Optional)"

---

#### 7.2 Dutch Locale (NL)

**Steps:**
1. Navigate to: http://localhost:3001/nl/operator/amsterdam/language-families
2. Observe UI adaptation

**Expected Result:**
- ✅ URL contains `/nl/` prefix
- ✅ Page structure identical to English
- ✅ All UI text in Dutch (if translations exist)
- ✅ Family names display in Dutch (if available)
- ✅ Fallback to English if Dutch translation missing
- ✅ No console errors

---

#### 7.3 French Locale (FR)

**Steps:**
1. Navigate to: http://localhost:3001/fr/operator/amsterdam/language-families
2. Observe UI adaptation

**Expected Result:**
- ✅ URL contains `/fr/` prefix
- ✅ All functionality works identically
- ✅ French translations display where available
- ✅ Graceful fallback to English

---

#### 7.4 Translation Fallback Behavior

**Prerequisites:** Language family with only English translation

**Steps:**
1. Create family with English only
2. View in Dutch: http://localhost:3001/nl/operator/amsterdam/language-families
3. View in French: http://localhost:3001/fr/operator/amsterdam/language-families

**Expected Result:**
- ✅ Family displays with English name in Dutch UI
- ✅ Family displays with English name in French UI
- ✅ Translation badge shows only "en"
- ✅ No "missing translation" errors
- ✅ User experience remains smooth

---

### 8. Error Handling & Edge Cases ✓

#### 8.1 Network Timeout

**Simulate:** Use browser DevTools to throttle network to "Slow 3G"

**Steps:**
1. Navigate to create page
2. Fill form
3. Submit
4. Observe behavior during slow network

**Expected Result:**
- ✅ Loading state persists
- ✅ Form remains disabled during submission
- ✅ Eventually completes or times out gracefully
- ✅ User informed of status

---

#### 8.2 Concurrent Edit Conflict

**Setup:** Open same family in two browser tabs

**Steps:**
1. Tab 1: Load edit page for family
2. Tab 2: Load same edit page
3. Tab 1: Modify and save
4. Tab 2: Modify and save (without refreshing)

**Expected Result:**
- ✅ Both saves succeed (last write wins)
- ✅ No database corruption
- ✅ Atomic transactions ensure consistency

**Note:** Optimistic locking not implemented yet, but atomic transactions prevent partial updates

---

#### 8.3 Invalid UUID in URL

**Steps:**
1. Navigate to: http://localhost:3001/en/operator/amsterdam/language-families/invalid-uuid-format

**Expected Result:**
- ✅ Shows 404 or validation error
- ✅ No server crash
- ✅ User can navigate away

---

#### 8.4 Empty Description Fields

**Steps:**
1. Create/edit family
2. Leave all description fields empty (only provide names)
3. Submit

**Expected Result:**
- ✅ Form accepts empty descriptions
- ✅ Saves successfully
- ✅ Descriptions stored as empty strings or NULL
- ✅ No validation errors

---

### 9. Database Integrity ✓

#### 9.1 Orphaned Translations Check

**Purpose:** Verify cascade deletes work

**Steps:**
1. Create language family
2. Verify translations created
3. Delete language family
4. Check for orphaned translations

**Database Verification:**
```bash
# Check for orphaned translations (should be 0)
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT COUNT(*) FROM language_family_translations WHERE family_id NOT IN (SELECT id FROM language_families)"
```

Expected: 0

---

#### 9.2 Missing Translations Check

**Purpose:** Verify all families have at least one translation

**Database Verification:**
```bash
# Check for families without translations (should be 0)
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT lf.slug FROM language_families lf LEFT JOIN language_family_translations lft ON lf.id = lft.family_id WHERE lft.id IS NULL"
```

Expected: 0 rows

---

#### 9.3 Duplicate Slug Check

**Database Verification:**
```bash
# Check for duplicate slugs (should be 0)
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT slug, COUNT(*) as count FROM language_families GROUP BY slug HAVING COUNT(*) > 1"
```

Expected: 0 rows

---

#### 9.4 Translation Locale Consistency

**Purpose:** Verify only valid locale codes exist

**Database Verification:**
```bash
# Check all translations use valid locales
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT DISTINCT locale_code FROM language_family_translations WHERE locale_code NOT IN (SELECT code FROM locales)"
```

Expected: 0 rows (all translations use valid locales)

---

#### 9.5 Atomic Transaction Verification

**Purpose:** Verify RPC functions work correctly

**Test Case 1: Successful Creation**
```bash
# Create via RPC function (simulates what server action does)
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT * FROM create_language_family_with_translations('test-atomic-1', '[{\"locale_code\":\"en\",\"name\":\"Test Atomic 1\",\"description\":\"Test\"}]'::jsonb)"

# Verify both family and translation created
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT lf.slug, lft.locale_code, lft.name FROM language_families lf JOIN language_family_translations lft ON lf.id = lft.family_id WHERE lf.slug = 'test-atomic-1'"
```

Expected: 1 family, 1 translation

**Test Case 2: Duplicate Slug (Should Rollback)**
```bash
# Try to create with duplicate slug
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT * FROM create_language_family_with_translations('test-atomic-1', '[{\"locale_code\":\"en\",\"name\":\"Duplicate\",\"description\":\"Test\"}]'::jsonb)" 2>&1 || echo "Expected error occurred"

# Verify only one family exists
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT COUNT(*) FROM language_families WHERE slug = 'test-atomic-1'"
```

Expected: 1 (not 2)

---

### 10. Row-Level Security (RLS) ✓

#### 10.1 Operator City Restriction

**Prerequisites:** operator-ams@example.com has access to Amsterdam only

**Steps:**
1. Log in as operator
2. Try to query Rotterdam language families via browser console:
   ```javascript
   const { data, error } = await supabase
     .from('language_families')
     .select('*')
     .eq('city_id', 'rotterdam-uuid')
   ```

**Expected Result:**
- ✅ Query returns empty or error
- ✅ No data from Rotterdam exposed
- ✅ RLS policies enforce city access

**Note:** Language families are global (not city-specific), so this test is N/A. RLS will be critical for languages (Day 23+) which ARE city-specific.

---

#### 10.2 Authenticated Access Only

**Prerequisites:** User logged out

**Steps:**
1. Log out
2. Try to access API directly via browser console
3. Try to access pages

**Expected Result:**
- ✅ API calls require authentication
- ✅ Pages redirect to login
- ✅ No data exposure without authentication

---

#### 10.3 Superuser Access All Cities

**Steps:**
1. Log in as superuser
2. Create language families
3. Verify access in Amsterdam, Rotterdam, Utrecht

**Expected Result:**
- ✅ Superuser can access all cities
- ✅ RLS policies allow superuser bypass
- ✅ Data visible across all cities

---

## Part 2: Languages (Days 23-26)

**Status:** 🟡 IN PROGRESS - Languages CRUD (Day 23) complete, Points/Descriptions/AI pending

### Day 23 - Languages CRUD (Completed November 8, 2025)

**Features Implemented:**
- Full CRUD operations for languages with translations (EN/NL/FR)
- Universal endonym field (not translated)
- ISO 639-3 code support
- Language family and country of origin selectors
- Flexible taxonomy assignment with multi-select support
- Dynamic taxonomy UI based on city's taxonomy configuration
- Visual taxonomy badges with colors

---

### 11. Languages - Access Control ✓

#### 11.1 Operator Access to Languages

**Steps:**
1. Log in as operator: `operator-ams@example.com`
2. Navigate to http://localhost:3001/en/operator/amsterdam/languages
3. Observe the page content

**Expected Result:**
- ✅ Page loads successfully with "Languages" heading
- ✅ Shows language management interface for Amsterdam
- ✅ "Add Language" button visible
- ✅ User has Amsterdam access (RLS check passes)
- ✅ Table view displays with columns: Endonym, Name, ISO Code, Family, Origin, Taxonomies

**Database Verification:**
```bash
# Verify operator has Amsterdam access
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT up.email, c.slug, cu.role FROM city_users cu JOIN user_profiles up ON cu.user_id = up.id JOIN cities c ON cu.city_id = c.id WHERE up.email = 'operator-ams@example.com'"
```

Expected: 1 row with slug='amsterdam'

---

#### 11.2 Cross-City Access Restriction

**Steps:**
1. Log in as operator: `operator-ams@example.com` (Amsterdam only)
2. Try to access: http://localhost:3001/en/operator/rotterdam/languages

**Expected Result:**
- ✅ Access denied (redirect or error)
- ✅ RLS policies prevent unauthorized access
- ✅ No data exposure for unauthorized cities

**Database Verification:**
```bash
# Verify languages are city-specific
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT l.endonym, c.slug FROM languages l JOIN cities c ON l.city_id = c.id WHERE c.slug = 'rotterdam' LIMIT 5"
```

Should not be accessible to Amsterdam operator

---

### 12. Languages - List View ✓

#### 12.1 Empty State

**Prerequisites:** No languages exist for Amsterdam

**Steps:**
1. Navigate to http://localhost:3001/en/operator/amsterdam/languages
2. Observe empty state

**Expected Result:**
- ✅ Shows "No Languages Yet" or similar empty state message
- ✅ Description explains languages are city-specific entities
- ✅ "Add Language" button present
- ✅ Links to create page: `/en/operator/amsterdam/languages/new`

**Database Verification:**
```bash
# Verify no languages exist for Amsterdam
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT COUNT(*) FROM languages WHERE city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')"
```

Expected: 0

---

#### 12.2 List with Data

**Prerequisites:** Languages exist for Amsterdam

**Steps:**
1. Create test languages (see Test 13.1)
2. Return to list page
3. Observe language table

**Expected Result:**
- ✅ Shows table with language rows
- ✅ Each row displays:
  - **Endonym** (universal, not translated)
  - **Name** (translated to current locale)
  - **ISO 639-3 Code** (if available)
  - **Language Family** (translated name)
  - **Country of Origin** (translated name)
  - **Taxonomy Badges** (visual indicators with colors)
  - **Speaker Count** (if available)
  - **"Edit" button**
- ✅ Languages sorted by creation date or name
- ✅ Taxonomy badges display with correct colors
- ✅ Translations display in current locale

**Database Verification:**
```bash
# List all languages for Amsterdam with translations
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
SELECT
  l.endonym,
  l.iso_639_3_code,
  lt.name as translated_name,
  lt.locale_code,
  lf.slug as family_slug,
  c.iso_code as country_iso,
  l.speaker_count,
  COUNT(ltax.id) as taxonomy_count
FROM languages l
LEFT JOIN language_translations lt ON l.id = lt.language_id
LEFT JOIN language_families lf ON l.language_family_id = lf.id
LEFT JOIN countries c ON l.country_of_origin_id = c.id
LEFT JOIN language_taxonomies ltax ON l.id = ltax.language_id
WHERE l.city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')
GROUP BY l.id, l.endonym, l.iso_639_3_code, lt.name, lt.locale_code, lf.slug, c.iso_code, l.speaker_count
ORDER BY l.created_at
"
```

---

#### 12.3 Translation Display in Different Locales

**Prerequisites:** Language with multiple translations exists

**Steps:**
1. Create a language with en, nl, fr translations
2. View list in different locales:
   - http://localhost:3001/en/operator/amsterdam/languages (English)
   - http://localhost:3001/nl/operator/amsterdam/languages (Dutch)
   - http://localhost:3001/fr/operator/amsterdam/languages (French)

**Expected Result:**
- ✅ **Endonym remains the same** in all locales (e.g., "日本語", "Español")
- ✅ **Language names** display in current locale when available
- ✅ **Family names** display in current locale
- ✅ **Country names** display in current locale
- ✅ Falls back to English if translation missing
- ✅ Page UI remains in current locale
- ✅ No console errors

**Database Verification:**
```bash
# Check translations for a specific language
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT l.endonym, lt.locale_code, lt.name FROM languages l JOIN language_translations lt ON l.id = lt.language_id WHERE l.endonym = 'English' ORDER BY lt.locale_code"
```

Expected: Multiple rows with different locale_code values

---

#### 12.4 Taxonomy Badge Display

**Prerequisites:** Language with taxonomy assignments exists

**Steps:**
1. Create a language with taxonomy assignments (e.g., "Small Community", "Safe Status")
2. View language list
3. Observe taxonomy badges

**Expected Result:**
- ✅ Taxonomy badges display with correct colors
- ✅ Badge text shows taxonomy value name (translated)
- ✅ Colors match taxonomy configuration
- ✅ Multiple taxonomies display as separate badges
- ✅ Badges are visually distinct and readable

**Database Verification:**
```bash
# Check taxonomy assignments for a language
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
SELECT
  l.endonym,
  tt.slug as taxonomy_type,
  tv.slug as taxonomy_value,
  tv.color_hex,
  tvt.name as value_name
FROM languages l
JOIN language_taxonomies ltax ON l.id = ltax.language_id
JOIN taxonomy_values tv ON ltax.taxonomy_value_id = tv.id
JOIN taxonomy_types tt ON tv.taxonomy_type_id = tt.id
JOIN taxonomy_value_translations tvt ON tv.id = tvt.taxonomy_value_id
WHERE l.city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')
  AND tvt.locale_code = 'en'
ORDER BY l.endonym, tt.slug
"
```

---

### 13. Languages - Create Operations ✓

#### 13.1 Create Language (Required Fields Only)

**Steps:**
1. Navigate to http://localhost:3001/en/operator/amsterdam/languages/new
2. Fill form with required fields only:
   - **Endonym**: `English`
   - **Name (English)**: `English`
3. Submit form

**Expected Result:**
- ✅ Form validates successfully
- ✅ Shows loading state: "Saving..." button with spinner
- ✅ Redirects to list page after successful creation
- ✅ New language appears in list
- ✅ Success confirmation (redirect indicates success)

**Database Verification:**
```bash
# Verify language and translation created
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT l.id, l.endonym, lt.locale_code, lt.name FROM languages l JOIN language_translations lt ON l.id = lt.language_id WHERE l.endonym = 'English' AND l.city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')"
```

Expected: 1 row with locale_code='en'

---

#### 13.2 Create Language (All Fields)

**Steps:**
1. Navigate to create page
2. Fill form with all fields:
   - **Endonym**: `Español`
   - **ISO 639-3 Code**: `spa`
   - **Name (English)**: `Spanish`
   - **Name (Dutch)**: `Spaans`
   - **Name (French)**: `Espagnol`
   - **Language Family**: Select "Indo-European"
   - **Country of Origin**: Select "Spain"
   - **Speaker Count**: `500000000`
   - **Taxonomies**: Select appropriate values (if available)
3. Submit form

**Expected Result:**
- ✅ Form accepts all fields
- ✅ Redirects to list page
- ✅ Language shows all translations: "en, nl, fr"
- ✅ Family and country display correctly
- ✅ Speaker count displays
- ✅ Taxonomy badges display with colors

**Database Verification:**
```bash
# Verify all translations created
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT lt.locale_code, lt.name FROM language_translations lt JOIN languages l ON lt.language_id = l.id WHERE l.endonym = 'Español' AND l.city_id = (SELECT id FROM cities WHERE slug = 'amsterdam') ORDER BY lt.locale_code"
```

Expected: 3 rows (en, fr, nl)

```bash
# Verify foreign keys
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
SELECT
  l.endonym,
  l.iso_639_3_code,
  l.speaker_count,
  lf.slug as family,
  c.iso_code as origin_country
FROM languages l
LEFT JOIN language_families lf ON l.language_family_id = lf.id
LEFT JOIN countries c ON l.country_of_origin_id = c.id
WHERE l.endonym = 'Español'
  AND l.city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')
"
```

---

#### 13.3 Create Language with Taxonomy Assignment

**Prerequisites:** City has taxonomy types configured (e.g., "Community Size", "Endangerment Status")

**Steps:**
1. Navigate to create page
2. Fill basic language information
3. In taxonomy section:
   - Select "Small" for "Community Size"
   - Select "Safe" for "Endangerment Status"
4. Submit form

**Expected Result:**
- ✅ Taxonomy selector displays city's configured taxonomies
- ✅ For required taxonomies: selector is mandatory
- ✅ For optional taxonomies: selector is optional
- ✅ For single-select taxonomies: only one value can be selected
- ✅ For multi-select taxonomies: multiple values can be selected
- ✅ Form validates taxonomy requirements
- ✅ Taxonomy assignments saved correctly

**Database Verification:**
```bash
# Verify taxonomy assignments
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
SELECT
  l.endonym,
  tt.slug as taxonomy_type,
  tv.slug as taxonomy_value,
  tt.is_required,
  tt.allow_multiple
FROM languages l
JOIN language_taxonomies ltax ON l.id = ltax.language_id
JOIN taxonomy_values tv ON ltax.taxonomy_value_id = tv.id
JOIN taxonomy_types tt ON tv.taxonomy_type_id = tt.id
WHERE l.endonym = 'Test Language'
ORDER BY tt.slug, tv.slug
"
```

---

#### 13.4 Form Validation - Missing Required Fields

**Steps:**
1. Navigate to create page
2. Leave endonym empty
3. Leave English name empty
4. Try to submit

**Expected Result:**
- ✅ Shows error: "Endonym is required"
- ✅ Shows error: "English name is required"
- ✅ Form not submitted
- ✅ User can correct and resubmit

---

#### 13.5 Form Validation - Invalid ISO Code

**Steps:**
1. Navigate to create page
2. Fill form
3. Enter invalid ISO code: `invalid` (not 3 characters)
4. Try to submit

**Expected Result:**
- ✅ Client-side validation prevents submission
- ✅ Error message: "ISO 639-3 code must be exactly 3 lowercase letters"
- ✅ Submit button remains enabled
- ✅ No network request made

---

#### 13.6 Form Validation - Required Taxonomy Missing

**Prerequisites:** City has a required taxonomy type

**Steps:**
1. Navigate to create page
2. Fill language information
3. Skip required taxonomy selection
4. Try to submit

**Expected Result:**
- ✅ Form validation catches missing required taxonomy
- ✅ Error message indicates which taxonomy is required
- ✅ User must select value before submission
- ✅ Form highlights required taxonomy selector

---

#### 13.7 Input Sanitization

**Steps:**
1. Navigate to create page
2. Fill form with potentially unsafe input:
   - Endonym: `  Test Language  ` (extra spaces)
   - Name (English): `<script>alert("xss")</script>Test` (HTML injection)
   - ISO Code: `ENG` (uppercase)
3. Submit form

**Expected Result:**
- ✅ Endonym trimmed to `Test Language`
- ✅ HTML tags removed from name
- ✅ ISO code converted to lowercase: `eng`
- ✅ No XSS vulnerability
- ✅ Data stored safely in database

**Database Verification:**
```bash
# Verify sanitized data
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT endonym, iso_639_3_code FROM languages WHERE endonym = 'Test Language' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')"
```

Expected: Clean data without HTML or extra spaces

---

### 14. Languages - Read Operations ✓

#### 14.1 View Language Details

**Prerequisites:** Language exists

**Steps:**
1. Navigate to list page
2. Click "Edit" button on a language
3. Observe form pre-population

**Expected Result:**
- ✅ Edit page loads: `/en/operator/amsterdam/languages/{id}`
- ✅ Page shows "Edit Language" heading
- ✅ Form fields pre-populated:
  - Endonym (universal field)
  - ISO 639-3 Code
  - Name translations (EN/NL/FR)
  - Language Family
  - Country of Origin
  - Speaker Count
  - Taxonomy assignments
- ✅ Back button links to list page
- ✅ Delete button visible

**Database Verification:**
```bash
# Verify language data matches form
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
SELECT
  l.id, l.endonym, l.iso_639_3_code, l.speaker_count,
  lt.locale_code, lt.name,
  lf.slug as family,
  c.iso_code as country
FROM languages l
LEFT JOIN language_translations lt ON l.id = lt.language_id
LEFT JOIN language_families lf ON l.language_family_id = lf.id
LEFT JOIN countries c ON l.country_of_origin_id = c.id
WHERE l.id = '{language-id}'
ORDER BY lt.locale_code
"
```

---

#### 14.2 Language Not Found (404)

**Steps:**
1. Navigate to: http://localhost:3001/en/operator/amsterdam/languages/00000000-0000-0000-0000-000000000000

**Expected Result:**
- ✅ Shows 404 error page or "Not Found" message
- ✅ No sensitive error details exposed
- ✅ User can navigate back to list

---

#### 14.3 View Language with Multiple Taxonomies

**Prerequisites:** Language with multiple taxonomy assignments

**Steps:**
1. Navigate to edit page for language with taxonomies
2. Observe taxonomy selectors

**Expected Result:**
- ✅ All taxonomy types display
- ✅ Currently assigned values are pre-selected
- ✅ Multi-select taxonomies show multiple selections
- ✅ Single-select taxonomies show one selection
- ✅ Required taxonomies are marked as mandatory
- ✅ Visual styling (colors) visible in selectors

---

### 15. Languages - Update Operations ✓

#### 15.1 Update Basic Fields

**Prerequisites:** Language exists

**Steps:**
1. Navigate to edit page
2. Modify fields:
   - Endonym: `English (Updated)`
   - Speaker Count: `1600000000`
3. Submit form

**Expected Result:**
- ✅ Shows loading state during submission
- ✅ Redirects to list page after success
- ✅ Updated data displays in list
- ✅ Changes persisted in database

**Database Verification:**
```bash
# Verify update
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT endonym, speaker_count FROM languages WHERE endonym LIKE 'English%' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')"
```

Expected: Updated values

---

#### 15.2 Update Translations - Add New Locale

**Prerequisites:** Language exists with English only

**Steps:**
1. Navigate to edit page
2. Add Dutch translation:
   - Name (Dutch): `Engels`
3. Add French translation:
   - Name (French): `Anglais`
4. Submit form

**Expected Result:**
- ✅ Form accepts new translations
- ✅ Redirects to list page
- ✅ Language now shows: "en, nl, fr"
- ✅ All translations persisted

**Database Verification:**
```bash
# Verify new translations added
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT locale_code, name FROM language_translations WHERE language_id = (SELECT id FROM languages WHERE endonym = 'English' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')) ORDER BY locale_code"
```

Expected: 3 rows (en, fr, nl)

---

#### 15.3 Update Translations - Remove Locale

**Prerequisites:** Language with multiple translations

**Steps:**
1. Navigate to edit page
2. Clear Dutch name field
3. Submit form

**Expected Result:**
- ✅ Form submits successfully
- ✅ Dutch translation removed
- ✅ Language shows: "en, fr" (no nl)
- ✅ English and French translations remain

**Database Verification:**
```bash
# Verify Dutch translation removed
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT locale_code FROM language_translations WHERE language_id = (SELECT id FROM languages WHERE endonym = 'English' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')) ORDER BY locale_code"
```

Expected: Only 'en' and 'fr' (no 'nl')

---

#### 15.4 Update Endonym (Universal Field)

**Prerequisites:** Language exists

**Steps:**
1. Navigate to edit page
2. Change endonym from `Test` to `Test Language`
3. Submit form

**Expected Result:**
- ✅ Endonym updated successfully
- ✅ **Endonym remains NOT translated** (same in all locales)
- ✅ All translations still reference same language
- ✅ No data loss

**Verification:**
View language in different locales - endonym should be identical:
- http://localhost:3001/en/operator/amsterdam/languages
- http://localhost:3001/nl/operator/amsterdam/languages
- http://localhost:3001/fr/operator/amsterdam/languages

---

#### 15.5 Update Taxonomy Assignments

**Prerequisites:** Language with taxonomy assignments

**Steps:**
1. Navigate to edit page
2. Change taxonomy assignments:
   - Change "Small" to "Medium" for "Community Size"
   - Add "Vulnerable" for "Endangerment Status"
3. Submit form

**Expected Result:**
- ✅ Old taxonomy assignments removed
- ✅ New taxonomy assignments added
- ✅ List page shows updated badges
- ✅ Badge colors updated to match new values

**Database Verification:**
```bash
# Verify taxonomy updates
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
SELECT
  tv.slug as taxonomy_value,
  tt.slug as taxonomy_type
FROM language_taxonomies ltax
JOIN taxonomy_values tv ON ltax.taxonomy_value_id = tv.id
JOIN taxonomy_types tt ON tv.taxonomy_type_id = tt.id
WHERE ltax.language_id = (SELECT id FROM languages WHERE endonym = 'Test Language')
ORDER BY tt.slug, tv.slug
"
```

Expected: Updated taxonomy assignments, no old values

---

#### 15.6 Update Language Family

**Prerequisites:** Language with family assigned

**Steps:**
1. Navigate to edit page
2. Change language family from "Indo-European" to "Afro-Asiatic"
3. Submit form

**Expected Result:**
- ✅ Family updated successfully
- ✅ List page shows new family name
- ✅ Foreign key reference updated

**Database Verification:**
```bash
# Verify family update
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
SELECT l.endonym, lf.slug as family
FROM languages l
JOIN language_families lf ON l.language_family_id = lf.id
WHERE l.endonym = 'Test Language'
"
```

Expected: New family slug

---

#### 15.7 Clear Optional Fields

**Prerequisites:** Language with optional fields filled

**Steps:**
1. Navigate to edit page
2. Clear optional fields:
   - ISO Code (clear field)
   - Language Family (deselect)
   - Country of Origin (deselect)
   - Speaker Count (clear field)
3. Submit form

**Expected Result:**
- ✅ Form accepts empty optional fields
- ✅ Fields set to NULL in database
- ✅ List page shows empty/dash for these fields
- ✅ Required fields (endonym, English name) remain

**Database Verification:**
```bash
# Verify NULL values
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT endonym, iso_639_3_code, language_family_id, country_of_origin_id, speaker_count FROM languages WHERE endonym = 'Test Language'"
```

Expected: NULL for cleared fields

---

### 16. Languages - Delete Operations ✓

#### 16.1 Delete Language (Simple)

**Prerequisites:** Language exists with no dependencies (no points, no descriptions)

**Steps:**
1. Navigate to edit page for a language
2. Click "Delete" button
3. Confirm deletion in dialog

**Expected Result:**
- ✅ Confirmation dialog appears
- ✅ Shows warning about permanent deletion
- ✅ Shows loading state: "Deleting..." with spinner
- ✅ Redirects to list page after success
- ✅ Deleted language removed from list
- ✅ Language and all translations deleted from database

**Database Verification:**
```bash
# Verify language deleted
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT COUNT(*) FROM languages WHERE endonym = 'Test Language'"
```

Expected: 0

```bash
# Verify translations deleted (cascade)
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT COUNT(*) FROM language_translations WHERE language_id NOT IN (SELECT id FROM languages)"
```

Expected: 0 (no orphaned translations)

---

#### 16.2 Delete Language with Taxonomy Assignments

**Prerequisites:** Language with taxonomy assignments

**Steps:**
1. Navigate to edit page
2. Click "Delete" button
3. Confirm deletion

**Expected Result:**
- ✅ Deletion succeeds
- ✅ Taxonomy assignments deleted (cascade)
- ✅ Language removed from database
- ✅ Taxonomy values themselves remain (not deleted)

**Database Verification:**
```bash
# Verify taxonomy assignments deleted
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT COUNT(*) FROM language_taxonomies WHERE language_id NOT IN (SELECT id FROM languages)"
```

Expected: 0 (no orphaned assignments)

```bash
# Verify taxonomy values still exist
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT COUNT(*) FROM taxonomy_values WHERE taxonomy_type_id = (SELECT id FROM taxonomy_types WHERE slug = 'community-size')"
```

Expected: > 0 (values preserved)

---

#### 16.3 Delete Language - Foreign Key Constraint (with Points)

**Prerequisites:** Language exists and IS referenced by language points

**Setup:**
```bash
# Create a test language point referencing the language
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
INSERT INTO language_points (language_id, neighborhood_id, latitude, longitude)
VALUES (
  (SELECT id FROM languages WHERE endonym = 'Test Language'),
  (SELECT id FROM neighborhoods WHERE slug = 'jordaan'),
  52.3676,
  4.9041
)
"
```

**Steps:**
1. Try to delete language
2. Confirm deletion in dialog

**Expected Result:**
- ✅ Shows loading state during deletion attempt
- ✅ Deletion fails (foreign key constraint)
- ✅ Error message displays:
  - "Cannot delete language: it is referenced by language points. Please remove those points first."
- ✅ Language still exists in database
- ✅ User can close dialog and fix issue

**Database Verification:**
```bash
# Verify language still exists
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT endonym FROM languages WHERE endonym = 'Test Language'"
```

Expected: 1 row

```bash
# Verify referencing point exists
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT COUNT(*) FROM language_points WHERE language_id = (SELECT id FROM languages WHERE endonym = 'Test Language')"
```

Expected: ≥ 1

---

#### 16.4 Delete - Cancel Action

**Steps:**
1. Navigate to edit page
2. Click "Delete" button
3. Click "Cancel" in confirmation dialog

**Expected Result:**
- ✅ Dialog closes
- ✅ No deletion occurs
- ✅ User remains on edit page
- ✅ Language still exists in database

---

### 17. Languages - Taxonomy Integration ✓

#### 17.1 Dynamic Taxonomy Selector

**Prerequisites:** City has configured taxonomy types

**Steps:**
1. Navigate to create language page
2. Observe taxonomy section

**Expected Result:**
- ✅ Taxonomy section displays all city's taxonomy types
- ✅ Each taxonomy shows:
  - Name (translated to current locale)
  - Description (if available)
  - Required indicator (for required taxonomies)
  - Single/multi-select UI based on configuration
- ✅ No taxonomies from other cities shown
- ✅ Section is empty if city has no taxonomies

**Database Verification:**
```bash
# Check city's taxonomy types
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
SELECT
  tt.slug,
  ttt.name,
  tt.is_required,
  tt.allow_multiple,
  COUNT(tv.id) as value_count
FROM taxonomy_types tt
JOIN taxonomy_type_translations ttt ON tt.id = ttt.taxonomy_type_id
LEFT JOIN taxonomy_values tv ON tt.id = tv.taxonomy_type_id
WHERE tt.city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')
  AND ttt.locale_code = 'en'
GROUP BY tt.id, tt.slug, ttt.name, tt.is_required, tt.allow_multiple
ORDER BY tt.slug
"
```

---

#### 17.2 Single-Select Taxonomy

**Prerequisites:** City has a single-select taxonomy type

**Steps:**
1. Navigate to create page
2. Select a value for single-select taxonomy (e.g., "Community Size")
3. Try to select a second value

**Expected Result:**
- ✅ UI only allows one selection (radio button or single-select dropdown)
- ✅ Selecting a new value deselects the previous one
- ✅ Cannot submit with multiple values for single-select taxonomy

---

#### 17.3 Multi-Select Taxonomy

**Prerequisites:** City has a multi-select taxonomy type

**Steps:**
1. Navigate to create page
2. Select multiple values for multi-select taxonomy (e.g., "Writing Systems")
3. Submit form

**Expected Result:**
- ✅ UI allows multiple selections (checkboxes or multi-select dropdown)
- ✅ All selected values saved to database
- ✅ List page shows multiple badges for this taxonomy

**Database Verification:**
```bash
# Verify multiple taxonomy assignments for same type
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
SELECT
  l.endonym,
  tt.slug as taxonomy_type,
  COUNT(*) as value_count,
  STRING_AGG(tv.slug, ', ') as values
FROM languages l
JOIN language_taxonomies ltax ON l.id = ltax.language_id
JOIN taxonomy_values tv ON ltax.taxonomy_value_id = tv.id
JOIN taxonomy_types tt ON tv.taxonomy_type_id = tt.id
WHERE l.endonym = 'Test Language'
  AND tt.allow_multiple = true
GROUP BY l.id, l.endonym, tt.slug
"
```

Expected: Multiple values for same taxonomy type

---

#### 17.4 Required Taxonomy Validation

**Prerequisites:** City has a required taxonomy type

**Steps:**
1. Navigate to create page
2. Fill all fields EXCEPT required taxonomy
3. Try to submit

**Expected Result:**
- ✅ Client-side validation prevents submission
- ✅ Error message highlights required taxonomy
- ✅ Form indicates which taxonomy is required
- ✅ User must select value before submission

---

#### 17.5 Taxonomy Value Colors in List

**Prerequisites:** Language with taxonomy assignments

**Steps:**
1. Navigate to list page
2. Observe taxonomy badges

**Expected Result:**
- ✅ Each taxonomy badge has correct color from configuration
- ✅ Colors are visually distinct
- ✅ Badge text is readable against background color
- ✅ Hover states work correctly

**Database Verification:**
```bash
# Check taxonomy value colors
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
SELECT
  tv.slug,
  tv.color_hex,
  tvt.name
FROM taxonomy_values tv
JOIN taxonomy_value_translations tvt ON tv.id = tvt.taxonomy_value_id
WHERE tvt.locale_code = 'en'
ORDER BY tv.slug
"
```

---

### 18. Languages - Internationalization (i18n) ✓

#### 18.1 English Locale (EN)

**Steps:**
1. Navigate to: http://localhost:3001/en/operator/amsterdam/languages
2. Observe all UI text

**Expected Result:**
- ✅ URL contains `/en/` prefix
- ✅ Page title: "Languages"
- ✅ Button: "Add Language"
- ✅ Form labels: "Endonym", "ISO 639-3 Code", "Name", "Language Family", "Country of Origin", "Speaker Count", "Taxonomies"
- ✅ Section headers: "Basic Information", "Translations", "Classification"
- ✅ **Endonym field**: Description explains "Universal name (not translated)"
- ✅ **Language names** display in English
- ✅ **Taxonomy names** display in English

---

#### 18.2 Dutch Locale (NL)

**Steps:**
1. Navigate to: http://localhost:3001/nl/operator/amsterdam/languages
2. Observe UI adaptation

**Expected Result:**
- ✅ URL contains `/nl/` prefix
- ✅ All UI text in Dutch (if translations exist)
- ✅ **Language names** display in Dutch (if available, else fallback to English)
- ✅ **Family names** display in Dutch
- ✅ **Country names** display in Dutch
- ✅ **Taxonomy names** display in Dutch
- ✅ **Endonym field remains universal** (same value as English UI)
- ✅ No console errors

---

#### 18.3 French Locale (FR)

**Steps:**
1. Navigate to: http://localhost:3001/fr/operator/amsterdam/languages
2. Observe UI adaptation

**Expected Result:**
- ✅ URL contains `/fr/` prefix
- ✅ All functionality works identically
- ✅ French translations display where available
- ✅ Graceful fallback to English
- ✅ **Endonym remains universal**

---

#### 18.4 Endonym Universality Test

**Critical Test:** Verify endonym is NOT translated

**Steps:**
1. Create a language with endonym: `日本語` (Japanese)
2. Add translations:
   - Name (English): `Japanese`
   - Name (Dutch): `Japans`
   - Name (French): `Japonais`
3. View in all three locales:
   - http://localhost:3001/en/operator/amsterdam/languages
   - http://localhost:3001/nl/operator/amsterdam/languages
   - http://localhost:3001/fr/operator/amsterdam/languages

**Expected Result:**
- ✅ **Endonym shows as `日本語` in ALL locales**
- ✅ **Name column shows translated names**:
  - English UI: "Japanese"
  - Dutch UI: "Japans"
  - French UI: "Japonais"
- ✅ This demonstrates correct i18n architecture

**Database Verification:**
```bash
# Verify endonym is in languages table (NOT translated)
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT endonym FROM languages WHERE endonym = '日本語'"
```

Expected: Exactly 1 row

```bash
# Verify translations are in language_translations table
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT locale_code, name FROM language_translations WHERE language_id = (SELECT id FROM languages WHERE endonym = '日本語') ORDER BY locale_code"
```

Expected: 3 rows with different names (Japanese, Japans, Japonais)

---

### 19. Languages - Error Handling & Edge Cases ✓

#### 19.1 Network Timeout

**Simulate:** Use browser DevTools to throttle network to "Slow 3G"

**Steps:**
1. Navigate to create page
2. Fill form
3. Submit
4. Observe behavior during slow network

**Expected Result:**
- ✅ Loading state persists
- ✅ Form remains disabled during submission
- ✅ Eventually completes or times out gracefully
- ✅ User informed of status

---

#### 19.2 Duplicate Endonym in Same City

**Steps:**
1. Create language with endonym: `Test Language`
2. Try to create another with same endonym in same city
3. Submit

**Expected Result:**
- ✅ Server validation prevents duplicate
- ✅ Error message: "A language with this endonym already exists in this city"
- ✅ Form data preserved
- ✅ User can modify and retry

**Note:** Different cities CAN have same endonym (e.g., both Amsterdam and Rotterdam can have "English")

**Database Verification:**
```bash
# Verify only one language with that endonym per city
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT COUNT(*) FROM languages WHERE endonym = 'Test Language' AND city_id = (SELECT id FROM cities WHERE slug = 'amsterdam')"
```

Expected: 1 (not 2)

---

#### 19.3 Invalid UUID in URL

**Steps:**
1. Navigate to: http://localhost:3001/en/operator/amsterdam/languages/invalid-uuid-format

**Expected Result:**
- ✅ Shows 404 or validation error
- ✅ No server crash
- ✅ User can navigate away

---

#### 19.4 Large Speaker Count

**Steps:**
1. Create language
2. Enter speaker count: `9999999999999` (very large number)
3. Submit

**Expected Result:**
- ✅ Number stored correctly (or truncated to max safe integer)
- ✅ Displays correctly in UI
- ✅ No overflow errors

---

#### 19.5 Special Characters in Endonym

**Steps:**
1. Create language
2. Enter endonym with special characters: `Français (Européen)`
3. Submit

**Expected Result:**
- ✅ Special characters preserved
- ✅ Displays correctly in list
- ✅ No encoding issues
- ✅ Search/filter works correctly

---

#### 19.6 Empty Optional Translations

**Steps:**
1. Create language
2. Fill only English name
3. Leave Dutch and French names empty
4. Submit

**Expected Result:**
- ✅ Form accepts empty optional translations
- ✅ Only English translation created
- ✅ No NULL constraint violations
- ✅ List shows only "en" badge

**Database Verification:**
```bash
# Verify only English translation exists
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT locale_code FROM language_translations WHERE language_id = (SELECT id FROM languages WHERE endonym = 'Test') ORDER BY locale_code"
```

Expected: Only 'en'

---

### 20. Languages - Database Integrity ✓

#### 20.1 Orphaned Translations Check

**Purpose:** Verify cascade deletes work

**Steps:**
1. Create language
2. Verify translations created
3. Delete language
4. Check for orphaned translations

**Database Verification:**
```bash
# Check for orphaned translations (should be 0)
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT COUNT(*) FROM language_translations WHERE language_id NOT IN (SELECT id FROM languages)"
```

Expected: 0

---

#### 20.2 Orphaned Taxonomy Assignments Check

**Database Verification:**
```bash
# Check for orphaned taxonomy assignments (should be 0)
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT COUNT(*) FROM language_taxonomies WHERE language_id NOT IN (SELECT id FROM languages)"
```

Expected: 0

```bash
# Check for invalid taxonomy value references (should be 0)
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT COUNT(*) FROM language_taxonomies WHERE taxonomy_value_id NOT IN (SELECT id FROM taxonomy_values)"
```

Expected: 0

---

#### 20.3 Missing Required Translations

**Purpose:** Verify all languages have at least English translation

**Database Verification:**
```bash
# Check for languages without English translation (should be 0)
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
SELECT l.endonym
FROM languages l
WHERE NOT EXISTS (
  SELECT 1 FROM language_translations lt
  WHERE lt.language_id = l.id
  AND lt.locale_code = 'en'
)
"
```

Expected: 0 rows

---

#### 20.4 Foreign Key Consistency

**Database Verification:**
```bash
# Check for invalid language_family_id references
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT COUNT(*) FROM languages WHERE language_family_id IS NOT NULL AND language_family_id NOT IN (SELECT id FROM language_families)"
```

Expected: 0

```bash
# Check for invalid country_of_origin_id references
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT COUNT(*) FROM languages WHERE country_of_origin_id IS NOT NULL AND country_of_origin_id NOT IN (SELECT id FROM countries)"
```

Expected: 0

```bash
# Check for invalid city_id references
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT COUNT(*) FROM languages WHERE city_id NOT IN (SELECT id FROM cities)"
```

Expected: 0

---

#### 20.5 ISO Code Format Validation

**Database Verification:**
```bash
# Check for invalid ISO codes (should be 3 lowercase letters or NULL)
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT endonym, iso_639_3_code FROM languages WHERE iso_639_3_code IS NOT NULL AND iso_639_3_code !~ '^[a-z]{3}$'"
```

Expected: 0 rows

---

### 21. Languages - Row-Level Security (RLS) ✓

#### 21.1 City-Specific Language Access

**Prerequisites:** operator-ams@example.com has access to Amsterdam only

**Steps:**
1. Log in as operator
2. Create language in Amsterdam
3. Try to query Rotterdam languages via browser console:
   ```javascript
   const { data, error } = await supabase
     .from('languages')
     .select('*')
     .eq('city_id', 'rotterdam-uuid')
   ```

**Expected Result:**
- ✅ Query returns empty or error
- ✅ No data from Rotterdam exposed
- ✅ RLS policies enforce city access

**Database Verification:**
```bash
# Verify RLS policies exist for languages table
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT tablename, policyname FROM pg_policies WHERE tablename = 'languages'"
```

Expected: Multiple policies for select, insert, update, delete

---

#### 21.2 Operator Cannot Access Other Cities

**Steps:**
1. Log in as operator-ams@example.com
2. Try to navigate to: http://localhost:3001/en/operator/rotterdam/languages

**Expected Result:**
- ✅ Access denied or redirect
- ✅ No Rotterdam language data visible
- ✅ Error message or empty state

---

#### 21.3 Admin Multi-City Access

**Prerequisites:** Admin user with access to Amsterdam and Rotterdam

**Steps:**
1. Log in as admin with multi-city access
2. Navigate to Amsterdam languages
3. Navigate to Rotterdam languages

**Expected Result:**
- ✅ Can access both cities
- ✅ Correct data shown for each city
- ✅ No cross-contamination of data

---

#### 21.4 Superuser Access All Cities

**Steps:**
1. Log in as superuser
2. Access Amsterdam, Rotterdam, Utrecht languages

**Expected Result:**
- ✅ Superuser can access all cities
- ✅ RLS policies allow superuser bypass
- ✅ Data visible across all cities

---

### 22. Languages - Performance ✓

#### 22.1 List Page Load Time

**Prerequisites:** Database with 100+ languages

**Steps:**
1. Navigate to list page
2. Measure load time (use browser DevTools)

**Expected Result:**
- ✅ Page loads in < 2 seconds
- ✅ No N+1 query problems
- ✅ Proper indexing on database queries
- ✅ Translations loaded efficiently

---

#### 22.2 Form Load Time with Many Taxonomies

**Prerequisites:** City with 10+ taxonomy types, each with 5+ values

**Steps:**
1. Navigate to create page
2. Measure load time

**Expected Result:**
- ✅ Form loads in < 1 second
- ✅ Taxonomy selectors populate quickly
- ✅ No UI lag when interacting with selectors

---

### Pending Test Coverage (Days 24-26)

#### Language Points (Day 24-25 - Pending)
- [ ] Create language point (latitude/longitude)
- [ ] Associate point with neighborhood
- [ ] Display on map
- [ ] Update point location
- [ ] Delete point

#### Descriptions (Day 25-26 - Pending)
- [ ] Create description for language
- [ ] Add translations
- [ ] Mark as AI-generated
- [ ] Review workflow
- [ ] Edit/update description
- [ ] Delete description

#### AI Features (Day 26 - Pending)
- [ ] AI description generation
- [ ] Source filtering (whitelist/blacklist)
- [ ] Cost tracking (ai_generation_log)
- [ ] AI translation assistance
- [ ] Review and edit AI content
- [ ] Bulk translation

---

## Testing Checklist

### Pre-Testing Setup
- [ ] Supabase running on correct ports (54331-54336)
- [ ] Next.js dev server running (port 3001)
- [ ] Test users created and verified
- [ ] City access configured for test users
- [ ] Database migrations applied
- [ ] RPC functions created

### Language Families Testing (Day 22) ✅
- [x] Access control (operator, admin, superuser)
- [x] Cross-city access restriction
- [x] Empty state display
- [x] List view with data
- [x] Translation display in all locales
- [x] Create with English only
- [x] Create with all locales
- [x] Form validation (client-side)
- [x] Server validation (duplicate slug)
- [x] View family details
- [x] Update existing translations
- [x] Add new translations
- [x] Remove translations
- [x] Update slug
- [x] Delete confirmation dialog
- [x] Delete success
- [x] Delete with foreign key constraint
- [x] Delete error handling
- [x] Internationalization (en, nl, fr)
- [x] Translation fallback
- [x] Database integrity checks
- [x] Atomic transaction verification
- [x] RLS policies

### Languages Testing (Day 23) ✅
- [ ] 11.1 Operator Access
- [ ] 11.2 Cross-City Access Restriction
- [ ] 12.1 Empty State
- [ ] 12.2 List with Data
- [ ] 12.3 Translation Display
- [ ] 12.4 Taxonomy Badge Display
- [ ] 13.1 Create (Required Fields Only)
- [ ] 13.2 Create (All Fields)
- [ ] 13.3 Create with Taxonomy Assignment
- [ ] 13.4 Validation - Missing Required Fields
- [ ] 13.5 Validation - Invalid ISO Code
- [ ] 13.6 Validation - Required Taxonomy Missing
- [ ] 13.7 Input Sanitization
- [ ] 14.1 View Language Details
- [ ] 14.2 Language Not Found (404)
- [ ] 14.3 View Language with Multiple Taxonomies
- [ ] 15.1 Update Basic Fields
- [ ] 15.2 Update Translations - Add Locale
- [ ] 15.3 Update Translations - Remove Locale
- [ ] 15.4 Update Endonym (Universal Field)
- [ ] 15.5 Update Taxonomy Assignments
- [ ] 15.6 Update Language Family
- [ ] 15.7 Clear Optional Fields
- [ ] 16.1 Delete Language (Simple)
- [ ] 16.2 Delete with Taxonomy Assignments
- [ ] 16.3 Delete Foreign Key Constraint (with Points)
- [ ] 16.4 Delete Cancel
- [ ] 17.1 Dynamic Taxonomy Selector
- [ ] 17.2 Single-Select Taxonomy
- [ ] 17.3 Multi-Select Taxonomy
- [ ] 17.4 Required Taxonomy Validation
- [ ] 17.5 Taxonomy Value Colors
- [ ] 18.1 English Locale
- [ ] 18.2 Dutch Locale
- [ ] 18.3 French Locale
- [ ] 18.4 Endonym Universality Test
- [ ] 19.1 Network Timeout
- [ ] 19.2 Duplicate Endonym
- [ ] 19.3 Invalid UUID
- [ ] 19.4 Large Speaker Count
- [ ] 19.5 Special Characters
- [ ] 19.6 Empty Optional Translations
- [ ] 20.1 Orphaned Translations Check
- [ ] 20.2 Orphaned Taxonomy Assignments Check
- [ ] 20.3 Missing Required Translations
- [ ] 20.4 Foreign Key Consistency
- [ ] 20.5 ISO Code Format Validation
- [ ] 21.1 City-Specific Language Access
- [ ] 21.2 Operator Cannot Access Other Cities
- [ ] 21.3 Admin Multi-City Access
- [ ] 21.4 Superuser Access All Cities
- [ ] 22.1 List Page Load Time
- [ ] 22.2 Form Load Time with Many Taxonomies

### Language Points Testing (Days 24-25) - Pending
- [ ] To be added after implementation

### Descriptions Testing (Days 25-26) - Pending
- [ ] To be added after implementation

### AI Features Testing (Day 26) - Pending
- [ ] To be added after implementation

---

## Test Execution Sessions

### Session 1: Initial Testing (November 5, 2025)
**Tester:** [Your name]
**Environment:** Local development
**Status:** 🟡 IN PROGRESS

#### Tests Completed
- [ ] 1.1 Operator Access
- [ ] 1.2 Admin Access
- [ ] 1.3 Superuser Access
- [ ] 1.4 Cross-City Restriction
- [ ] 2.1 Empty State
- [ ] 2.2 List with Data
- [ ] 2.3 Translation Display
- [ ] 3.1 Create (English)
- [ ] 3.2 Create (All Locales)
- [ ] 3.3 Validation - Invalid Slug
- [ ] 3.4 Validation - Missing Fields
- [ ] 3.5 Validation - Duplicate Slug
- [ ] 4.1 View Details
- [ ] 4.2 Not Found (404)
- [ ] 5.1 Update Translations
- [ ] 5.2 Add Translations
- [ ] 5.3 Remove Translation
- [ ] 5.4 Update Slug
- [ ] 5.5 Duplicate Slug Error
- [ ] 6.1 Delete Confirmation Dialog
- [ ] 6.2 Delete Cancel
- [ ] 6.3 Delete Confirm
- [ ] 6.4 Delete Foreign Key Error
- [ ] 6.5 Delete Network Error
- [ ] 6.6 Delete Permission Denied
- [ ] 7.1 English Locale
- [ ] 7.2 Dutch Locale
- [ ] 7.3 French Locale
- [ ] 7.4 Translation Fallback
- [ ] 8.1 Network Timeout
- [ ] 8.2 Concurrent Edit
- [ ] 8.3 Invalid UUID
- [ ] 8.4 Empty Descriptions
- [ ] 9.1 Orphaned Translations
- [ ] 9.2 Missing Translations
- [ ] 9.3 Duplicate Slugs
- [ ] 9.4 Locale Consistency
- [ ] 9.5 Atomic Transactions
- [ ] 10.1 City Restriction (N/A for families)
- [ ] 10.2 Authenticated Access
- [ ] 10.3 Superuser Access

#### Issues Found
- None yet

#### Notes
- Document will be updated as testing progresses
- Unit tests all passing (36/36)
- Ready for manual testing

---

## Appendix

### A. Test Data Setup Scripts

#### Create Test Language Families

```bash
# Via SQL (for quick setup)
docker exec supabase_db_language-map psql -U postgres -d postgres << 'EOF'
-- Create Indo-European
SELECT create_language_family_with_translations(
  'indo-european',
  '[
    {"locale_code":"en","name":"Indo-European","description":"The Indo-European language family"},
    {"locale_code":"nl","name":"Indo-Europees","description":"De Indo-Europese taalfamilie"},
    {"locale_code":"fr","name":"Indo-européen","description":"La famille indo-européenne"}
  ]'::jsonb
);

-- Create Afro-Asiatic
SELECT create_language_family_with_translations(
  'afro-asiatic',
  '[
    {"locale_code":"en","name":"Afro-Asiatic","description":"Afro-Asiatic languages"}
  ]'::jsonb
);

-- Create Sino-Tibetan
SELECT create_language_family_with_translations(
  'sino-tibetan',
  '[
    {"locale_code":"en","name":"Sino-Tibetan","description":"Sino-Tibetan languages"}
  ]'::jsonb
);
EOF
```

#### Clean Up Test Data

```bash
# Delete all language families (use with caution!)
docker exec supabase_db_language-map psql -U postgres -d postgres -c "DELETE FROM language_families WHERE slug LIKE 'test-%'"

# Or delete specific families
docker exec supabase_db_language-map psql -U postgres -d postgres -c "DELETE FROM language_families WHERE slug IN ('indo-european', 'afro-asiatic', 'sino-tibetan')"
```

### B. Useful Database Queries

#### List All Families with Translations
```bash
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
SELECT
  lf.slug,
  lf.created_at,
  STRING_AGG(lft.locale_code, ', ' ORDER BY lft.locale_code) as locales,
  STRING_AGG(lft.name, ' / ' ORDER BY lft.locale_code) as names
FROM language_families lf
LEFT JOIN language_family_translations lft ON lf.id = lft.family_id
GROUP BY lf.id, lf.slug, lf.created_at
ORDER BY lf.created_at
"
```

#### Check Translation Completeness
```bash
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
SELECT
  lf.slug,
  BOOL_OR(lft.locale_code = 'en') as has_en,
  BOOL_OR(lft.locale_code = 'nl') as has_nl,
  BOOL_OR(lft.locale_code = 'fr') as has_fr
FROM language_families lf
LEFT JOIN language_family_translations lft ON lf.id = lft.family_id
GROUP BY lf.id, lf.slug
ORDER BY lf.slug
"
```

#### Count by Translation Locale
```bash
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
SELECT
  locale_code,
  COUNT(*) as family_count
FROM language_family_translations
GROUP BY locale_code
ORDER BY locale_code
"
```

### C. Browser Console Testing

#### Test RLS Policies
```javascript
// In browser console (while logged in)
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
  'http://localhost:54331',
  'your-anon-key'
)

// Try to read language families
const { data, error } = await supabase
  .from('language_families')
  .select('*')

console.log('Families:', data)
console.log('Error:', error)
```

#### Test Atomic Transactions
```javascript
// This should succeed
const { data: success, error: err1 } = await supabase
  .rpc('create_language_family_with_translations', {
    p_slug: 'test-browser-1',
    p_translations: JSON.stringify([
      { locale_code: 'en', name: 'Test Browser 1', description: 'Test' }
    ])
  })

// This should fail (duplicate)
const { data: fail, error: err2 } = await supabase
  .rpc('create_language_family_with_translations', {
    p_slug: 'test-browser-1',
    p_translations: JSON.stringify([
      { locale_code: 'en', name: 'Duplicate', description: 'Should fail' }
    ])
  })

console.log('Success:', success, err1)
console.log('Failure:', fail, err2)
```

---

## Document Maintenance

**Last Updated:** November 10, 2025
**Next Update:** After Language Points implementation (Days 24-25)
**Maintainer:** Development Team

### Change Log

- **2025-11-05:** Initial document created for Language Families (Day 22)
- **2025-11-10:** Added comprehensive Languages CRUD testing (Day 23) - 12 sections, 56 test scenarios
- **TBD:** Add Language Points testing (Days 24-25)
- **TBD:** Add Descriptions testing (Day 25-26)
- **TBD:** Add AI Features testing (Day 26)

### Extension Points for Future Testing

When implementing Days 24-26, add sections for:

1. **Language Points (Days 24-25):**
   - Geographic coordinate validation
   - Map integration testing
   - Neighborhood association
   - Bulk point management

2. **Descriptions (Days 25-26):**
   - Rich text handling
   - AI generation workflow
   - Review and approval process
   - Translation management
   - Source citation

3. **AI Integration (Day 26):**
   - Provider configuration
   - API key management
   - Cost tracking
   - Rate limiting
   - Error handling
   - Quality control

---

**End of Language Families Testing Section**
**Document continues to grow as features are implemented**
