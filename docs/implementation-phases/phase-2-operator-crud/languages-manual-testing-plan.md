# Phase 2 Manual Testing Plan - Language Data Management

**Feature:** Language families and language data management with translations
**Date:** November 5, 2025
**Environment:** Local development (Supabase + Next.js)
**Status:** 🟡 IN PROGRESS - Language Families complete, Languages pending (Days 23-26)

---

## Document Overview

This testing plan covers all language-related functionality in Phase 2:

### ✅ Completed (Day 22 - November 5, 2025)
- **Language Families CRUD:** Full implementation with atomic transactions
- **Delete Confirmation Dialog:** With loading states and error handling
- **Comprehensive Test Coverage:** 36 unit/component tests passing

### 🔄 Pending (Days 23-26)
- **Languages CRUD:** Core language entity management
- **Language Points:** Geographic locations where languages are spoken
- **Descriptions:** Community stories and descriptions
- **AI Features:** Description generation and translation assistance

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

## Part 2: Languages (Days 23-26 - Pending)

**This section will be added after implementing:**
- Languages CRUD (Day 23)
- Language Points CRUD (Day 24)
- Descriptions CRUD (Day 25)
- AI Features (Day 26)

### Planned Test Coverage

#### Languages Entity
- [ ] List languages for a city
- [ ] Create language with required fields
- [ ] Assign language to family
- [ ] Assign language to country
- [ ] Update language endonym (NOT translated)
- [ ] Update language translations (name per locale)
- [ ] Add/edit ISO 639-3 code
- [ ] Toggle active status
- [ ] Delete language
- [ ] Foreign key constraint with points/descriptions

#### Language Points (Geographic Locations)
- [ ] Create language point (latitude/longitude)
- [ ] Associate point with neighborhood
- [ ] Display on map
- [ ] Update point location
- [ ] Delete point

#### Descriptions (Community Stories)
- [ ] Create description for language
- [ ] Add translations
- [ ] Mark as AI-generated
- [ ] Review workflow
- [ ] Edit/update description
- [ ] Delete description

#### AI Features
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
- [ ] Access control (operator, admin, superuser)
- [ ] Cross-city access restriction
- [ ] Empty state display
- [ ] List view with data
- [ ] Translation display in all locales
- [ ] Create with English only
- [ ] Create with all locales
- [ ] Form validation (client-side)
- [ ] Server validation (duplicate slug)
- [ ] View family details
- [ ] Update existing translations
- [ ] Add new translations
- [ ] Remove translations
- [ ] Update slug
- [ ] Delete confirmation dialog
- [ ] Delete success
- [ ] Delete with foreign key constraint
- [ ] Delete error handling
- [ ] Internationalization (en, nl, fr)
- [ ] Translation fallback
- [ ] Database integrity checks
- [ ] Atomic transaction verification
- [ ] RLS policies

### Languages Testing (Days 23-26) - Pending
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

**Last Updated:** November 5, 2025
**Next Update:** After Languages implementation (Days 23-26)
**Maintainer:** Development Team

### Change Log

- **2025-11-05:** Initial document created for Language Families (Day 22)
- **TBD:** Add Languages CRUD testing (Day 23)
- **TBD:** Add Language Points testing (Day 24)
- **TBD:** Add Descriptions testing (Day 25)
- **TBD:** Add AI Features testing (Day 26)

### Extension Points for Future Testing

When implementing Days 23-26, add sections for:

1. **Languages Entity:**
   - Foreign key relationships (family, country, city)
   - Endonym handling (non-translated field)
   - Translation management per locale
   - ISO code validation
   - Active/inactive status

2. **Language Points:**
   - Geographic coordinate validation
   - Map integration testing
   - Neighborhood association
   - Bulk point management

3. **Descriptions:**
   - Rich text handling
   - AI generation workflow
   - Review and approval process
   - Translation management
   - Source citation

4. **AI Integration:**
   - Provider configuration
   - API key management
   - Cost tracking
   - Rate limiting
   - Error handling
   - Quality control

---

**End of Language Families Testing Section**
**Document continues to grow as features are implemented**
