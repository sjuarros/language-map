# Phase 2: Reference Data & Operator CRUD

**Timeline:** Weeks 4-6 (Days 17-29)
**Status:** Not Started

## Overview

This phase implements the operator dashboard with full CRUD capabilities for geographic hierarchy, flexible taxonomies, and multilingual language data management.

## Key Deliverables

- ✅ Operators can manage geography (districts, neighborhoods)
- ✅ Admins can define custom taxonomies per city
- ✅ Operators can manage multilingual language data
- ✅ Flexible taxonomy system replaces hardcoded enums
- ✅ All data supports translations

## Weekly Breakdown

### Week 4 - Districts, Neighborhoods & Taxonomies
- District management UI (CRUD with translations)
- Neighborhood management UI (CRUD with translations, linked to districts)
- Taxonomy types management (define classification systems)
- Taxonomy values management (define values with visual styling)

### Week 5 - Languages with Flexible Classification
- Language family management (CRUD with translations)
- Language management - basic CRUD with taxonomy assignment UI
- Language translations UI (translated names per locale, endonym is universal)
- Language points management (with neighborhood picker)
- Test taxonomy filtering and map styling

### Week 6 - Descriptions
- Descriptions management (CRUD with translations)
- Description translations UI (multi-language rich text editor)
- End-to-end testing of all operator CRUD flows

## Critical Components

### Database Tables Used
- `districts`, `district_translations`
- `neighborhoods`, `neighborhood_translations`
- `taxonomy_types`, `taxonomy_type_translations`
- `taxonomy_values`, `taxonomy_value_translations`
- `language_taxonomies` (junction table)
- `language_families`, `language_family_translations`
- `languages`, `language_translations`
- `language_points`
- `descriptions`, `description_translations`

### Key Features Implemented
- Flexible taxonomy system (city-specific classifications)
- Dynamic taxonomy assignment UI
- Multi-language CRUD operations
- Rich text editing for descriptions
- Neighborhood-based data organization

## Documentation

Keep track of:
- Taxonomy system design decisions
- Form validation patterns
- Translation workflow for operators
- Data model relationships
- UI component patterns
- Reusable form components

## Important Patterns

### Taxonomy System
- Taxonomies are NOT hardcoded enums
- Each city defines its own classification systems
- Taxonomy values include visual styling (colors, icons, sizes)
- Map styling is driven by taxonomies

### Translation Pattern
- Endonym is universal (NOT translated)
- Language names are translated per locale
- All user-facing content supports translations
- AI tracking fields on all translation tables

## Next Phase

Phase 3 will add CSV import functionality and AI-powered description generation to streamline data entry.
