# Day 13 Manual Testing Plan - Superuser Panel & City Creation

**Feature:** Superuser panel with city creation functionality
**Date:** November 3, 2025
**Environment:** Local development (Supabase + Next.js)

---

## Prerequisites

Before starting, ensure:
- ✅ Supabase is running on ports 54331-54336
- ✅ Next.js dev server is running on port 3001
- ✅ You have the superuser credentials: `superuser@example.com`

### Check Services Status

```bash
# Check Supabase
npx supabase status

# Expected output:
# API URL: http://localhost:54331
# Studio URL: http://localhost:54333
# Inbucket URL: http://localhost:54334
```

---

## Test Scenarios

### 1. Authentication & Authorization ✓

#### 1.1 Login as Superuser

**Steps:**
1. Open http://localhost:3001/en
2. Click the "Log In" button
3. Enter email: `superuser@example.com`
4. Click "Send magic link"
5. Open Inbucket at http://localhost:54334
6. Find the magic link email
7. Click the link in the email
8. Verify you are redirected and logged in

**Expected Result:**
- Magic link email appears in Inbucket within seconds
- Clicking the link logs you in successfully
- You see a success message or redirect

---

#### 1.2 Access Superuser Dashboard

**Steps:**
1. While logged in as superuser, navigate to http://localhost:3001/en/superuser
2. Observe the page content

**Expected Result:**
- ✅ Page loads successfully
- ✅ Shows "Superuser Dashboard" or similar heading
- ✅ Shows statistics (cities count, users count, etc.)
- ✅ Shows quick action buttons or links
- ✅ No authorization errors

**Failure Scenarios to Test:**
- Try accessing `/en/superuser` without being logged in
  - **Expected:** Redirect to login page
- Log in as operator (`operator-ams@example.com`) and try to access `/en/superuser`
  - **Expected:** Access denied error or redirect

---

### 2. City Creation Form - UI/UX ✓

#### 2.1 Access City Creation Form

**Steps:**
1. From superuser dashboard, click "Create City" or navigate to http://localhost:3001/en/superuser/cities/new
2. Observe the form layout

**Expected Result:**
- ✅ Form loads successfully
- ✅ Shows clear sections (Basic Information, Translations)
- ✅ All fields are visible and labeled
- ✅ Form has a professional appearance using Shadcn/ui components

---

#### 2.2 Form Fields Validation - Basic Information

**Test Case A: Empty Form Submission**

**Steps:**
1. On city creation form, click "Submit" without filling any fields
2. Observe validation errors

**Expected Result:**
- ✅ Form prevents submission
- ✅ Shows validation error messages for required fields
- ✅ Errors appear near relevant fields
- ✅ Required fields highlighted: slug, country, center_lat, center_lng

---

**Test Case B: Invalid Slug Format**

**Steps:**
1. Fill in slug with invalid formats:
   - `New York` (spaces)
   - `Paris!` (special characters)
   - `BERLIN` (uppercase)
   - `123` (numbers only)
2. Try to submit

**Expected Result:**
- ✅ Validation errors for each invalid format
- ✅ Error message explains correct format (lowercase, letters, numbers, hyphens)
- ✅ Valid examples: `new-york`, `paris`, `berlin-2024`

---

**Test Case C: Invalid Coordinates**

**Steps:**
1. Fill in latitude/longitude with invalid values:
   - Latitude: `100` (out of range -90 to 90)
   - Longitude: `200` (out of range -180 to 180)
   - Latitude: `abc` (non-numeric)
2. Try to submit

**Expected Result:**
- ✅ Validation errors for out-of-range values
- ✅ Clear error messages explaining valid ranges
- ✅ Latitude: -90 to 90
- ✅ Longitude: -180 to 180

---

#### 2.3 Form Fields Validation - Translations

**Test Case A: Missing English Translation (Required)**

**Steps:**
1. Fill in basic information correctly
2. Leave English name field empty
3. Fill in Dutch and/or French names
4. Try to submit

**Expected Result:**
- ✅ Validation error: "English name is required"
- ✅ Form prevents submission
- ✅ Other translations can remain optional

---

**Test Case B: Translation Fields Accept Unicode**

**Steps:**
1. Fill in translations with various scripts:
   - English: `Amsterdam`
   - Dutch: `Amsterdam`
   - French: `Amsterdam`
   - Try special characters: `Zürich`, `São Paulo`, `北京`
2. Observe field behavior

**Expected Result:**
- ✅ Fields accept all Unicode characters
- ✅ No character encoding issues
- ✅ Text displays correctly in inputs

---

### 3. City Creation - Success Scenarios ✓

#### 3.1 Create City with Minimal Data

**Steps:**
1. Fill in ONLY required fields:
   - Slug: `paris`
   - Country: Select "Netherlands" (only available option)
   - Center Latitude: `48.8566`
   - Center Longitude: `2.3522`
   - English Name: `Paris`
2. Click "Submit" or "Save City"
3. Wait for submission

**Expected Result:**
- ✅ Form submits successfully
- ✅ Success message appears (toast or alert)
- ✅ Redirected to city list or dashboard
- ✅ New city appears in database

**Database Verification:**
```bash
docker exec supabase_db_supabase psql -U postgres -d postgres -c "SELECT slug, status FROM cities WHERE slug = 'paris'"
```
Expected: 1 row with slug='paris', status='draft'

---

#### 3.2 Create City with Full Translations

**Steps:**
1. Fill in all fields:
   - Slug: `lyon`
   - Country: Netherlands
   - Center Latitude: `45.75`
   - Center Longitude: `4.85`
   - English Name: `Lyon`
   - English Description: `Third-largest city in France, known for cuisine and culture.`
   - Dutch Name: `Lyon`
   - Dutch Description: `Derde grootste stad van Frankrijk, bekend om zijn keuken.`
   - French Name: `Lyon`
   - French Description: `Troisième plus grande ville de France, connue pour sa gastronomie.`
2. Submit the form

**Expected Result:**
- ✅ Form submits successfully
- ✅ Success message appears
- ✅ All translations saved correctly

**Database Verification:**
```bash
# Check city exists
docker exec supabase_db_supabase psql -U postgres -d postgres -c "SELECT slug FROM cities WHERE slug = 'lyon'"

# Check translations
docker exec supabase_db_supabase psql -U postgres -d postgres -c "SELECT ct.locale_code, ct.name, ct.description FROM city_translations ct JOIN cities c ON ct.city_id = c.id WHERE c.slug = 'lyon' ORDER BY ct.locale_code"
```

Expected: 3 rows (en, fr, nl) with correct translations

---

#### 3.3 Create City with Optional Fields

**Steps:**
1. Fill in basic info and English translation
2. Fill in only ONE optional translation (e.g., Dutch only)
3. Leave French translation empty
4. Submit

**Expected Result:**
- ✅ Form submits successfully
- ✅ City created with partial translations
- ✅ Database has translations only for filled locales

---

### 4. Error Handling & Edge Cases ✓

#### 4.1 Duplicate City Slug

**Steps:**
1. Try to create a city with slug: `amsterdam` (already exists)
2. Fill in other required fields
3. Submit

**Expected Result:**
- ✅ Form submission fails with error
- ✅ Error message: "A city with this slug already exists" or similar
- ✅ User can correct the slug and retry
- ✅ No partial data saved to database

---

#### 4.2 Database Transaction Rollback

**Purpose:** Verify that if translation insertion fails, the entire operation rolls back

**Steps:**
1. Create a city with valid data
2. Check database for city and translations
3. Verify no orphaned records exist

**Expected Result:**
- ✅ Either all data saves (city + translations) OR nothing saves
- ✅ No orphaned city without translations
- ✅ No orphaned translations without city

**Database Verification:**
```bash
# Check for cities without translations (should be 0 or have draft status)
docker exec supabase_db_supabase psql -U postgres -d postgres -c "SELECT c.slug FROM cities c LEFT JOIN city_translations ct ON c.id = ct.city_id WHERE ct.id IS NULL"
```

---

#### 4.3 Network Error Simulation

**Steps:**
1. Fill in valid city data
2. Open browser DevTools → Network tab
3. Throttle to "Offline" or "Slow 3G"
4. Submit form
5. Observe error handling

**Expected Result:**
- ✅ Form shows loading state
- ✅ Eventually shows timeout or network error
- ✅ User-friendly error message (not technical stack trace)
- ✅ User can retry submission

---

### 5. Internationalization (i18n) ✓

#### 5.1 Form in Different Locales

**Test Case A: English UI**

**Steps:**
1. Access http://localhost:3001/en/superuser/cities/new
2. Observe all labels, buttons, and help text

**Expected Result:**
- ✅ All text in English
- ✅ Field labels: "Slug", "Country", "Latitude", "Longitude"
- ✅ Section titles: "Basic Information", "English Translation", etc.
- ✅ Submit button in English

---

**Test Case B: Dutch UI**

**Steps:**
1. Access http://localhost:3001/nl/superuser/cities/new
2. Observe all labels, buttons, and help text

**Expected Result:**
- ✅ All UI text in Dutch
- ✅ Form structure remains the same
- ✅ Validation errors in Dutch

---

**Test Case C: French UI**

**Steps:**
1. Access http://localhost:3001/fr/superuser/cities/new
2. Observe all labels and text

**Expected Result:**
- ✅ All UI text in French
- ✅ Consistent behavior across locales

---

### 6. Data Persistence & Integrity ✓

#### 6.1 Verify Created Cities

**Steps:**
1. Create 2-3 cities using the form
2. Query database to verify all data

**Database Verification:**
```bash
# List all cities
docker exec supabase_db_supabase psql -U postgres -d postgres -c "SELECT c.slug, c.status, c.center_lat, c.center_lng, COUNT(ct.id) as translation_count FROM cities c LEFT JOIN city_translations ct ON c.id = ct.city_id GROUP BY c.id ORDER BY c.created_at DESC"
```

**Expected Result:**
- ✅ All created cities appear
- ✅ Each city has at least 1 translation (English required)
- ✅ Coordinates stored correctly
- ✅ Default status is 'draft'

---

#### 6.2 Verify Timestamps

**Database Verification:**
```bash
# Check timestamps
docker exec supabase_db_supabase psql -U postgres -d postgres -c "SELECT slug, created_at, updated_at FROM cities ORDER BY created_at DESC LIMIT 5"
```

**Expected Result:**
- ✅ `created_at` and `updated_at` are set
- ✅ Timestamps are recent (within test execution time)
- ✅ Both timestamps equal for new cities

---

### 7. Security & Authorization ✓

#### 7.1 Non-Superuser Access Attempt

**Steps:**
1. Log out superuser
2. Log in as operator: `operator-ams@example.com`
3. Try to access http://localhost:3001/en/superuser/cities/new
4. Try to access http://localhost:3001/en/superuser

**Expected Result:**
- ✅ Access denied (403) or redirect to login
- ✅ Error message: "Insufficient permissions" or similar
- ✅ User cannot bypass authorization via URL manipulation

---

#### 7.2 Unauthenticated Access Attempt

**Steps:**
1. Log out all users
2. Try to access superuser pages directly via URL

**Expected Result:**
- ✅ Redirect to login page
- ✅ After login, redirect back to intended page (if superuser)
- ✅ No data exposure to unauthenticated users

---

### 8. UI/UX Quality Checks ✓

#### 8.1 Responsive Design

**Steps:**
1. Open city creation form
2. Resize browser window to different widths:
   - Desktop: 1920px
   - Tablet: 768px
   - Mobile: 375px
3. Test form usability at each size

**Expected Result:**
- ✅ Form remains usable at all sizes
- ✅ No horizontal scrolling on mobile
- ✅ Fields stack appropriately
- ✅ Buttons remain accessible

---

#### 8.2 Accessibility

**Steps:**
1. Open form and use TAB key to navigate
2. Verify all fields are focusable in logical order
3. Check labels are associated with inputs
4. Test form submission with keyboard (Enter key)

**Expected Result:**
- ✅ Logical tab order: slug → country → lat → lng → translations
- ✅ All form controls keyboard accessible
- ✅ Clear focus indicators
- ✅ Labels properly associated (click label focuses input)

---

#### 8.3 Loading States

**Steps:**
1. Fill in form with valid data
2. Click submit
3. Observe UI during submission

**Expected Result:**
- ✅ Submit button shows loading state ("Saving..." or spinner)
- ✅ Submit button disabled during submission
- ✅ User cannot submit form multiple times
- ✅ Loading state clears after success/error

---

## Quick Test Checklist

Use this checklist for rapid regression testing:

- [ ] 1. Login as superuser works
- [ ] 2. Dashboard displays correctly
- [ ] 3. City creation form loads
- [ ] 4. Required field validation works
- [ ] 5. Slug format validation works
- [ ] 6. Coordinate range validation works
- [ ] 7. English translation required
- [ ] 8. Can create city with minimal data
- [ ] 9. Can create city with full translations
- [ ] 10. Duplicate slug prevention works
- [ ] 11. Success message displays
- [ ] 12. Data saved to database correctly
- [ ] 13. Form works in all locales (en/nl/fr)
- [ ] 14. Non-superuser access blocked
- [ ] 15. Responsive on mobile/tablet
- [ ] 16. Keyboard navigation works

---

## Test Data Reference

### Valid Test Cities

Use these for creating test cities:

| Slug | Country | Lat | Lng | English Name |
|------|---------|-----|-----|--------------|
| `paris` | Netherlands | 48.8566 | 2.3522 | Paris |
| `lyon` | Netherlands | 45.75 | 4.85 | Lyon |
| `marseille` | Netherlands | 43.2965 | 5.3698 | Marseille |
| `brussels` | Netherlands | 50.8503 | 4.3517 | Brussels |
| `antwerp` | Netherlands | 51.2194 | 4.4025 | Antwerp |

### Test User Credentials

| Email | Role | Password Method | City Access |
|-------|------|-----------------|-------------|
| `superuser@example.com` | superuser | Magic link via Inbucket | All cities (implicit) |
| `admin-ams@example.com` | admin | Magic link via Inbucket | Amsterdam |
| `operator-ams@example.com` | operator | Magic link via Inbucket | Amsterdam |

---

## Cleanup After Testing

After testing, you may want to remove test cities:

```bash
# Delete test cities (replace 'paris' with actual slug)
docker exec supabase_db_supabase psql -U postgres -d postgres -c "DELETE FROM cities WHERE slug IN ('paris', 'lyon', 'marseille', 'brussels', 'antwerp')"

# Verify deletion
docker exec supabase_db_supabase psql -U postgres -d postgres -c "SELECT slug FROM cities ORDER BY created_at DESC"
```

---

## Known Issues / Expected Behaviors

Document any known issues here during testing:

1. **None currently** - All Day 13 features working as expected

---

## Testing Notes

Use this space to record observations during testing:

- Date tested: _______________
- Tester: _______________
- Browser: _______________
- Issues found:
  -
  -
- Suggestions:
  -
  -

---

**Last Updated:** November 3, 2025
