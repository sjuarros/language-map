# Phase 4: Public Map with Translations

**Timeline:** Weeks 8-9 (Days 35-45)
**Status:** Not Started

## Overview

This phase implements the user-facing multilingual map interface with dynamic taxonomy-based filtering and city-specific styling.

## Key Deliverables

- ✅ Public can explore multilingual map
- ✅ City-specific dynamic filtering based on taxonomies
- ✅ Map styling driven by taxonomy visual settings
- ✅ Multi-language search
- ✅ Mobile responsive design
- ✅ Language detail popups with translations

## Weekly Breakdown

### Week 8 - Map Foundation
- Mapbox integration and basic map display
- Load language points from i18n-aware GeoJSON API
- Interactive features (zoom, pan, click)
- Clustering for performance

### Week 9 - Map Features & Dynamic Filters
- Dynamic taxonomy filtering (generated from city's taxonomies)
- Map styling from taxonomies (colors, sizes from taxonomy values)
- Search functionality (searches translated language names)
- Detail popups with translated descriptions
- Language switcher in map UI
- Mobile responsive design

## Critical Components

### API Endpoints
- `/[locale]/[citySlug]/api/geojson` - Language points with translations and taxonomy data

### Key Features Implemented
- Mapbox GL JS integration
- GeoJSON data loading with translations
- Dynamic filter generation from taxonomies
- Dynamic map styling from taxonomy visual settings
- Multi-language search (searches all locales)
- Interactive popups
- Locale switching
- Clustering for performance
- Mobile-optimized UI

## Documentation

Keep track of:
- Mapbox configuration and API usage
- GeoJSON API optimization strategies
- Dynamic styling expression patterns
- Filter generation logic
- Search algorithm implementation
- Performance optimization techniques
- Mobile-specific considerations
- Caching strategies

### Reusable Code from Amsterdam App

**See:** `reusable-code-checklist.md` in this folder for detailed guide on what to reuse.

**Quick Summary**:
- ✅ Copy 6 map icon SVG files from `/reusable-code/icons/`
- ✅ Copy Amsterdam constants (coordinates, zoom, bounds)
- ✅ Copy Mapbox icon sizing configuration (well-tuned step functions)
- ✅ Copy text label configuration
- ✅ Copy utility hooks (useWindowResize, isTouchEnabled)
- 📚 Reference layer filtering patterns (adapt for taxonomies)
- 📚 Reference map interaction patterns (click, hover, clustering)
- 📚 Reference popup component structure

## Important Patterns

### GeoJSON API
- Include locale in query
- Join with translations
- Include taxonomy data in properties
- Cache with appropriate TTL
- Optimize for large datasets

### Dynamic Styling
```typescript
// Generate Mapbox expressions from taxonomy data
const colorExpression = [
  'match',
  ['get', 'taxonomy_size'],
  'small', '#FFA500',
  'medium', '#FFD700',
  'large', '#FF4500',
  '#CCCCCC'  // default
]
```

### Dynamic Filtering
- Fetch city's taxonomies
- Generate filter UI dynamically
- No hardcoded filter options
- Apply filters to GeoJSON data

## Performance Considerations

- Enable Mapbox clustering for large datasets
- Implement proper caching for GeoJSON API
- Lazy load language details
- Optimize mobile bundle size
- Use appropriate Mapbox zoom levels

## Next Phase

Phase 5 will implement the static content management system, enabling cities to customize their About and Methodology pages.
