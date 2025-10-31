---
title: "Testing Guide - Frontend Testing Strategy"
description: Comprehensive guide for writing and organizing tests in the Multi-City Language Mapping Platform Next.js application
category: guides
tags: [testing, vitest, playwright, unit-tests, e2e, developer-guide]
---

# Testing Guide - Frontend Testing Strategy

## Overview

This guide provides comprehensive documentation for testing the Multi-City Language Mapping Platform frontend application. We use a multi-layered testing approach with **Vitest** for unit and component tests and **Playwright** for end-to-end tests.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Stack](#testing-stack)
3. [Folder Structure](#folder-structure)
4. [Unit & Component Tests (Vitest)](#unit--component-tests-vitest)
5. [Integration Tests (Vitest)](#integration-tests-vitest)
6. [E2E Tests (Playwright)](#e2e-tests-playwright)
7. [Running Tests](#running-tests)
8. [Writing Tests](#writing-tests)
9. [Best Practices](#best-practices)
10. [CI/CD Integration](#cicd-integration)
11. [Troubleshooting](#troubleshooting)

---

## Testing Philosophy

### Testing Pyramid

We follow the testing pyramid approach:

```
        /\
       /  \  E2E Tests (Playwright)
      /----\  - Fewer, slower, expensive
     /      \  - Critical user journeys
    /--------\  - Cross-browser testing
   /          \
  /  Unit &    \ Integration Tests (Vitest)
 /  Component   \ - Many, fast, cheap
/________________\ - Business logic, components
```

### Key Principles

1. **Co-located Tests**: Unit and component tests live next to the code they test
2. **Integration Tests in __tests__/**: Tests that involve multiple components/pages working together live in `src/__tests__/integration/`
3. **Separate E2E Tests**: End-to-end tests live in a dedicated `/e2e` directory
4. **Fast Feedback**: Unit tests run in milliseconds, providing instant feedback
5. **Comprehensive Coverage**: Aim for ≥80% code coverage on unit tests
6. **User-Centric E2E**: E2E tests focus on critical user journeys, not edge cases

---

## Testing Stack

### Vitest (Unit & Component Tests)

**Why Vitest?**
- ⚡ Blazing fast with native ES modules support
- 🔥 Hot Module Replacement (HMR) for watch mode
- 🎯 Jest-compatible API (easy migration)
- 📦 Built-in TypeScript and JSX support
- 🎨 Excellent Vite integration

**Key Libraries:**
- `vitest` - Test runner and framework
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom matchers for DOM assertions
- `@testing-library/user-event` - User interaction simulation
- `jsdom` - DOM implementation for Node.js

### Playwright (E2E Tests)

**Why Playwright?**
- 🌍 Cross-browser testing (Chromium, Firefox, WebKit)
- 📱 Mobile viewport emulation
- 🎬 Built-in video recording and screenshots
- 🔍 Powerful debugging tools
- ⚡ Fast and reliable test execution

---

## Folder Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── page.tsx
│   │   │   └── page.test.tsx           # ✅ Co-located unit test
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Header.test.tsx         # ✅ Co-located component test
│   │   ├── auth/
│   │   │   ├── SignInModal.tsx
│   │   │   └── SignInModal.test.tsx    # ✅ Co-located component test
│   │   └── cookie/
│   │       ├── CookieBanner.tsx
│   │       └── CookieBanner.test.tsx   # ✅ Co-located component test
│   ├── __tests__/
│   │   └── integration/                # ✅ Integration tests (multi-component flows)
│   │       ├── language-switching.test.tsx
│   │       ├── cookie-consent.test.tsx
│   │       └── sign-in-flow.test.tsx
│   ├── lib/
│   │   ├── utils/
│   │   │   ├── cookie.ts
│   │   │   └── cookie.test.ts          # ✅ Co-located utility test
│   │   └── hooks/
│   │       ├── useAuth.ts
│   │       └── useAuth.test.ts         # ✅ Co-located hook test
│   └── test/
│       └── setup.ts                    # Vitest setup file
├── e2e/
│   ├── landing.spec.ts                 # ✅ E2E test for landing page
│   ├── auth.spec.ts                    # ✅ E2E test for authentication
│   └── language-switching.spec.ts      # ✅ E2E test for i18n
├── vitest.config.ts                    # Vitest configuration
├── playwright.config.ts                # Playwright configuration
└── package.json                        # Test scripts
```

### Naming Conventions

**Unit & Component Tests (Vitest):**
- `*.test.ts` or `*.test.tsx` for TypeScript files
- `*.spec.ts` or `*.spec.tsx` (alternative, but prefer `.test`)

**E2E Tests (Playwright):**
- `*.spec.ts` files in the `/e2e` directory only

**Why different conventions?**
- Keeps test types visually distinct
- Vitest automatically excludes `/e2e` directory
- Playwright only runs tests in `/e2e` directory

---

## Unit & Component Tests (Vitest)

### Configuration

**File**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'out', 'e2e/**', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.test.{ts,tsx}',
        '.next/**',
        'out/**',
        'e2e/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Setup File

**File**: `src/test/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3001';
```

### Example Component Test

**File**: `src/components/layout/Header.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

describe('Header Component', () => {
  describe('Rendering', () => {
    it('should render without errors', () => {
      const { container } = render(<Header locale="en" />);
      expect(container).toBeInTheDocument();
    });

    it('should render brand logo', () => {
      render(<Header locale="en" citySlug="amsterdam" />);
      const logo = screen.getByRole('img', { name: /logo/i });
      expect(logo).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should have correct navigation links', () => {
      render(<Header locale="en" />);

      const featuresLink = screen.getByText('Features');
      expect(featuresLink).toHaveAttribute('href', '/en#features');
    });
  });

  describe('Mobile Menu', () => {
    it('should toggle mobile menu', () => {
      render(<Header locale="en" />);

      const menuButton = screen.getByLabelText('Open main menu');
      fireEvent.click(menuButton);

      const mobileMenu = document.querySelector('.mobile-menu');
      expect(mobileMenu).toBeVisible();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<Header locale="en" />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    });
  });
});
```

### Example Utility Test

**File**: `src/lib/utils/cookie.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { setCookie, getCookie, deleteCookie } from './cookie';

describe('Cookie Utilities', () => {
  beforeEach(() => {
    // Clear all cookies before each test
    document.cookie.split(';').forEach((cookie) => {
      document.cookie = cookie
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
  });

  describe('setCookie', () => {
    it('should set a cookie', () => {
      setCookie('testCookie', 'testValue');
      expect(document.cookie).toContain('testCookie=testValue');
    });

    it('should set cookie with options', () => {
      setCookie('testCookie', 'testValue', { maxAge: 3600 });
      expect(document.cookie).toContain('testCookie=testValue');
    });
  });

  describe('getCookie', () => {
    it('should get an existing cookie', () => {
      setCookie('testCookie', 'testValue');
      const value = getCookie('testCookie');
      expect(value).toBe('testValue');
    });

    it('should return null for non-existent cookie', () => {
      const value = getCookie('nonExistent');
      expect(value).toBeNull();
    });
  });

  describe('deleteCookie', () => {
    it('should delete a cookie', () => {
      setCookie('testCookie', 'testValue');
      deleteCookie('testCookie');
      const value = getCookie('testCookie');
      expect(value).toBeNull();
    });
  });
});
```

---

## Integration Tests (Vitest)

### Overview

Integration tests verify that multiple components/modules work correctly together. Unlike unit tests that isolate individual components, integration tests ensure that the interactions between components produce the expected behavior.

**Location**: `src/__tests__/integration/`

**When to write integration tests:**
- Testing complete user flows involving multiple components (e.g., sign-in flow, language switching)
- Verifying state management across component boundaries
- Testing components that depend on context providers
- Validating cookie/localStorage persistence with UI interactions
- Testing navigation flows between pages

**Characteristics:**
- Test multiple components as a system
- Use real component implementations (minimal mocking)
- Verify side effects (navigation, cookie setting, localStorage)
- Slower than unit tests but faster than E2E tests
- Run in jsdom (same as unit tests)

### Example Integration Test

**File**: `src/__tests__/integration/language-switching.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageSelector } from '@/components/navigation/LanguageSelector';

// Mock external dependencies
const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockPathname = '/en/about';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => mockPathname,
}));

vi.mock('@/lib/utils/cookie', () => ({
  setCookie: vi.fn(),
}));

import { setCookie } from '@/lib/utils/cookie';
const mockSetCookie = vi.mocked(setCookie);

describe('Language Switching Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should switch from English to Spanish with correct side effects', async () => {
    // ARRANGE: Render LanguageSelector on English About page
    render(<LanguageSelector currentLocale="en" />);

    // ACT: Open language selector and select Spanish
    const languageButton = screen.getByRole('button', { name: /current language: english/i });
    fireEvent.click(languageButton);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    const spanishOption = screen.getByRole('menuitem', { name: /switch to español/i });
    fireEvent.click(spanishOption);

    // ASSERT: Verify all side effects
    // 1. Cookie should be set with Spanish locale
    await waitFor(() => {
      expect(mockSetCookie).toHaveBeenCalledWith('NEXT_LOCALE', 'es', {
        maxAge: 365,
        path: '/',
        sameSite: 'Lax',
      });
    });

    // 2. Navigation should update URL to Spanish version
    expect(mockPush).toHaveBeenCalledWith('/es/about');

    // 3. Page should be refreshed to load Spanish content
    expect(mockRefresh).toHaveBeenCalled();

    // 4. Dropdown should close after selection
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
```

### Integration Test Patterns

**1. Multi-Component Flows**

Test complete workflows involving multiple components:

```typescript
// Test cookie consent banner + modal interaction
function CookieConsentFlow() {
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  return (
    <>
      <CookieBanner onOpenPreferences={() => setIsPreferencesOpen(true)} />
      <CookiePreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
      />
    </>
  );
}

it('should complete full flow: banner → settings → configure → save', async () => {
  render(<CookieConsentFlow />);

  // User clicks "Cookie Settings" in banner
  fireEvent.click(screen.getByText('Cookie Settings'));

  // Modal opens with preferences
  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // User toggles preferences and saves
  fireEvent.click(screen.getByRole('switch', { name: /analytics/i }));
  fireEvent.click(screen.getByText('Save Preferences'));

  // Verify localStorage persistence
  const savedPreferences = localStorage.getItem('cookie-preferences');
  expect(JSON.parse(savedPreferences)).toEqual({
    essential: true,
    analytics: true,
    marketing: false,
    functional: false,
  });
});
```

**2. Navigation Flows**

Test routing and URL changes:

```typescript
it('should navigate between pages with locale persistence', async () => {
  // Arrange: User on English page
  const { rerender } = render(<Header locale="en" />);

  // Act: User clicks navigation link
  const aboutLink = screen.getByRole('link', { name: /about/i });
  fireEvent.click(aboutLink);

  // Assert: Navigation preserves locale
  expect(mockPush).toHaveBeenCalledWith('/en/about');
});
```

**3. State Management**

Test context providers and global state:

```typescript
it('should share auth state across components', async () => {
  render(
    <AuthProvider>
      <Header />
      <UserProfile />
    </AuthProvider>
  );

  // Simulate login
  const loginButton = screen.getByRole('button', { name: /log in/i });
  fireEvent.click(loginButton);

  // Verify both components update
  await waitFor(() => {
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });
});
```

### Integration vs Unit vs E2E

| Aspect | Unit Test | Integration Test | E2E Test |
|--------|-----------|------------------|----------|
| **Scope** | Single component/function | Multiple components | Full application |
| **Environment** | jsdom (fast) | jsdom (fast) | Real browser (slow) |
| **Mocking** | Heavy mocking | Minimal mocking | No mocking |
| **Speed** | Milliseconds | Milliseconds to seconds | Seconds to minutes |
| **Location** | Co-located with code | `src/__tests__/integration/` | `/e2e` directory |
| **Example** | `Button.test.tsx` | `language-switching.test.tsx` | `landing.spec.ts` |
| **Purpose** | Verify isolated logic | Verify component interactions | Verify user journeys |

### When to Write Which Test

**Write Unit Tests for:**
- Individual component rendering
- Isolated business logic
- Utility functions
- Custom hooks
- Form validation logic

**Write Integration Tests for:**
- Multi-component user flows
- Cookie/localStorage + UI interactions
- Context provider + consumer interactions
- Navigation between pages
- Form submission + side effects

**Write E2E Tests for:**
- Critical user journeys (sign up, checkout)
- Cross-browser compatibility
- Mobile responsiveness
- Real API interactions
- Performance testing

---

## E2E Tests (Playwright)

### Configuration

**File**: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### Example E2E Test

**File**: `e2e/landing.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en');
  });

  test('should load and display main heading', async ({ page }) => {
    await expect(page).toHaveTitle(/Language Map/i);
    await expect(page.getByRole('banner')).toBeVisible();

    const heroHeading = page.getByRole('heading', { level: 1 });
    await expect(heroHeading).toBeVisible();
  });

  test('should navigate to sections', async ({ page }) => {
    await page.getByRole('link', { name: 'Features' }).first().click();
    await page.waitForTimeout(500);

    const featuresSection = page.locator('#features');
    await expect(featuresSection).toBeInViewport();
  });

  test('should open sign-in modal', async ({ page }) => {
    await page.getByRole('button', { name: /log in/i }).first().click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
  });
});

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should open mobile menu', async ({ page }) => {
    await page.goto('/en');

    const menuButton = page.getByRole('button', { name: /menu/i });
    await menuButton.click();

    const mobileMenu = page.locator('.fixed.inset-y-0');
    await expect(mobileMenu).toBeVisible();
  });
});
```

---

## Running Tests

### Vitest (Unit & Component Tests)

```bash
# Run all unit tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI (visual interface)
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- Header.test.tsx

# Run tests matching pattern
npm test -- --grep="Header"
```

### Playwright (E2E Tests)

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# View HTML report
npm run test:e2e:report

# Generate test code (codegen)
npm run test:e2e:codegen

# Run specific test file
npm run test:e2e -- landing.spec.ts

# Run specific browser
npm run test:e2e -- --project=chromium
```

### Run All Tests

```bash
# Run unit tests + E2E tests
npm run test:all
```

---

## Writing Tests

### Test Structure (Arrange-Act-Assert)

```typescript
describe('Feature Name', () => {
  it('should do something', () => {
    // Arrange: Set up test data and conditions
    const input = 'test';
    const expected = 'TEST';

    // Act: Execute the function/action
    const result = toUpperCase(input);

    // Assert: Verify the result
    expect(result).toBe(expected);
  });
});
```

### Mocking in Vitest

**Mock Next.js modules:**

```typescript
// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/',
  }),
  usePathname: () => '/',
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
```

**Mock Supabase:**

```typescript
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: vi.fn(),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    },
  }),
}));
```

### Testing Async Code

```typescript
it('should fetch data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});

it('should handle errors', async () => {
  await expect(fetchData()).rejects.toThrow('Error message');
});
```

### Testing User Interactions

```typescript
import userEvent from '@testing-library/user-event';

it('should handle click', async () => {
  const user = userEvent.setup();
  render(<Button onClick={handleClick}>Click me</Button>);

  await user.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalled();
});

it('should handle form submission', async () => {
  const user = userEvent.setup();
  render(<Form onSubmit={handleSubmit} />);

  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(handleSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
});
```

---

## Best Practices

### Unit & Component Tests

1. **Test Behavior, Not Implementation**
   - Test what the component does, not how it does it
   - Avoid testing internal state or private methods

2. **Use Semantic Queries**
   - Prefer `getByRole` over `getByTestId`
   - Use `getByLabelText` for form fields
   - Only use `data-testid` as last resort

3. **Keep Tests Isolated**
   - Each test should be independent
   - Use `beforeEach` to reset state
   - Don't rely on test execution order

4. **Test Edge Cases**
   - Empty states
   - Error conditions
   - Loading states
   - Invalid inputs

5. **Mock External Dependencies**
   - API calls
   - Third-party libraries
   - Next.js modules

### E2E Tests

1. **Test Critical User Journeys**
   - User registration and login
   - Core business workflows
   - Payment flows
   - Data submission

2. **Use Page Object Model (Optional)**
   - Encapsulate page interactions
   - Reuse common actions
   - Improve maintainability

3. **Wait for Elements**
   - Use `waitFor` instead of fixed timeouts
   - Use `expect().toBeVisible()` for assertions

4. **Handle Flaky Tests**
   - Use `test.retry()` for flaky tests
   - Add proper waits
   - Use Playwright's auto-waiting features

5. **Run in Multiple Browsers**
   - Test in Chrome, Firefox, Safari
   - Test on mobile viewports
   - Use different screen sizes

### General Best Practices

1. **Write Descriptive Test Names**
   ```typescript
   // ❌ Bad
   it('works', () => { ... });

   // ✅ Good
   it('should display error message when email is invalid', () => { ... });
   ```

2. **One Assertion Per Test (When Possible)**
   ```typescript
   // ❌ Bad
   it('should handle form', () => {
     expect(isValid()).toBe(true);
     expect(errorMessage).toBeNull();
     expect(submitCount).toBe(1);
   });

   // ✅ Good
   it('should validate form', () => {
     expect(isValid()).toBe(true);
   });

   it('should not show error when valid', () => {
     expect(errorMessage).toBeNull();
   });
   ```

3. **Keep Tests Fast**
   - Mock slow operations
   - Use `vi.useFakeTimers()` for time-based tests
   - Avoid unnecessary `waitFor` calls

4. **Maintain Test Coverage**
   - Aim for ≥80% coverage
   - Focus on critical code paths
   - Don't test third-party code

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci
      - run: npm run build

      # Unit tests
      - name: Run unit tests
        run: npm run test:coverage

      # E2E tests
      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      # Upload reports
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: coverage/
```

---

## Troubleshooting

### Common Issues

#### Vitest: "Cannot find module '@/...'"

**Solution**: Check `vitest.config.ts` path aliases match `tsconfig.json`:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

#### Vitest: "document is not defined"

**Solution**: Ensure `jsdom` environment is configured:

```typescript
test: {
  environment: 'jsdom',
}
```

#### Playwright: "Timeout waiting for selector"

**Solution**:
- Use `await expect().toBeVisible()` instead of `toExist()`
- Increase timeout: `test.setTimeout(60000)`
- Check if element is actually rendered

#### Playwright: "Test failed on CI but passes locally"

**Solution**:
- Set `workers: 1` in CI
- Add explicit waits
- Use `test.retry(2)` for flaky tests

---

## Related Documentation

### Project Standards
- [Coding Standards - Testing Standards](../../10-processes/coding-standards.md#testing-standards) - Required testing standards and code coverage requirements
- [Development Workflow - Testing Phase](../../10-processes/development-workflow.md#phase-4-testing) - How testing fits into the development workflow

---

## Additional Resources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing)

### Tools
- [Playwright Codegen](https://playwright.dev/docs/codegen) - Generate E2E tests
- [Testing Library Playground](https://testing-playground.com/) - Query selectors
- [Vitest UI](https://vitest.dev/guide/ui.html) - Visual test runner

### Code Examples

For complete, working examples in the codebase:

**Unit/Component Test**:
- File: `/apps/web/src/components/layout/Header.test.tsx`
- Demonstrates: Component rendering, mocking, user interactions, accessibility testing

**Integration Tests**:
- File: `/apps/web/src/__tests__/integration/language-switching.test.tsx`
- Demonstrates: Multi-component flow, navigation testing, cookie setting, side effect verification
- File: `/apps/web/src/__tests__/integration/cookie-consent.test.tsx`
- Demonstrates: Banner + modal integration, localStorage persistence, state management
- File: `/apps/web/src/__tests__/integration/sign-in-flow.test.tsx`
- Demonstrates: Complete authentication flow, OAuth integration, modal interactions

**E2E Test**:
- File: `/apps/web/e2e/landing.spec.ts`
- Demonstrates: Page navigation, element assertions, mobile testing, critical user flows

---

## Questions or Issues?

If you encounter problems or have questions about testing:

1. Check this guide first
2. Review existing test files for examples
3. Check the troubleshooting section
4. Ask in the development team chat

---

**Document Version**: 1.0
**Last Updated**: 2025-10-07
**Next Review**: When testing stack changes
