# Day 28: Description Translations UI - Manual Testing Plan

**Test Date:** November 12, 2025
**Tester:** Development Team
**Build Version:** Phase 2 - Day 28
**Test Environment:** Local development (http://localhost:3001)

## Overview

Day 28 implements the multi-language translation editor for descriptions. Operators can manage description text across different UI locales (EN/NL/FR), with inline editing, character count validation, and AI translation tracking.

**Features to Test:**
- Description translations page access and navigation
- Translation list view with existing translations
- Inline translation editing (textarea with character count)
- Save/cancel functionality
- Translation deletion with confirmation
- AI translation badge display
- Available locales display
- Input validation (empty text, character limits)
- Error handling and user feedback
- Multi-language support (EN/NL/FR)
- RLS policy enforcement

### Prerequisites

**Required Setup:**
1. ✅ Supabase local instance running (ports 54331-54336)
2. ✅ Test user accounts with different roles:
   - `operator.test@example.com` (operator for Amsterdam)
   - `districts.test@example.com` (operator for Amsterdam)
   - `admin.test@example.com` (admin for Amsterdam)
3. ✅ Amsterdam city data seeded
4. ✅ At least 1 language and 1 description created
5. ✅ Description translation tables created via migration
6. ✅ Locales table populated (en, nl, fr)

**Database Verification:**
```bash
# Verify description translations table
docker exec supabase_db_language-map psql -U postgres -d postgres -c "\d description_translations"

# Check available locales
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT code, native_name FROM locales ORDER BY code;"

# Check test description exists
docker exec supabase_db_language-map psql -U postgres -d postgres -c "SELECT d.id, l.endonym as language FROM descriptions d JOIN languages l ON d.language_id = l.id WHERE d.city_id = (SELECT id FROM cities WHERE slug = 'amsterdam') LIMIT 3;"
```

---

## Test Scenarios

### 1. Navigation & Access Control (4 scenarios)

#### Scenario 1.1: Access Translations Page from Description List
**Steps:**
1. Log in as `operator.test@example.com`
2. Navigate to `/en/operator/amsterdam/descriptions`
3. Click on a description row
4. Click "Translations" button
5. Verify URL: `/en/operator/amsterdam/descriptions/{id}/translations`

**Expected Results:**
- ✅ Translations page loads successfully
- ✅ Page header shows "Description Translations"
- ✅ Breadcrumb trail shows: Descriptions → [Language Name] → Translations
- ✅ Help card explains translation management
- ✅ Existing translations section displays if translations exist
- ✅ Missing locales section displays locales without translations

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 1.2: Access Translations Page from Description Edit
**Steps:**
1. Log in as `operator.test@example.com`
2. Navigate to description edit page: `/en/operator/amsterdam/descriptions/{id}`
3. Click "Manage Translations" link at bottom of form
4. Verify navigation to translations page

**Expected Results:**
- ✅ Redirects to `/en/operator/amsterdam/descriptions/{id}/translations`
- ✅ Translations page loads with correct description context
- ✅ Back button works correctly

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 1.3: Access Denied for Unauthorized City
**Steps:**
1. Log in as operator with access to Amsterdam only
2. Try to access: `/en/operator/paris/descriptions/{paris-desc-id}/translations`
3. Observe behavior

**Expected Results:**
- ✅ Redirect to login or error page
- ✅ Or displays "Access Denied" message
- ✅ Translations from Paris descriptions are NOT accessible

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 1.4: Unauthorized User Cannot Access
**Steps:**
1. Log out
2. Try to access: `/en/operator/amsterdam/descriptions/{id}/translations` directly
3. Observe behavior

**Expected Results:**
- ✅ Redirect to login page
- ✅ After login, can access the page
- ✅ No data exposed to unauthenticated users

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### 2. Translation List Display (5 scenarios)

#### Scenario 2.1: Display Existing Translations
**Steps:**
1. Create a description with translations in EN and NL
2. Navigate to translations page for this description
3. Observe existing translations section

**Expected Results:**
- ✅ "Existing Translations" heading shows "2 translations exist"
- ✅ English translation card displays with locale badge "en"
- ✅ Dutch translation card displays with locale badge "nl"
- ✅ Translation text is displayed in read-only mode
- ✅ Edit button (pencil icon) visible on each card
- ✅ Delete button (trash icon) visible on each card
- ✅ Cards are well-formatted and readable

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 2.2: Display AI Translation Badge
**Steps:**
1. Create an AI-generated translation (set `is_ai_translated = true`)
2. Navigate to translations page
3. Observe AI badge display

**Expected Results:**
- ✅ AI badge displays next to locale badge
- ✅ Badge has amber/yellow styling (`bg-amber-100 text-amber-900`)
- ✅ Badge text shows "AI"
- ✅ AI translation info displays: "AI-generated by {model} on {date}"
- ✅ Non-AI translations do not show the badge

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 2.3: Display Missing Locales Section
**Steps:**
1. Create a description with only EN translation
2. Navigate to translations page
3. Observe missing locales section

**Expected Results:**
- ✅ "Add Translation for Missing Locales" heading visible
- ✅ Missing locale cards displayed (nl, fr)
- ✅ Each missing locale shows:
  - Locale name (e.g., "Nederlands")
  - Locale code badge (e.g., "nl")
  - Empty textarea in edit mode
  - Save button (disabled when empty)
- ✅ Character counter shows "0 / 5000 characters"

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 2.4: Empty State - No Translations
**Steps:**
1. Create a description with NO translations (only metadata)
2. Navigate to translations page
3. Observe display

**Expected Results:**
- ✅ "Existing Translations" section shows "0 translations exist"
- ✅ Help text explains how to add translations
- ✅ "Add Translation for Missing Locales" section shows all 3 locales (en, nl, fr)
- ✅ All locale cards are in edit mode
- ✅ No error or crash

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 2.5: Translation Text Formatting
**Steps:**
1. Create a translation with:
   - Multiple paragraphs
   - Line breaks
   - Special characters (é, ñ, ü, etc.)
2. View translation in display mode

**Expected Results:**
- ✅ Line breaks are preserved (`whitespace-pre-wrap`)
- ✅ Special characters display correctly
- ✅ Long text wraps appropriately
- ✅ No text truncation or overflow issues
- ✅ Text is readable in display mode

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### 3. Create New Translation (6 scenarios)

#### Scenario 3.1: Create Translation - Happy Path
**Steps:**
1. Navigate to translations page with missing NL translation
2. Find Dutch locale card in missing locales section
3. Type valid text: "Dit is een testbeschrijving van de gemeenschap."
4. Observe character counter update
5. Click "Save" button
6. Wait for save to complete

**Expected Results:**
- ✅ Character counter updates in real-time (44 / 5000 characters)
- ✅ Save button becomes enabled when text entered
- ✅ Save button shows "Saving..." during submission
- ✅ Page refreshes after successful save
- ✅ New translation appears in "Existing Translations" section
- ✅ Translation is in display mode (not edit mode)
- ✅ Missing locale card for NL disappears
- ✅ Success feedback (implicit via UI update)

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 3.2: Create Translation with Special Characters
**Steps:**
1. Navigate to translations page with missing FR translation
2. Type text with accents: "Voici une description de la communauté française à Amsterdam."
3. Save translation

**Expected Results:**
- ✅ Special characters (é, à) are accepted
- ✅ Character counter counts correctly with special characters
- ✅ Translation saves successfully
- ✅ Special characters display correctly after save

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 3.3: Create Translation with Line Breaks
**Steps:**
1. Navigate to translations page
2. Type multi-line text:
   ```
   First paragraph about the community.

   Second paragraph with more details.

   Third paragraph conclusion.
   ```
3. Save translation

**Expected Results:**
- ✅ Line breaks are preserved in textarea
- ✅ Character count includes line break characters
- ✅ Translation saves with line breaks
- ✅ Line breaks display correctly in display mode (`whitespace-pre-wrap`)

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 3.4: Create Translation Near Character Limit
**Steps:**
1. Navigate to translations page
2. Type text that is exactly 5000 characters
3. Observe character counter
4. Save translation

**Expected Results:**
- ✅ Character counter shows "5000 / 5000 characters"
- ✅ Save button remains enabled
- ✅ Translation saves successfully
- ✅ No error for max length

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 3.5: Validation - Empty Text
**Steps:**
1. Navigate to translations page with missing locale
2. Leave textarea empty
3. Try to click Save button

**Expected Results:**
- ✅ Save button is disabled when textarea is empty
- ✅ Cannot trigger save action
- ✅ No validation error shown (button simply disabled)

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 3.6: Validation - Whitespace Only
**Steps:**
1. Navigate to translations page with missing locale
2. Type only spaces/tabs: "     "
3. Observe Save button state

**Expected Results:**
- ✅ Save button remains disabled (text.trim() is empty)
- ✅ Character counter shows space count but button disabled
- ✅ Cannot save whitespace-only translation

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### 4. Edit Existing Translation (8 scenarios)

#### Scenario 4.1: Edit Translation - Happy Path
**Steps:**
1. Navigate to translations page with existing EN translation
2. Click Edit button (pencil icon) on EN translation card
3. Observe mode change to edit mode
4. Modify text: Add " Updated content."
5. Click Save button
6. Wait for save

**Expected Results:**
- ✅ Card switches to edit mode
- ✅ Textarea displays with current text
- ✅ Save and Cancel buttons appear
- ✅ Edit and Delete buttons are hidden
- ✅ Save button shows "Saving..." during submission
- ✅ Page refreshes after save
- ✅ Updated text displays in display mode
- ✅ Success feedback (implicit via UI update)

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 4.2: Edit and Cancel
**Steps:**
1. Navigate to translations page with existing NL translation
2. Click Edit button
3. Modify text significantly
4. Click Cancel button

**Expected Results:**
- ✅ Returns to display mode
- ✅ Original text is restored (changes discarded)
- ✅ No save request sent
- ✅ No error message

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 4.3: Edit with Validation Error
**Steps:**
1. Navigate to translations page with existing translation
2. Click Edit button
3. Clear all text (select all + delete)
4. Observe Save button state

**Expected Results:**
- ✅ Save button becomes disabled
- ✅ Cannot save empty translation
- ✅ Cancel button still works

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 4.4: Edit AI-Translated Content
**Steps:**
1. Create AI-generated translation (is_ai_translated = true)
2. Navigate to translations page
3. Click Edit on AI translation
4. Modify text
5. Save

**Expected Results:**
- ✅ Can edit AI-generated translation
- ✅ AI badge still displays after save (flag preserved)
- ✅ Translation saves successfully
- ✅ No special warning about editing AI content

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 4.5: Edit with Network Error
**Steps:**
1. Open browser DevTools → Network tab
2. Set network to "Offline"
3. Navigate to translations page
4. Edit a translation and click Save
5. Observe behavior

**Expected Results:**
- ✅ Save attempt fails
- ✅ Error message displays: "Failed to update translation..."
- ✅ Translation remains in edit mode
- ✅ User can retry after fixing network
- ✅ No data loss (text still in textarea)

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 4.6: Edit with Server Error (500)
**Steps:**
1. Mock server action to throw error
2. Edit translation and save
3. Observe error handling

**Expected Results:**
- ✅ Error message displays with error text
- ✅ Translation remains in edit mode
- ✅ User can cancel or retry
- ✅ Console logs error for debugging

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 4.7: Edit Multiple Translations Sequentially
**Steps:**
1. Navigate to page with EN, NL, FR translations
2. Edit EN translation, save
3. Edit NL translation, save
4. Edit FR translation, save

**Expected Results:**
- ✅ Each edit-save cycle works independently
- ✅ No state conflicts between edits
- ✅ All translations update correctly
- ✅ No UI glitches or race conditions

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 4.8: Character Counter During Edit
**Steps:**
1. Navigate to translations page
2. Edit existing translation
3. Type additional text
4. Observe character counter update

**Expected Results:**
- ✅ Character counter updates in real-time as typing
- ✅ Shows format: "{count} / 5000 characters"
- ✅ Counter includes current text length
- ✅ Counter turns red/warning color near limit (if styled)

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### 5. Delete Translation (6 scenarios)

#### Scenario 5.1: Delete Translation - Happy Path
**Steps:**
1. Navigate to translations page with existing NL translation
2. Click Delete button (trash icon) on NL translation card
3. Observe confirmation dialog
4. Click "OK" on confirmation
5. Wait for deletion

**Expected Results:**
- ✅ Browser confirmation dialog appears
- ✅ Dialog message: "Are you sure you want to delete this translation?"
- ✅ If user clicks OK:
  - Page refreshes after deletion
  - NL translation disappears from existing translations
  - NL locale appears in missing locales section
  - Deletion is permanent (database record deleted)
- ✅ Success feedback (implicit via UI update)

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 5.2: Delete Translation and Cancel
**Steps:**
1. Navigate to translations page
2. Click Delete button on translation
3. Click "Cancel" on confirmation dialog

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ If user clicks Cancel:
  - Dialog closes
  - Translation remains unchanged
  - No delete request sent
  - Translation still visible

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 5.3: Delete Last Remaining Translation
**Steps:**
1. Create description with only 1 translation (EN)
2. Navigate to translations page
3. Delete the EN translation
4. Observe result

**Expected Results:**
- ✅ Translation deletes successfully
- ✅ "Existing Translations" shows "0 translations exist"
- ✅ EN appears in missing locales section
- ✅ Description metadata (language_id, etc.) remains intact
- ✅ Can add new translations after deleting last one

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 5.4: Delete with Network Error
**Steps:**
1. Open browser DevTools → Network tab
2. Set network to "Offline"
3. Try to delete a translation
4. Confirm deletion
5. Observe behavior

**Expected Results:**
- ✅ Delete attempt fails
- ✅ Error logged to console (but NOT displayed in UI in current implementation)
- ✅ Translation remains visible
- ✅ Page does NOT refresh
- ✅ User can retry after fixing network

**Note:** Current implementation logs delete errors but doesn't show them in UI (error display only in edit mode)

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 5.5: Delete While Another User Edits
**Steps:**
1. User A: Open translation in edit mode
2. User B: Delete same translation in another browser
3. User A: Try to save changes

**Expected Results:**
- ✅ User A's save fails (translation no longer exists)
- ✅ Error message: "Failed to update translation..."
- ✅ User A can cancel and refresh to see current state
- ✅ No data corruption

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 5.6: Delete Button Disabled During Delete
**Steps:**
1. Navigate to translations page
2. Click Delete button
3. Confirm deletion
4. Immediately observe button state

**Expected Results:**
- ✅ Delete button becomes disabled during operation
- ✅ Edit button also disabled during delete
- ✅ Prevents double-clicks
- ✅ UI indicates operation in progress

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### 6. Internationalization (i18n) (4 scenarios)

#### Scenario 6.1: Page Display in English
**Steps:**
1. Navigate to `/en/operator/amsterdam/descriptions/{id}/translations`
2. Observe all UI text

**Expected Results:**
- ✅ Page header: "Description Translations"
- ✅ Help text in English
- ✅ Existing translations heading: "Existing Translations"
- ✅ Missing locales heading: "Add Translation for Missing Locales"
- ✅ Button labels: "Save", "Cancel", "Edit", "Delete"
- ✅ Character counter: "characters"
- ✅ Locale names: "English", "Dutch", "French"

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 6.2: Page Display in Dutch
**Steps:**
1. Navigate to `/nl/operator/amsterdam/descriptions/{id}/translations`
2. Observe all UI text

**Expected Results:**
- ✅ Page header in Dutch: "Beschrijvingsvertalingen"
- ✅ Help text in Dutch
- ✅ Button labels in Dutch: "Opslaan", "Annuleren", "Bewerken", "Verwijderen"
- ✅ Character counter: "tekens"
- ✅ Locale names in Dutch

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 6.3: Page Display in French
**Steps:**
1. Navigate to `/fr/operator/amsterdam/descriptions/{id}/translations`
2. Observe all UI text

**Expected Results:**
- ✅ Page header in French: "Traductions de descriptions"
- ✅ Help text in French
- ✅ Button labels in French: "Enregistrer", "Annuler", "Modifier", "Supprimer"
- ✅ Character counter: "caractères"
- ✅ Locale names in French

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 6.4: Switch Locale Mid-Session
**Steps:**
1. Navigate to translations page in English
2. Switch browser language preference to Dutch
3. Navigate to translations page again
4. Observe language change

**Expected Results:**
- ✅ UI language updates to Dutch
- ✅ Translation content remains unchanged (data translations are separate)
- ✅ No errors during locale switch
- ✅ Breadcrumbs and navigation update to new locale

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### 7. Error Handling & Edge Cases (6 scenarios)

#### Scenario 7.1: Invalid Description ID
**Steps:**
1. Navigate to: `/en/operator/amsterdam/descriptions/invalid-uuid/translations`
2. Observe behavior

**Expected Results:**
- ✅ Page displays error or 404 page
- ✅ Error message: "Description not found" or similar
- ✅ No crash or unhandled exception
- ✅ User can navigate back

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 7.2: Description Deleted While Viewing Translations
**Steps:**
1. Open translations page for description X
2. In another browser tab, delete description X
3. In first tab, try to save a translation
4. Observe behavior

**Expected Results:**
- ✅ Save fails with error: "Description not found or access denied"
- ✅ Error message displayed to user
- ✅ User can navigate away
- ✅ No data corruption

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 7.3: Locale Deleted from System
**Steps:**
1. Admin removes "fr" locale from system (unlikely but possible)
2. Try to view translations page that has FR translation
3. Observe behavior

**Expected Results:**
- ✅ Page loads (no crash)
- ✅ FR translation may show with code "fr" even if locale missing
- ✅ Or FR translation is filtered out
- ✅ No unhandled exception

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 7.4: XSS Prevention in Translation Text
**Steps:**
1. Create translation with XSS attempt: `<script>alert('XSS')</script>`
2. Save translation
3. View translation in display mode

**Expected Results:**
- ✅ Script tags are sanitized/escaped
- ✅ No JavaScript execution
- ✅ Text displays as plain text or sanitized HTML
- ✅ `sanitizeDescription()` function prevents XSS

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 7.5: SQL Injection Prevention
**Steps:**
1. Create translation with SQL injection attempt: `'; DROP TABLE descriptions; --`
2. Save translation
3. Check database integrity

**Expected Results:**
- ✅ Translation saves as plain text
- ✅ No SQL execution
- ✅ Database tables intact
- ✅ Supabase parameterized queries prevent injection

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 7.6: Concurrent Edit Conflict
**Steps:**
1. User A: Opens translation in edit mode
2. User B: Edits and saves same translation
3. User A: Tries to save without refreshing

**Expected Results:**
- ✅ User A's save succeeds (last write wins)
- ✅ Or shows warning about potential overwrite
- ✅ No data corruption
- ✅ Database enforces consistency

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### 8. Accessibility (ARIA) (4 scenarios)

#### Scenario 8.1: Screen Reader - Button Labels
**Steps:**
1. Enable screen reader (VoiceOver on Mac, NVDA on Windows)
2. Navigate to translations page
3. Tab through Edit and Delete buttons

**Expected Results:**
- ✅ Edit button announces: "Edit" (aria-label)
- ✅ Delete button announces: "Delete" (aria-label)
- ✅ Save button announces: "Save"
- ✅ Cancel button announces: "Cancel"
- ✅ All icon-only buttons have accessible names

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 8.2: Screen Reader - Form Labels
**Steps:**
1. Enable screen reader
2. Navigate to missing locale section
3. Focus on textarea

**Expected Results:**
- ✅ Textarea announces label: "Description Text"
- ✅ Character counter is announced or accessible
- ✅ Save button state (enabled/disabled) is announced
- ✅ Form is navigable with keyboard only

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 8.3: Keyboard Navigation
**Steps:**
1. Navigate to translations page
2. Use Tab key to navigate through all interactive elements
3. Use Enter/Space to activate buttons
4. Use Shift+Tab to navigate backwards

**Expected Results:**
- ✅ Can reach all buttons with Tab
- ✅ Focus indicator visible on all elements
- ✅ Enter key activates buttons
- ✅ Escape key cancels edit mode (if implemented)
- ✅ No keyboard traps

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 8.4: Contrast and Visual Accessibility
**Steps:**
1. Navigate to translations page
2. Use browser's accessibility inspector
3. Check color contrast ratios

**Expected Results:**
- ✅ All text has sufficient contrast (WCAG AA: 4.5:1 for normal text)
- ✅ Buttons have sufficient contrast in all states
- ✅ AI badge has sufficient contrast
- ✅ Focus indicators are clearly visible

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### 9. Performance & UX (4 scenarios)

#### Scenario 9.1: Page Load Performance
**Steps:**
1. Navigate to translations page with 3 translations
2. Measure page load time (Network tab)
3. Observe rendering

**Expected Results:**
- ✅ Page loads in < 2 seconds
- ✅ No layout shift during load
- ✅ All content renders quickly
- ✅ No loading spinners or delays

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 9.2: Save Operation Feedback
**Steps:**
1. Edit translation and save
2. Observe UI feedback during save

**Expected Results:**
- ✅ Save button shows "Saving..." text
- ✅ Save button is disabled during save
- ✅ Page refreshes after successful save
- ✅ Total operation feels snappy (< 1 second)
- ✅ No unnecessary loading spinners

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 9.3: Character Counter Performance
**Steps:**
1. Navigate to translation edit mode
2. Type continuously in textarea
3. Observe character counter

**Expected Results:**
- ✅ Counter updates smoothly in real-time
- ✅ No lag or stuttering
- ✅ No performance degradation with long text
- ✅ Counter stops at 5000 without issue

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 9.4: Multiple Cards Rendering
**Steps:**
1. Navigate to page with all 3 locales (EN, NL, FR) with translations
2. Observe rendering

**Expected Results:**
- ✅ All 3 cards render quickly
- ✅ No rendering delays or stutters
- ✅ Cards are well-spaced and readable
- ✅ No UI glitches with multiple cards

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### 10. Integration with Other Features (3 scenarios)

#### Scenario 10.1: Integration with Description Edit Page
**Steps:**
1. Navigate to description edit page
2. Click "Manage Translations" link
3. Add a new translation
4. Navigate back to edit page

**Expected Results:**
- ✅ Link navigates to translations page
- ✅ Breadcrumb shows correct path
- ✅ Can navigate back without issues
- ✅ Changes persist after navigation

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 10.2: Integration with Description List Page
**Steps:**
1. Navigate to descriptions list
2. Click translations button on a description
3. Add/edit translations
4. Navigate back to list

**Expected Results:**
- ✅ Translations link works from list page
- ✅ Changes persist when returning to list
- ✅ List still displays correctly
- ✅ No data inconsistencies

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

#### Scenario 10.3: RLS Policy Enforcement
**Steps:**
1. Log in as operator with Amsterdam access
2. Create description in Amsterdam with translations
3. Log out and log in as operator with Paris access only
4. Try to access Amsterdam description translations directly

**Expected Results:**
- ✅ Paris operator cannot access Amsterdam translations
- ✅ Server returns 403 Forbidden or redirects
- ✅ No data leakage across cities
- ✅ RLS policies enforced correctly

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Testing Summary

**Total Scenarios:** 62
- Navigation & Access: 4 scenarios
- Translation List Display: 5 scenarios
- Create New Translation: 6 scenarios
- Edit Existing Translation: 8 scenarios
- Delete Translation: 6 scenarios
- Internationalization (i18n): 4 scenarios
- Error Handling & Edge Cases: 6 scenarios
- Accessibility (ARIA): 4 scenarios
- Performance & UX: 4 scenarios
- Integration: 3 scenarios

**Complexity Level:** 🟡 MEDIUM
- Mostly CRUD operations with validation
- Some complex scenarios (concurrent edits, error handling)
- Good test coverage from unit tests (96% component, 86.72% server actions)

---

## Automated Test Coverage

**Unit Tests:** 58 tests passing
- **Server Actions:** 26 tests (`app/actions/description-translations.test.ts`)
  - Coverage: 86.72% statements, 84% branches, 100% functions
- **Component:** 32 tests (`components/descriptions/description-translation-form.test.tsx`)
  - Coverage: 96% statements, 89.47% branches, 100% functions

**Test Categories Covered:**
- ✅ Input validation
- ✅ Create/update/delete operations
- ✅ Error handling (network, server, validation)
- ✅ Prop validation
- ✅ Form state management
- ✅ Accessibility (ARIA labels)
- ✅ Authentication/authorization checks

**Manual Testing Focus:**
- Browser-specific behavior (confirmation dialogs)
- Visual rendering and UX
- Keyboard navigation
- Screen reader compatibility
- Cross-browser compatibility
- Real network conditions
- Multi-user scenarios

---

## Known Issues & Technical Debt

**Minor UI Issue:**
- ⚠️ Delete errors are logged to console but NOT displayed to user in UI
  - Current behavior: Errors during delete in display mode are logged but not shown
  - Error display is only available in edit mode
  - Recommendation: Add toast notification or error display for delete failures
  - Impact: LOW - Users may not see error if delete fails silently
  - Workaround: Check console logs or refresh page to verify deletion

**Future Enhancements:**
- 📝 Consider adding optimistic UI updates (show changes before server confirms)
- 📝 Add "unsaved changes" warning when navigating away during edit
- 📝 Consider adding rich text editor (currently plain textarea)
- 📝 Add bulk translation operations (translate all missing locales at once)

---

## Testing Execution Plan

**Recommended Approach:**
1. ✅ Unit tests (automated) - COMPLETED
2. 🔄 Critical path scenarios (Scenarios 1.1, 3.1, 4.1, 5.1) - HIGH PRIORITY
3. 🔄 Error handling scenarios (Section 7) - HIGH PRIORITY
4. 🔄 Accessibility scenarios (Section 8) - MEDIUM PRIORITY
5. 🔄 Remaining scenarios - LOW PRIORITY (optional)

**Estimated Time:**
- Critical path: 30 minutes
- Error handling: 30 minutes
- Accessibility: 20 minutes
- All scenarios: 3-4 hours

**Test Data Setup:**
- Create 1 test language in Amsterdam
- Create 1 test description for that language
- Test with different translation states (0, 1, 2, 3 translations)
- Test with both regular and AI-generated translations

---

## Sign-Off

**Manual Testing Completed:** ⬜ Not Started | 🔄 In Progress | ✅ Complete

**Tested By:** _________________________

**Date:** _________________________

**Critical Bugs Found:** _________________________

**Non-Critical Issues:** _________________________

**Approved for Production:** ⬜ Yes | ⬜ No | ⬜ With Conditions

**Notes:**
```
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
```

---

## Appendix: Test Data SQL

```sql
-- Create test language (if not exists)
INSERT INTO languages (id, city_id, endonym, iso_639_3_code)
VALUES (
  '00000000-0000-0000-0000-000000000099',
  (SELECT id FROM cities WHERE slug = 'amsterdam'),
  'Test Language',
  'tst'
)
ON CONFLICT (id) DO NOTHING;

-- Create test language translations
INSERT INTO language_translations (language_id, locale_code, name)
VALUES
  ('00000000-0000-0000-0000-000000000099', 'en', 'Test Language'),
  ('00000000-0000-0000-0000-000000000099', 'nl', 'Testtaal'),
  ('00000000-0000-0000-0000-000000000099', 'fr', 'Langue de test')
ON CONFLICT (language_id, locale_code) DO NOTHING;

-- Create test description
INSERT INTO descriptions (id, city_id, language_id)
VALUES (
  '00000000-0000-0000-0000-000000000088',
  (SELECT id FROM cities WHERE slug = 'amsterdam'),
  '00000000-0000-0000-0000-000000000099'
)
ON CONFLICT (id) DO NOTHING;

-- Create test description translation (EN)
INSERT INTO description_translations (description_id, locale, text)
VALUES (
  '00000000-0000-0000-0000-000000000088',
  'en',
  'This is a test description for the test language community in Amsterdam.'
)
ON CONFLICT (description_id, locale) DO NOTHING;

-- Create AI-generated translation (NL)
INSERT INTO description_translations (description_id, locale, text, is_ai_translated, ai_model, ai_translated_at)
VALUES (
  '00000000-0000-0000-0000-000000000088',
  'nl',
  'Dit is een testbeschrijving voor de testtaalgemeenschap in Amsterdam.',
  true,
  'gpt-4-turbo',
  NOW()
)
ON CONFLICT (description_id, locale) DO NOTHING;

-- Verify test data
SELECT
  d.id as description_id,
  l.endonym as language,
  dt.locale,
  dt.text,
  dt.is_ai_translated
FROM descriptions d
JOIN languages l ON d.language_id = l.id
LEFT JOIN description_translations dt ON d.id = dt.description_id
WHERE d.id = '00000000-0000-0000-0000-000000000088'
ORDER BY dt.locale;
```

---

**End of Day 28 Testing Plan**

*This testing plan covers Description Translations UI (Day 28) and should be executed before proceeding to Day 29 (Integration Testing).*
