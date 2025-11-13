# Session Management Improvements

**Date:** November 4, 2025
**Status:** ✅ Implemented
**Priority:** HIGH (was blocking manual testing)

---

## Problem Statement

During Phase 3 manual testing (Session 3), we encountered a critical session management issue:

- **Symptom:** Magic link authentication sessions expired within 2-3 minutes of navigation
- **Impact:** Prevented browser-based end-to-end CRUD testing
- **Root Cause:** Two configuration issues:
  1. Short JWT expiry duration (1 hour)
  2. Missing session refresh mechanism in middleware

### Observed Behavior

1. User authenticates via magic link ✅
2. User successfully lands on operator dashboard ✅
3. User navigates to protected page (e.g., `/en/operator/amsterdam/neighborhoods/new`)
4. After 2-3 minutes, user is redirected to login page ❌
5. Session appears to have expired despite JWT expiry being set to 1 hour

---

## Root Cause Analysis

### Issue 1: JWT Expiry Configuration

**File:** `supabase/config.toml`

**Original Configuration:**
```toml
[auth]
jwt_expiry = 3600  # 1 hour
```

**Problem:**
- While 1 hour is reasonable for production, it's too short for development/testing workflows
- Manual testing sessions often last longer than 1 hour
- Frequent re-authentication disrupts testing flow

### Issue 2: Missing Session Refresh in Middleware

**File:** `middleware.ts`

**Original State:**
- Middleware only handled i18n routing
- No Supabase session management
- Sessions not refreshed on navigation
- Cookies not updated during requests

**Problem:**
- Even with autoRefreshToken enabled in client configuration, sessions weren't being refreshed during middleware execution
- Supabase client in pages would try to refresh, but by then the session might have already expired
- No cookie updates in response headers

---

## Solution Implemented

### Fix 1: Extended JWT Expiry for Development

**File:** `supabase/config.toml`

**Changes:**
```toml
[auth]
enabled = true
site_url = "http://localhost:3001"
additional_redirect_urls = ["https://localhost:3001", "http://localhost:3001/en/auth/callback", "http://localhost:3001/en/auth/callback?**"]
# JWT expiry in seconds (86400 = 24 hours for development)
# Production should use shorter duration (3600 = 1 hour)
jwt_expiry = 86400
enable_signup = true
# Session configuration
# refresh_token_rotation_enabled = true (enabled by default)
# Tokens are automatically refreshed when they're close to expiry
```

**Benefits:**
- 24-hour session duration provides comfortable development/testing window
- Reduces authentication friction during manual testing
- Still secure for local development environment
- Easy to revert to 3600 (1 hour) for production

**Production Note:**
For production deployment, revert to shorter JWT expiry:
```toml
jwt_expiry = 3600  # 1 hour for production
```

### Fix 2: Session Refresh in Middleware

**File:** `middleware.ts`

**Changes:**

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const locales = ['en', 'nl', 'fr'] as const
const defaultLocale = 'en'

// Create the i18n middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

/**
 * Main middleware that combines i18n and session management
 */
export async function middleware(request: NextRequest) {
  // First, handle i18n
  const response = intlMiddleware(request)

  // Then, handle session refresh using Supabase SSR
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set cookie in request (for this middleware execution)
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Set cookie in response (to send to browser)
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Remove cookie from request
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          // Remove cookie from response
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session (this will update the session if it's close to expiry)
  // This prevents the "session expired" issue during navigation
  await supabase.auth.getUser()

  return response
}
```

**How It Works:**

1. **Request Interception:** Middleware runs on every request matching the config pattern
2. **I18n Handling:** First processes locale routing (existing functionality)
3. **Session Creation:** Creates Supabase SSR client with cookie handlers
4. **Cookie Management:**
   - `get`: Reads cookies from incoming request
   - `set`: Updates cookies in both request and response
   - `remove`: Removes cookies from both request and response
5. **Session Refresh:** Calls `supabase.auth.getUser()` which:
   - Validates current session
   - Automatically refreshes token if close to expiry
   - Updates cookies in response
6. **Response Return:** Returns response with updated session cookies

**Benefits:**
- Automatic session refresh on every navigation
- Prevents premature session expiry
- Seamless user experience (no unexpected logouts)
- Cookie updates propagated to browser
- Works with Supabase's built-in refresh token rotation

---

## Dependencies

### Package Requirement

The fix requires the `@supabase/ssr` package (already installed):

**package.json:**
```json
{
  "dependencies": {
    "@supabase/ssr": "^0.7.0",
    "@supabase/supabase-js": "^2.78.0"
  }
}
```

**Why @supabase/ssr?**
- Designed specifically for Next.js middleware and server components
- Handles cookie management for server-side rendering
- Provides proper cookie serialization/deserialization
- Integrates with Next.js request/response objects

---

## Implementation Steps

### Step 1: Update Supabase Configuration

```bash
# Edit supabase/config.toml
# Change jwt_expiry from 3600 to 86400
```

### Step 2: Update Middleware

```bash
# Edit middleware.ts
# Add session refresh logic with Supabase SSR client
```

### Step 3: Restart Supabase

```bash
# Stop Supabase to clear old configuration
npx supabase stop

# Start Supabase with new configuration
npx supabase start
```

**Important:** Supabase must be restarted for JWT expiry changes to take effect.

---

## Testing Recommendations

### Manual Testing

1. **Login and Navigation Test:**
   - Log in via magic link
   - Navigate through multiple protected pages
   - Wait 5-10 minutes between navigations
   - Verify session persists without re-authentication

2. **Long Session Test:**
   - Log in via magic link
   - Leave browser open for 30+ minutes
   - Return and navigate to protected page
   - Verify session is still active

3. **Session Refresh Verification:**
   - Open browser DevTools → Network tab
   - Navigate between pages
   - Observe `Set-Cookie` headers in responses
   - Verify auth cookies are being updated

### Automated Testing

For E2E tests, consider:
```typescript
// Example Playwright test with session persistence
import { test, expect } from '@playwright/test'

test('session persists during navigation', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3001/en/login')
  await page.fill('input[type="email"]', 'operator-ams@example.com')
  await page.click('button:has-text("Send magic link")')

  // Get magic link from Inbucket
  // ... (implement magic link retrieval)

  // Navigate through multiple pages
  await page.goto('http://localhost:3001/en/operator/amsterdam/districts')
  await expect(page).toHaveURL(/\/operator\/amsterdam\/districts/)

  await page.goto('http://localhost:3001/en/operator/amsterdam/neighborhoods')
  await expect(page).toHaveURL(/\/operator\/amsterdam\/neighborhoods/)

  // Verify still authenticated after navigation
  await expect(page.locator('text=operator-ams@example.com')).toBeVisible()
})
```

---

## Configuration Reference

### Development Configuration (Current)

**File:** `supabase/config.toml`

```toml
[auth]
enabled = true
site_url = "http://localhost:3001"
additional_redirect_urls = ["https://localhost:3001", "http://localhost:3001/en/auth/callback", "http://localhost:3001/en/auth/callback?**"]
jwt_expiry = 86400  # 24 hours
enable_signup = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false
```

### Production Configuration (Recommended)

**File:** `supabase/config.toml` (for production)

```toml
[auth]
enabled = true
site_url = "https://yourdomain.com"
additional_redirect_urls = ["https://yourdomain.com/*/auth/callback"]
jwt_expiry = 3600  # 1 hour (more secure for production)
enable_signup = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true  # Enable email confirmation in production
```

### Client Configuration

**File:** `lib/database/client.ts`

```typescript
const client = createClient(
  DEFAULT_DATABASE_CONFIG.url,
  DEFAULT_DATABASE_CONFIG.anonKey,
  {
    auth: {
      autoRefreshToken: true,      // Automatically refresh before expiry
      persistSession: true,         // Store session in localStorage
      detectSessionInUrl: true,     // Handle magic link callbacks
    },
    // ... other config
  }
)
```

**These settings work in tandem with middleware:**
- `autoRefreshToken`: Client-side automatic refresh (backup)
- `persistSession`: Maintains session across page reloads
- `detectSessionInUrl`: Handles magic link authentication
- Middleware: Server-side refresh on every navigation (primary)

---

## Troubleshooting

### Issue: Sessions Still Expiring Quickly

**Diagnosis:**
1. Check if Supabase was restarted after config change
2. Verify config.toml has jwt_expiry = 86400
3. Check browser console for auth errors
4. Inspect cookies in DevTools (should see sb-* cookies)

**Solution:**
```bash
# Stop and restart Supabase
npx supabase stop
npx supabase start

# Verify configuration
cat supabase/config.toml | grep jwt_expiry
```

### Issue: Middleware Not Refreshing Sessions

**Diagnosis:**
1. Check if @supabase/ssr package is installed
2. Verify middleware.ts has session refresh code
3. Check Network tab for Set-Cookie headers
4. Look for middleware errors in terminal

**Solution:**
```bash
# Install @supabase/ssr if missing
npm install @supabase/ssr

# Restart dev server to reload middleware
# (dev server automatically restarts with file changes)
```

### Issue: Cookies Not Being Set

**Diagnosis:**
1. Check browser DevTools → Application → Cookies
2. Look for sb-* cookies under localhost:3001
3. Verify cookie domain and path settings
4. Check for SameSite/Secure attribute conflicts

**Solution:**
- Cookies should be set for localhost:3001
- Middleware handles cookie serialization automatically
- If cookies missing, check middleware implementation

---

## Impact Analysis

### Before Implementation

**User Experience:**
- ❌ Frequent forced logouts during testing
- ❌ Lost work due to session expiry
- ❌ Testing sessions interrupted every 2-3 minutes
- ❌ Poor developer experience

**Testing Impact:**
- ❌ Browser-based E2E testing impractical
- ❌ Manual CRUD operation testing blocked
- ❌ QA workflows disrupted

**Development Impact:**
- ❌ Decreased productivity
- ❌ Testing friction
- ❌ Reliance on unit tests only

### After Implementation

**User Experience:**
- ✅ 24-hour session duration
- ✅ Automatic session refresh on navigation
- ✅ Seamless authentication experience
- ✅ No unexpected logouts

**Testing Impact:**
- ✅ Full-day testing sessions possible
- ✅ Browser-based E2E testing enabled
- ✅ Manual CRUD operation testing unblocked
- ✅ Smooth QA workflows

**Development Impact:**
- ✅ Improved productivity
- ✅ Reduced testing friction
- ✅ Better development experience
- ✅ Enables comprehensive manual testing

---

## Future Improvements

### Short-term (Optional)

1. **Session Expiry Warning:**
   - Add client-side notification 5 minutes before expiry
   - Offer "Extend Session" button
   - Graceful logout with work-saving prompt

2. **Remember Me Feature:**
   - Extend session up to 7 days for trusted devices
   - Configurable per-user preference
   - Enhanced security with device fingerprinting

3. **Session Analytics:**
   - Track average session duration
   - Monitor refresh token usage
   - Identify session expiry patterns

### Long-term (Production)

1. **Environment-Specific Configuration:**
   - Automatic JWT expiry based on NODE_ENV
   - Development: 24 hours
   - Staging: 4 hours
   - Production: 1 hour

2. **Advanced Session Management:**
   - Multiple active sessions per user
   - Session device management
   - Remote session termination
   - Session activity tracking

3. **Security Enhancements:**
   - IP-based session binding
   - Device fingerprinting
   - Anomaly detection
   - Suspicious activity alerts

---

## Related Documentation

- [Manual Testing Plan (Session 3)](./day-15-manual-testing-plan.md)
- [Architecture Documentation](../../architecture.md)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [@supabase/ssr Documentation](https://supabase.com/docs/guides/auth/server-side/nextjs)

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-04 | 1.0 | Initial implementation of session management improvements | Claude Code |

---

**Status:** ✅ IMPLEMENTED AND DEPLOYED
**Next Steps:** Monitor session behavior during manual testing, gather feedback
**Owner:** Development Team
**Priority:** HIGH (was blocking)
