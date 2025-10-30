# Phase 5: Static Content Management

**Timeline:** Week 10 (Days 46-51)
**Status:** Not Started

## Overview

This phase implements a built-in CMS for city-specific pages, enabling cities to customize their About, Methodology, and other static pages using a section-based page builder.

## Key Deliverables

- ✅ Cities can customize About/Methodology pages
- ✅ Section-based page builder (hero, text, image, gallery, etc.)
- ✅ All content supports translations
- ✅ Asset management for uploaded files
- ✅ Dynamic page rendering from database

## Daily Breakdown

### Days 46-47: Static Pages Management
- Create static pages list
- Create static page form (slug, template, published status)
- Implement page translations (title, meta description)
- Test page creation

### Day 48: Page Section Builder
- Create section types (hero, text, image, gallery, video, team, partners, stats, cta, accordion, divider)
- Create section editor UI
- Implement section reordering (drag & drop)
- Add/delete section functionality
- Test section management

### Day 49: Page Section Translations
- Create section translation editor
- Different fields based on section type
- Support JSON content structure
- Test section translations across locales

### Day 50: Asset Management
- Create asset upload component
- Integrate with Supabase Storage
- Store asset metadata in `city_assets` table
- Create asset browser
- Test uploads and file management

### Day 51: Dynamic Page Rendering
- Create dynamic page route `/[locale]/[citySlug]/[pageSlug]`
- Fetch page sections with translations
- Render sections using appropriate components
- Test page rendering in multiple locales

## Critical Components

### Database Tables Used
- `static_pages` (slug, template, is_published)
- `static_page_translations` (title, meta_description per locale)
- `page_sections` (section_type, display_order, config)
- `page_section_translations` (content JSON per locale)
- `city_assets` (uploaded files metadata)

### Section Types Implemented
- **hero** - Large image with title overlay
- **text** - Rich text blocks (Markdown/HTML)
- **image** - Single image with caption
- **gallery** - Multiple images in grid
- **video** - Embedded videos
- **team** - Team member cards
- **partners** - Partner logo grid
- **stats** - Statistics cards
- **cta** - Call-to-action buttons
- **accordion** - FAQ-style expandable items
- **divider** - Visual separator

## Documentation

Keep track of:
- Section component specifications
- Content JSON schema for each section type
- Asset storage structure
- Page rendering patterns
- Translation workflow for CMS content
- Drag-and-drop implementation
- Rich text editor configuration

## Important Patterns

### Dynamic Rendering
```tsx
const SECTION_COMPONENTS = {
  hero: Hero,
  text: TextBlock,
  team: TeamSection,
  // ...
}

sections.map(section => {
  const Component = SECTION_COMPONENTS[section.section_type]
  return <Component content={section.content} config={section.config} />
})
```

### Asset Management
- Store files in Supabase Storage
- Organize by city (`/cities/{citySlug}/assets/`)
- Track metadata in database
- Support images, videos, documents
- Implement file browser UI

## SEO Considerations

- Meta tags from page translations
- Open Graph tags
- Structured data (JSON-LD)
- Sitemap generation

## Next Phase

Phase 6 will enable multi-city views and comparison features, allowing users to explore data from multiple cities simultaneously.
