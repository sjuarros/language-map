# Manual Testing Guide - Authentication & Authorization

**Feature:** Basic authentication and role-based access control
**Date:** November 4, 2025
**Environment:** Local development (Supabase + Next.js)
**Phase:** Phase 2 - Operator CRUD

---

## Prerequisites

Before starting, ensure:
- ✅ Supabase is running on ports 54331-54336 (`supabase_db_language-map` container)
- ✅ Next.js dev server is running on port 3001
- ✅ Test users are created in the database:
  - `operator-ams@example.com` (operator role, Amsterdam access)
  - `admin-ams@example.com` (admin role, Amsterdam access)
  - `superuser@example.com` (superuser role, all cities)

### Check Services Status

```bash
# Verify Supabase is running
docker ps | grep supabase_db_language-map

# Expected output:
# supabase_db_language-map    supabase/postgres:latest    ...  0.0.0.0:54332->5432/tcp

# Check dev server
curl http://localhost:3001
# Expected: HTML response (not 404 or 500 error)
```

### Verify Test Users in Database

```bash
# Connect to the correct Supabase instance (port 54332)
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
SELECT up.email, up.role, array_agg(c.slug) as city_access
FROM user_profiles up
LEFT JOIN city_users cu ON up.id = cu.user_id
LEFT JOIN cities c ON cu.city_id = c.id
WHERE up.email IN ('operator-ams@example.com', 'admin-ams@example.com', 'superuser@example.com')
GROUP BY up.email, up.role
ORDER BY up.email;
"
```

**Expected Result:**
- `superuser@example.com` has role = 'superuser' (no city_users entry needed)
- `admin-ams@example.com` has role = 'admin' and city_access includes 'amsterdam'
- `operator-ams@example.com` has role = 'operator' and city_access includes 'amsterdam'

---

## Test Scenarios

### 1. Unauthenticated Access Attempts ✓

#### 1.1 Direct URL Access - Without Locale

**Steps:**
1. Log out of the application (clear browser session if needed)
2. Try to access each dashboard directly via URL (no locale prefix):
   - http://localhost:3001/operator
   - http://localhost:3001/admin
   - http://localhost:3001/superuser

**Expected Result:**
- ✅ All requests redirect to login page
- ✅ No dashboard content is visible
- ✅ URL may show login page or maintain original URL with login overlay
- ✅ No sensitive data exposed

**Common Behaviors to Observe:**
- Redirect to `/en/login` (automatic locale detection)
- Stay on same URL with login form overlay
- 302/307 redirect status in network tab

---

#### 1.2 Direct URL Access - With English Locale (en)

**Steps:**
1. Ensure no user is logged in
2. Try to access each dashboard with `/en` prefix:
   - http://localhost:3001/en/operator
   - http://localhost:3001/en/admin
   - http://localhost:3001/en/superuser

**Expected Result:**
- ✅ All requests redirect to login page
- ✅ UI is in English
- ✅ After login, user should be redirected back to original requested page
- ✅ No data leakage or unauthorized access

---

#### 1.3 Direct URL Access - With French Locale (fr)

**Steps:**
1. Ensure no user is logged in
2. Try to access each dashboard with `/fr` prefix:
   - http://localhost:3001/fr/operator
   - http://localhost:3001/fr/admin
   - http://localhost:3001/fr/superuser

**Expected Result:**
- ✅ All requests redirect to login page
- ✅ UI is in French
- ✅ French text and labels visible
- ✅ After login, redirect back to original page (if authorized)

---

#### 1.4 Session Persistence Test

**Steps:**
1. Open http://localhost:3001/en
2. Click "Log In" and send a magic link to `superuser@example.com`
3. **Before clicking the email link**, try to access:
   - http://localhost:3001/en/operator
   - http://localhost:3001/en/admin
   - http://localhost:3001/en/superuser

**Expected Result:**
- ✅ All pages redirect to login (user not authenticated yet)
- ✅ No access granted without clicking magic link

---

### 2. Authentication Flow ✓

#### 2.1 Magic Link Authentication - English

**Steps:**
1. Navigate to http://localhost:3001/en
2. Click "Log In" button
3. Enter email: `operator-ams@example.com`
4. Click "Send magic link"
5. Open Inbucket at http://localhost:54334
6. Find the email for `operator-ams@example.com`
7. Click the magic link

**Expected Result:**
- ✅ Email appears in Inbucket within seconds
- ✅ Clicking link logs user in
- ✅ User redirected to appropriate dashboard based on role
- ✅ Session established (can access protected pages)

**Additional Checks:**
- After login, try accessing: http://localhost:3001/en/operator
  - Should load successfully for operator user
- Check if user name or role appears in navigation/UI
- Verify logout option is available

---

#### 2.2 Magic Link Authentication - French

**Steps:**
1. Log out current user
2. Navigate to http://localhost:3001/fr
3. Click "Se connecter" (French for "Log In")
4. Enter email: `admin-ams@example.com`
5. Click "Envoyer le lien magique"
6. Open Inbucket, find email for `admin-ams@example.com`
7. Click the magic link

**Expected Result:**
- ✅ French UI labels throughout login process
- ✅ Email sent successfully
- ✅ Link redirects to `/fr/admin` or appropriate dashboard
- ✅ French interface maintained after login

---

#### 2.3 Post-Login Redirect Logic

**Test Case A: Operator Redirect**

**Steps:**
1. Log in as `operator-ams@example.com`
2. Observe where user is redirected after clicking magic link

**Expected Result:**
- ✅ User redirected to `/en/operator` or `/fr/operator` (based on locale)
- ✅ Operator dashboard loads successfully
- ✅ User sees operator-specific content/navigation

---

**Test Case B: Admin Redirect**

**Steps:**
1. Log in as `admin-ams@example.com`
2. Observe redirect destination

**Expected Result:**
- ✅ User redirected to `/en/admin` or `/fr/admin`
- ✅ Admin dashboard loads successfully
- ✅ User sees admin-specific content (including user management, etc.)

---

**Test Case C: Superuser Redirect**

**Steps:**
1. Log in as `superuser@example.com`
2. Observe redirect destination

**Expected Result:**
- ✅ User redirected to `/en/superuser` or `/fr/superuser`
- ✅ Superuser dashboard loads successfully
- ✅ User sees superuser-specific content (city creation, platform management, etc.)

---

### 3. Role-Based Authorization ✓

#### 3.1 Operator User Access Matrix

**Operator Role:** `operator-ams@example.com`

**Steps:**
1. Log in as `operator-ams@example.com`
2. Try to access each dashboard:

**A. Access Operator Dashboard**
- Navigate to: http://localhost:3001/en/operator

**Expected Result:**
- ✅ **ALLOWED** - Operator dashboard loads successfully
- ✅ User can see languages list, import/export, etc.
- ✅ No "access denied" error

---

**B. Access Admin Dashboard**
- Navigate to: http://localhost:3001/en/admin
- Try URL: http://localhost:3001/fr/admin

**Expected Result:**
- ❌ **REDIRECT TO LOGIN** or **Access Denied Error**
- ✅ If redirected to login, user should see error message
- ✅ If stay on page, should see clear "insufficient permissions" message
- ✅ User cannot access admin features (user management, city settings, etc.)

---

**C. Access Superuser Dashboard**
- Navigate to: http://localhost:3001/en/superuser
- Try URL: http://localhost:3001/fr/superuser

**Expected Result:**
- ❌ **REDIRECT TO LOGIN** or **Access Denied Error**
- ✅ No access to city creation or platform management
- ✅ Clear error message about insufficient permissions

---

#### 3.2 Admin User Access Matrix

**Admin Role:** `admin-ams@example.com`

**Steps:**
1. Log in as `admin-ams@example.com`
2. Try to access each dashboard:

**A. Access Operator Dashboard**
- Navigate to: http://localhost:3001/en/operator

**Expected Result:**
- ✅ **ALLOWED** - Admin users can access operator dashboard
- ✅ All operator features available
- ✅ Admin can perform operator tasks

---

**B. Access Admin Dashboard**
- Navigate to: http://localhost:3001/en/admin

**Expected Result:**
- ✅ **ALLOWED** - Admin dashboard loads successfully
- ✅ Can see user management, city settings, taxonomies
- ✅ Can manage users for their city (Amsterdam)
- ✅ Can configure city branding and AI settings

---

**C. Access Superuser Dashboard**
- Navigate to: http://localhost:3001/en/superuser

**Expected Result:**
- ❌ **REDIRECT TO LOGIN** or **Access Denied Error**
- ✅ No access to platform-wide features (creating new cities, etc.)
- ✅ Clear error message about insufficient permissions

---

#### 3.3 Superuser Access Matrix

**Superuser Role:** `superuser@example.com`

**Steps:**
1. Log in as `superuser@example.com`
2. Try to access each dashboard:

**A. Access Operator Dashboard**
- Navigate to: http://localhost:3001/en/operator

**Expected Result:**
- ✅ **ALLOWED** - Superuser can access all dashboards
- ✅ All operator features available

---

**B. Access Admin Dashboard**
- Navigate to: http://localhost:3001/en/admin

**Expected Result:**
- ✅ **ALLOWED** - Superuser can access all dashboards
- ✅ All admin features available

---

**C. Access Superuser Dashboard**
- Navigate to: http://localhost:3001/en/superuser

**Expected Result:**
- ✅ **ALLOWED** - Superuser dashboard loads successfully
- ✅ Can create new cities
- ✅ Can manage all users across all cities
- ✅ Can see platform-wide statistics
- ✅ Has full system access

---

### 4. Cross-Locale Authorization Testing ✓

#### 4.1 Operator - All Locales

**Steps:**
1. Log in as `operator-ams@example.com`
2. Test access to operator dashboard in multiple locales:
   - http://localhost:3001/en/operator
   - http://localhost:3001/nl/operator
   - http://localhost:3001/fr/operator

**Expected Result:**
- ✅ All locales allow access to operator dashboard
- ✅ UI translates correctly in each locale
- ✅ Same functionality available in all locales

**Blocked Access Test:**
1. While logged in as operator, try to access admin in each locale:
   - http://localhost:3001/en/admin
   - http://localhost:3001/nl/admin
   - http://localhost:3001/fr/admin

**Expected Result:**
- ❌ All locales block access with same behavior
- ✅ Consistent error handling across locales

---

#### 4.2 Admin - All Locales

**Steps:**
1. Log in as `admin-ams@example.com`
2. Test access in multiple locales:
   - http://localhost:3001/en/admin
   - http://localhost:3001/nl/admin
   - http://localhost:3001/fr/admin

**Expected Result:**
- ✅ All locales allow access to admin dashboard
- ✅ Admin features available in all locales
- ✅ UI translations working properly

---

#### 4.3 Superuser - All Locales

**Steps:**
1. Log in as `superuser@example.com`
2. Test access in multiple locales:
   - http://localhost:3001/en/superuser
   - http://localhost:3001/nl/superuser
   - http://localhost:3001/fr/superuser

**Expected Result:**
- ✅ All locales allow access to superuser dashboard
- ✅ Full functionality in all locales
- ✅ UI correctly translated

---

### 5. Edge Cases & Security ✓

#### 5.1 URL Manipulation

**Test Case A: Manual URL Entry**

**Steps:**
1. Log in as `operator-ams@example.com`
2. Manually type in address bar: http://localhost:3001/en/admin
3. Press Enter

**Expected Result:**
- ❌ Access denied or redirect to login
- ✅ Cannot bypass authorization via URL manipulation
- ✅ RLS (Row Level Security) prevents unauthorized access

---

**Test Case B: Direct Path Access**

**Steps:**
1. While logged in as operator, try to access nested admin pages:
   - http://localhost:3001/en/admin/users
   - http://localhost:3001/en/admin/settings

**Expected Result:**
- ❌ All nested admin pages blocked
- ✅ Cannot access admin sections via direct URL

---

#### 5.2 Session Management

**Test Case A: Session Timeout**

**Steps:**
1. Log in as `operator-ams@example.com`
2. Verify access to operator dashboard
3. Clear browser cookies/session storage for localhost
4. Try to access http://localhost:3001/en/operator

**Expected Result:**
- ✅ Redirected to login page after session cleared
- ✅ No access without valid session
- ✅ Must re-authenticate to access protected pages

---

**Test Case B: Logout**

**Steps:**
1. Log in as `admin-ams@example.com`
2. Verify access to admin dashboard
3. Click logout/sign out
4. Try to access http://localhost:3001/en/admin

**Expected Result:**
- ✅ Logout successful
- ✅ Redirected to login or home page
- ✅ Cannot access admin page after logout
- ✅ Session properly terminated

---

#### 5.3 Multiple Tabs

**Test Case: Tab Isolation**

**Steps:**
1. Open http://localhost:3001/en
2. Log in as `superuser@example.com` in Tab 1
3. Open http://localhost:3001/en in Tab 2 (new tab, same browser)
4. In Tab 1, log out
5. In Tab 2, try to access http://localhost:3001/en/superuser

**Expected Result:**
- ✅ Tab 2 session also invalidated
- ✅ Cannot access superuser page in Tab 2
- ✅ Session is browser-wide, not tab-specific

---

### 6. UI/UX Verification ✓

#### 6.1 Login Page Localization

**Test English UI:**
1. Navigate to http://localhost:3001/en/login (or http://localhost:3001/en and click login)
2. Observe all text

**Expected Result:**
- ✅ All text in English
- ✅ "Log In", "Email", "Send magic link" buttons
- ✅ Proper English labels and help text

---

**Test French UI:**
1. Navigate to http://localhost:3001/fr/login
2. Observe all text

**Expected Result:**
- ✅ All text in French
- ✅ "Se connecter", "E-mail", "Envoyer le lien magique" buttons
- ✅ French validation messages
- ✅ French help text and labels

---

#### 6.2 Error Messages

**Test Case: Invalid Login Attempt**

**Steps:**
1. Navigate to http://localhost:3001/en
2. Click "Log In"
3. Enter an email that doesn't exist: `nonexistent@example.com`
4. Click "Send magic link"

**Expected Result:**
- ✅ Either shows success message (for security) or clear error
- ✅ No information leakage about which emails exist
- ✅ User experience is clear and helpful

---

**Test Case: Wrong Role Access Attempt**

**Steps:**
1. Log in as `operator-ams@example.com`
2. Manually navigate to http://localhost:3001/en/admin
3. Observe error handling

**Expected Result:**
- ✅ Clear error message
- ✅ User-friendly language (not technical error codes)
- ✅ Suggests next steps (contact admin, logout, etc.)
- ✅ French locale should show French error message

---

### 7. Database Verification ✓

#### 7.1 Verify Test Users

```bash
# Check all test users exist with correct roles
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
SELECT
  up.id,
  up.email,
  up.role,
  up.is_active,
  up.created_at
FROM user_profiles up
WHERE up.email IN ('operator-ams@example.com', 'admin-ams@example.com', 'superuser@example.com')
ORDER BY up.role, up.email;
"
```

**Expected Result:**
- ✅ 3 rows returned
- ✅ `superuser@example.com` has role = 'superuser'
- ✅ `admin-ams@example.com` has role = 'admin'
- ✅ `operator-ams@example.com` has role = 'operator'
- ✅ All users have is_active = true

---

#### 7.2 Verify City Access

```bash
# Check which cities each user can access
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
SELECT
  up.email,
  up.role,
  c.slug as city_slug,
  cu.role as access_role
FROM user_profiles up
LEFT JOIN city_users cu ON up.id = cu.user_id
LEFT JOIN cities c ON cu.city_id = c.id
WHERE up.email IN ('operator-ams@example.com', 'admin-ams@example.com', 'superuser@example.com')
ORDER BY up.email, c.slug;
"
```

**Expected Result:**
- ✅ `superuser@example.com` appears once (no city_users entry needed)
- ✅ `admin-ams@example.com` has access to 'amsterdam' with role 'admin'
- ✅ `operator-ams@example.com` has access to 'amsterdam' with role 'operator'

---

#### 7.3 Verify RLS Policies

```bash
# Check that RLS is enabled on critical tables
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('user_profiles', 'city_users', 'cities', 'languages', 'language_translations')
  AND schemaname = 'public'
ORDER BY tablename;
"
```

**Expected Result:**
- ✅ All tables have rowsecurity = true
- ✅ RLS policies are active

---

## Quick Test Checklist

Use this checklist for rapid authentication verification:

### Unauthenticated Access
- [ ] 1. `/operator` redirects to login (no locale)
- [ ] 2. `/admin` redirects to login (no locale)
- [ ] 3. `/superuser` redirects to login (no locale)
- [ ] 4. `/en/operator` redirects to login
- [ ] 5. `/en/admin` redirects to login
- [ ] 6. `/en/superuser` redirects to login
- [ ] 7. `/fr/operator` redirects to login
- [ ] 8. `/fr/admin` redirects to login
- [ ] 9. `/fr/superuser` redirects to login

### Authentication Flow
- [ ] 10. Magic link emails sent to Inbucket
- [ ] 11. Clicking magic link logs user in
- [ ] 12. User redirected to appropriate dashboard after login
- [ ] 13. Login page in English works correctly
- [ ] 14. Login page in French works correctly
- [ ] 15. Post-login redirect returns to requested page

### Authorization Matrix
- [ ] 16. Operator can access `/operator` dashboard
- [ ] 17. Operator CANNOT access `/admin` (redirected)
- [ ] 18. Operator CANNOT access `/superuser` (redirected)
- [ ] 19. Admin can access `/operator` dashboard
- [ ] 20. Admin can access `/admin` dashboard
- [ ] 21. Admin CANNOT access `/superuser` (redirected)
- [ ] 22. Superuser can access `/operator` dashboard
- [ ] 23. Superuser can access `/admin` dashboard
- [ ] 24. Superuser can access `/superuser` dashboard

### Cross-Locale
- [ ] 25. Operator access works in `/en`, `/nl`, `/fr`
- [ ] 26. Admin access works in `/en`, `/nl`, `/fr`
- [ ] 27. Superuser access works in `/en`, `/nl`, `/fr`
- [ ] 28. Access denial consistent across all locales

### Session & Security
- [ ] 29. Session clears on logout
- [ ] 30. Cannot access protected pages after logout
- [ ] 31. URL manipulation doesn't bypass authorization
- [ ] 32. Multiple tabs share session (logout affects all)
- [ ] 33. Error messages are user-friendly
- [ ] 34. RLS policies enabled on all tables

---

## Test User Reference

### Quick Access Credentials

| Role | Email | Dashboard URL | Access Level |
|------|-------|---------------|--------------|
| **Operator** | `operator-ams@example.com` | `/en/operator` | Amsterdam only |
| **Admin** | `admin-ams@example.com` | `/en/admin` | Amsterdam + management |
| **Superuser** | `superuser@example.com` | `/en/superuser` | All cities |

### Inbucket Access

- **URL:** http://localhost:54334
- **Purpose:** Receive magic link emails for login
- **Usage:** Check inbox for each test user email

### Database Connection

```bash
# Connect to Supabase database (correct instance)
docker exec -it supabase_db_language-map psql -U postgres -d postgres

# Quick user check query
\SELECT email, role FROM user_profiles WHERE email LIKE '%example.com';
```

---

## Expected Authorization Behavior Summary

```
Unauthenticated User:
  /en/operator      → Redirect to login
  /en/admin         → Redirect to login
  /en/superuser     → Redirect to login

Operator (operator-ams@example.com):
  /en/operator      → ✅ ALLOWED
  /en/admin         → ❌ Redirect to login
  /en/superuser     → ❌ Redirect to login

Admin (admin-ams@example.com):
  /en/operator      → ✅ ALLOWED
  /en/admin         → ✅ ALLOWED
  /en/superuser     → ❌ Redirect to login

Superuser (superuser@example.com):
  /en/operator      → ✅ ALLOWED
  /en/admin         → ✅ ALLOWED
  /en/superuser     → ✅ ALLOWED
```

**Note:** Same behavior expected for all locales (`/en`, `/nl`, `/fr`)

---

## Known Issues / Expected Behaviors

Document any known issues here during testing:

1. **None currently** - Feature under development

---

## Testing Notes

Use this space to record observations during testing:

- **Date tested:** _______________
- **Tester:** _______________
- **Browser:** _______________
- **Locale tested:** _______________
- **Issues found:**
  -
  -
  -
- **Unexpected behaviors:**
  -
  -
- **Suggestions:**
  -
  -

---

## Cleanup After Testing

After completing authentication testing:

```bash
# No cleanup needed for authentication tests
# Test users remain in database for future testing

# Optional: Check current sessions
# (This is just informational)
docker exec supabase_db_language-map psql -U postgres -d postgres -c "
SELECT count(*) as total_users
FROM user_profiles
WHERE email LIKE '%example.com';
"
```

---

**Last Updated:** November 4, 2025
**Status:** Ready for testing
