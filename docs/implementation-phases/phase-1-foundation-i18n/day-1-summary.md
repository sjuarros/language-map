# Day 1: Set up Next.js 15+ + TypeScript + next-intl

**Date:** October 30, 2025
**Status:** ✅ Complete

## Objectives

- Initialize project with App Router
- Configure TypeScript
- Install and configure next-intl
- Set up basic folder structure

## What Was Built

### 1. Next.js 16 Project Initialization

Successfully set up Next.js 16.0.1 (latest version) with:
- **App Router** - Modern Next.js routing
- **TypeScript 5** - Type safety
- **Tailwind CSS 3.4** - Utility-first styling
- **ESLint** - Code linting
- **Turbopack** - Fast compilation

### 2. i18n Infrastructure with next-intl

#### Configuration Files
- `lib/i18n/config.ts` - Locale configuration (en, nl, fr)
- `lib/i18n/request.ts` - Server-side i18n utilities
- `lib/i18n/navigation.ts` - Internationalized navigation helpers
- `middleware.ts` - Locale routing middleware

#### Translation Files
- `messages/en.json` - English translations
- `messages/nl.json` - Dutch translations
- `messages/fr.json` - French translations

Initial translation keys:
- `common.*` - Common UI strings (loading, error, save, cancel, etc.)
- `home.*` - Home page content
- `navigation.*` - Navigation labels

### 3. Folder Structure

```
language-map/
├── app/
│   ├── layout.tsx              # Root layout
│   └── [locale]/               # i18n routing
│       ├── layout.tsx          # Locale-specific layout
│       ├── page.tsx            # Home page with translations
│       └── globals.css         # Global styles
├── lib/
│   └── i18n/                   # i18n configuration
│       ├── config.ts
│       ├── request.ts
│       └── navigation.ts
├── messages/                   # Translation files
│   ├── en.json
│   ├── nl.json
│   └── fr.json
├── middleware.ts               # i18n routing middleware
├── next.config.ts              # Next.js config with next-intl plugin
├── tailwind.config.ts          # Tailwind config
├── tsconfig.json               # TypeScript config
└── package.json                # Dependencies
```

### 4. Features Implemented

✅ **Locale Routing**
- URLs: `/en`, `/nl`, `/fr`
- Middleware handles locale detection
- Always shows locale prefix in URL

✅ **Server Components**
- Home page uses Server Components
- Translations loaded server-side
- Optimal performance and SEO

✅ **Locale Switcher**
- Switch between English, Dutch, French
- Uses i18n-aware Link component
- Maintains current page when switching

✅ **Static Generation**
- All locales pre-rendered at build time
- Fast page loads

## Technical Decisions

### 1. Used Next.js 16 (Latest) Instead of 14

**Rationale:**
- Documentation originally specified Next.js 14 (current at time of writing)
- No strict version requirement found
- All required features (App Router, Server Components, Server Actions) available in 16
- Better future-proofing and active support
- **Decision documented in:** `docs/implementation-phases/phase-1-foundation-i18n/version-decision.md`

### 2. Path-based Locale Routing with Always Prefix

**Configuration:**
```typescript
localePrefix: 'always'
```

**Rationale:**
- Clear URL structure: `/en/amsterdam`, `/nl/amsterdam`
- No ambiguity about which locale is active
- Better for SEO (separate URLs per language)
- Easier to share links in specific languages

### 3. Three Initial Locales

- **en** (English) - Default, international audience
- **nl** (Dutch) - Primary for Amsterdam
- **fr** (French) - Secondary European language

**Expandable:** Easy to add more locales by:
1. Adding to `lib/i18n/config.ts`
2. Creating `messages/{locale}.json`
3. Updating middleware matcher

## Build Status

✅ Build successful:
```bash
npm run build
# ✓ Compiled successfully
# ✓ Generating static pages (5/5)
# Route: /[locale] (dynamic)
```

## Files Created

### Core Configuration (6 files)
1. `package.json` - Dependencies
2. `tsconfig.json` - TypeScript config
3. `next.config.ts` - Next.js config with next-intl
4. `tailwind.config.ts` - Tailwind config
5. `.eslintrc.json` - ESLint config
6. `.gitignore` - Git ignore patterns

### i18n Files (6 files)
7. `lib/i18n/config.ts`
8. `lib/i18n/request.ts`
9. `lib/i18n/navigation.ts`
10. `messages/en.json`
11. `messages/nl.json`
12. `messages/fr.json`

### Application Files (4 files)
13. `middleware.ts`
14. `app/layout.tsx`
15. `app/[locale]/layout.tsx`
16. `app/[locale]/page.tsx`
17. `app/[locale]/globals.css`

### Support Files (2 files)
18. `postcss.config.mjs`

**Total:** 18 files created + dependencies installed (432 packages)

## Dependencies Installed

### Core
- `next@^16.0.1` - Next.js framework
- `react@^19.0.0` - React library
- `react-dom@^19.0.0` - React DOM

### i18n
- `next-intl@^4.4.0` - Internationalization

### Styling
- `tailwindcss@^3.4.1` - CSS framework
- `postcss@^8.4.49` - CSS processing
- `autoprefixer@^10.4.20` - CSS vendor prefixes

### Development
- `typescript@^5` - TypeScript compiler
- `@types/node@^22` - Node.js types
- `@types/react@^19` - React types
- `@types/react-dom@^19` - React DOM types
- `eslint@^9` - Linting
- `eslint-config-next@^16.0.1` - Next.js ESLint config

## Issues Encountered & Resolved

### Issue 1: TypeScript Error in i18n Request Config

**Error:**
```
Property 'locale' is missing in type '{ messages: any; }'
```

**Solution:**
Changed from `locale` parameter to `requestLocale` and included `locale` in return object:
```typescript
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  return {
    locale,  // Must return locale
    messages: (await import(`@/messages/${locale}.json`)).default,
  }
})
```

### Issue 2: Reusable Code TypeScript Errors

**Error:**
```
Cannot find module 'mapbox-gl'
```

**Solution:**
Excluded `reusable-code/` folder from TypeScript compilation in `tsconfig.json`:
```json
"exclude": ["node_modules", "reusable-code"]
```

**Rationale:** Reusable code is reference-only, will be adapted in Phase 4.

## Testing

### Manual Testing Performed

✅ **Build test:**
```bash
npm run build
# Success: Build completes without errors
```

✅ **TypeScript validation:**
```bash
npm run type-check
# Success: No type errors
```

## Next Steps (Day 2)

Tomorrow (Day 2) we will:
1. Create Supabase project
2. Configure database connection
3. Create core database schema:
   - `locales` table
   - `world_regions`, `countries`, `cities` tables
   - `city_locales`, `city_translations` tables

## Notes

- Dev server runs on port 3000 (already running in background)
- Uses Turbopack for fast compilation
- All pages are Server Components by default
- Client Components will be added as needed in future phases

## Completion Checklist

- [x] Initialize Next.js 16 with TypeScript
- [x] Configure Tailwind CSS
- [x] Install next-intl
- [x] Configure i18n routing (en, nl, fr)
- [x] Create translation message files
- [x] Set up middleware for locale routing
- [x] Create home page with i18n support
- [x] Implement locale switcher
- [x] Build successfully
- [x] Document version decisions

---

**Day 1 Complete!** ✅

Ready to proceed to Day 2: Configure Supabase and create core database schema.
