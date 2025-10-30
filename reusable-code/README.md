# Reusable Code from Amsterdam Language Map

This folder contains code extracted from the original Amsterdam Language Map for reuse in the new Next.js + Supabase platform.

## 📁 Contents

### Directly Reusable
- **`icons/`** - Map marker SVG icons (book, circle, home, museum, tree, users)
- **`config.points.ts`** - Mapbox layer configuration (icon sizing, text labels)
- **`config.ts`** - Map initialization (Amsterdam coords, zoom, bounds)

### Reference Only (Adapt for new architecture)
- **`utils.ts`** - Utility functions (some reusable: useWindowResize, isTouchEnabled)
- **`types-reference.ts`** - TypeScript types (field names changed in new DB!)
- **`hooks-reference/`** - Pattern examples (rewrite for Supabase + TanStack Query)

## 🎯 Quick Start

1. **Icons**: Copy to `/public/map-icons/` in new project
2. **Map config**: Reference when setting up react-map-gl v7
3. **Types**: Use as reference for field naming conventions
4. **Utils**: Copy individual functions as needed (remove MUI deps)

## ⚠️ Important Notes

- **Do NOT** copy React Router code (Next.js 14 routing is different)
- **Do NOT** copy Material-UI components (using Shadcn/ui now)
- **Do NOT** copy Airtable hooks (using Supabase now)
- **Adapt** all type definitions for new i18n database schema

## 📚 See Full Guide

Refer to `CODE_REUSE_GUIDE.md` for detailed instructions on what to reuse and how.

---

Extracted: $(date)
